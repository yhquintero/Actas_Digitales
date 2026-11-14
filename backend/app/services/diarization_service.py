"""
Detección de participantes (diarización ligera) — 100% local, sin modelos externos.

Pipeline:
  1. VAD adaptativo (energía RMS en dB con puente entre silencios cortos).
  2. Rasgos: 13 MFCC (media + desviación estándar por región), con CMN y L2.
  3. Agrupamiento: k-medias determinista (k-medias++ semilla 42) para k = 1..4,
     selección por silueta (los singletons valen 0 para que k = n no gane por accidente).
  4. Turnos adyacentes del mismo participante fusionados; etiquetas por orden de
     aparición: `Participante 1..N`.

Honestidad de alcance (documentado también en la Web y los manuales):
  - Distingue *voces distintas* por rasgos acústicos; NO identifica personas,
    NO compara entre sesiones y NO atribuye nombres.
  - El habla solapada se atribuye al participante dominante.
  - Voces muy similares pueden unirse; calidad óptima con 2–4 voces bien diferenciadas.
  - Si el audio es demasiado corto o la diarización falla, devuelve k=1 (o vacío)
    sin romper el pipeline.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import numpy as np

SAMPLE_RATE = 16000
FRAME_MS = 25
HOP_MS = 10
N_FFT = 512
N_MELS = 40
N_MFCC = 13
MIN_REGION_S = 0.5
MAX_SPEAKERS = 4
SEED = 42


@dataclass
class SpeakerTurn:
    speaker: str
    start_time: float
    end_time: float


def _rms_db(frames: np.ndarray) -> np.ndarray:
    rms = np.sqrt(np.mean(frames.astype(np.float64) ** 2, axis=1) + 1e-12)
    return 20.0 * np.log10(np.maximum(rms, 1e-6))


def _frame_signal(signal: np.ndarray, sr: int, frame_ms: int = FRAME_MS, hop_ms: int = HOP_MS) -> np.ndarray:
    frame_len = int(sr * frame_ms / 1000)
    hop_len = int(sr * hop_ms / 1000)
    if len(signal) < frame_len:
        padded = np.zeros(frame_len, dtype=np.float32)
        padded[: len(signal)] = signal
        return padded.reshape(1, frame_len)
    n_frames = 1 + (len(signal) - frame_len) // hop_len
    shape = (n_frames, frame_len)
    strides = (signal.strides[0] * hop_len, signal.strides[0])
    return np.lib.stride_tricks.as_strided(signal, shape=shape, strides=strides).copy()


def _compute_vad_threshold(db: np.ndarray) -> float:
    """
    Umbral adaptativo: si hay suficiente silencio real (≥15% del audio bajo pico−40 dB),
    usa el percentil 90 de ese silencio +10 dB (acotado). Si no, pico−30 dB.
    """
    peak = float(np.max(db))
    deep = db[db < peak - 40.0]
    if deep.size >= max(5, int(0.15 * db.size)):
        noise = float(np.percentile(deep, 90))
        return float(min(noise + 10.0, peak - 8.0))
    return max(peak - 30.0, -52.0)


def _vad_regions(signal: np.ndarray, sr: int) -> List[Tuple[int, int]]:
    frames = _frame_signal(signal, sr)
    db = _rms_db(frames)
    threshold = _compute_vad_threshold(db)
    speech = db >= threshold

    hop = int(sr * HOP_MS / 1000)
    frame_len = int(sr * FRAME_MS / 1000)
    regions: List[Tuple[int, int]] = []
    in_region, start = False, 0
    for i, is_speech in enumerate(speech):
        if is_speech and not in_region:
            in_region, start = True, i
        elif not is_speech and in_region:
            regions.append((start * hop, start * hop + frame_len))
            in_region = False
    if in_region:
        regions.append((start * hop, start * hop + (len(speech) - 1) * hop + frame_len))

    # Puente de silencios cortos (<350 ms) y descarte de regiones <0.5 s
    merged: List[Tuple[int, int]] = []
    for s, e in regions:
        if merged and (s - merged[-1][1]) < int(0.35 * sr):
            merged[-1] = (merged[-1][0], e)
        else:
            merged.append((s, e))
    return [(s, min(e, len(signal))) for s, e in merged if (e - s) >= int(MIN_REGION_S * sr)]


def _mel_filterbank(sr: int, n_fft: int, n_mels: int, f_max: Optional[float] = None) -> np.ndarray:
    f_max = f_max or sr / 2.0

    def hz_to_mel(f: float) -> float:
        return 2595.0 * np.log10(1.0 + f / 700.0)

    def mel_to_hz(m: float) -> float:
        return 700.0 * (10.0 ** (m / 2595.0) - 1.0)

    mels = np.linspace(hz_to_mel(0.0), hz_to_mel(f_max), n_mels + 2)
    hzs = mel_to_hz(mels)
    bins = np.floor((n_fft + 1) * hzs / sr).astype(int)
    filters = np.zeros((n_mels, n_fft // 2 + 1), dtype=np.float64)
    for i in range(1, n_mels + 1):
        left, center, right = bins[i - 1], bins[i], bins[i + 1]
        if center == left:
            center += 1
        if right == center:
            right += 1
        for j in range(left, center):
            if j < filters.shape[1]:
                filters[i - 1, j] = (j - left) / max(1, center - left)
        for j in range(center, right):
            if j < filters.shape[1]:
                filters[i - 1, j] = (right - j) / max(1, right - center)
    return filters


_MEL_CACHE: dict = {}


def _mfcc_matrix(frames: np.ndarray, sr: int) -> np.ndarray:
    key = (sr, N_FFT, N_MELS)
    if key not in _MEL_CACHE:
        _MEL_CACHE[key] = _mel_filterbank(sr, N_FFT, N_MELS)
    mel_fb = _MEL_CACHE[key]

    emphasized = np.append(frames[:, :1], frames[:, 1:] - 0.97 * frames[:, :-1], axis=1)
    window = np.hamming(emphasized.shape[1])
    spectrum = np.abs(np.fft.rfft(emphasized * window, n=N_FFT)) ** 2
    energies = np.sum(spectrum, axis=1, keepdims=True) + 1e-10
    mel = np.log(spectrum.dot(mel_fb.T) + 1e-10)
    mfcc = np.fft.rfft(mel, axis=1)[:, :N_MFCC].real
    return np.hstack([np.log10(energies), mfcc])


def _f0_frame(frame: np.ndarray, sr: int) -> Tuple[float, bool]:
    """F0 por autocorrelación en [70, 400] Hz. Devuelve (f0, voiced)."""
    x = frame - frame.mean()
    energy = float(np.dot(x, x))
    if energy < 1e-6:
        return 0.0, False
    corr = np.correlate(x, x, mode="full")[len(x) - 1:]
    lo, hi = int(sr / 400), int(sr / 70)
    if hi >= len(corr):
        hi = len(corr) - 1
    seg = corr[lo:hi]
    if seg.size == 0:
        return 0.0, False
    peak_idx = int(np.argmax(seg)) + lo
    peak = corr[peak_idx]
    if peak < 0.45 * corr[0]:
        return 0.0, False
    return sr / peak_idx, True


def _f0_stats(frames: np.ndarray, sr: int) -> Tuple[float, float, float]:
    f0s, voiced = [], 0
    for frame in frames:
        f0, is_voiced = _f0_frame(frame.astype(np.float64), sr)
        if is_voiced:
            f0s.append(f0)
            voiced += 1
    if not f0s:
        return 0.0, 0.0, 0.0
    arr = np.array(f0s)
    return (float(arr.mean() / 300.0), float(arr.std() / 150.0), float(voiced / len(frames)))


def _region_features(signal: np.ndarray, sr: int, start: int, end: int) -> Optional[np.ndarray]:
    segment = signal[start:end]
    if len(segment) < int(0.25 * sr):
        return None
    frames = _frame_signal(segment, sr, frame_ms=25, hop_ms=10)
    feats = _mfcc_matrix(frames, sr)
    f0_mean, f0_std, voiced_ratio = _f0_stats(frames, sr)
    mean = feats.mean(axis=0)
    std = feats.std(axis=0)
    vec = np.concatenate([mean, std, [2.0 * f0_mean, 2.0 * f0_std, voiced_ratio]])
    vec = vec - vec.mean()  # CMN
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec


def _silhouette_scores(X: np.ndarray, labels: np.ndarray) -> float:
    n = len(X)
    if n < 2:
        return -1.0
    dists = np.sqrt(np.sum((X[:, None, :] - X[None, :, :]) ** 2, axis=2))
    scores = []
    unique = np.unique(labels)
    for i in range(n):
        same = labels == labels[i]
        if same.sum() <= 1:
            scores.append(0.0)  # singletons no puntúan (sklearn-like)
            continue
        a = dists[i, same].sum() / (same.sum() - 1)
        b = min(
            dists[i, labels == k].mean() if (labels == k).any() else np.inf
            for k in unique if k != labels[i]
        )
        denom = max(a, b)
        scores.append((b - a) / denom if denom > 0 else 0.0)
    return float(np.mean(scores))


def _kmeans_pp(X: np.ndarray, k: int, seed: int = SEED, n_init: int = 8, max_iter: int = 60) -> Tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    best_labels, best_inertia, best_centroids = None, np.inf, None
    for _ in range(n_init):
        centroids = [X[rng.integers(len(X))]]
        while len(centroids) < k:
            d2 = np.array([min(np.sum((x - c) ** 2) for c in centroids) for x in X])
            probs = d2 / d2.sum() if d2.sum() > 0 else np.ones(len(X)) / len(X)
            centroids.append(X[rng.choice(len(X), p=probs)])
        centroids = np.array(centroids)
        labels = np.zeros(len(X), dtype=int)
        for _ in range(max_iter):
            dists = np.sqrt(np.sum((X[:, None, :] - centroids[None, :, :]) ** 2, axis=2))
            new_labels = dists.argmin(axis=1)
            if np.array_equal(new_labels, labels):
                break
            labels = new_labels
            for j in range(k):
                members = X[labels == j]
                if len(members):
                    centroids[j] = members.mean(axis=0)
        inertia = float(np.sum((X - centroids[labels]) ** 2))
        if inertia < best_inertia:
            best_inertia, best_labels, best_centroids = inertia, labels, centroids
    return best_labels, best_centroids


MIN_CLUSTER_FRAC = 0.12  # un cluster "hablante" debe tener ≥12% de ventanas de voz


def _choose_k(X: np.ndarray) -> Tuple[int, np.ndarray, Optional[np.ndarray]]:
    """Selecciona k = 1..4 por silueta; exige mejora (>0.05) sobre 1 voz.

    Un candidato k queda invalidado si algún cluster resultante es menor que
    max(3, 12%) de las ventanas: ese cluster suele ser el residuo de las ventas
    mixtas (cambios de turno), no un hablante real, y la silueta lo premia.
    """
    if len(X) < 2:
        return 1, np.zeros(len(X), dtype=int), None
    min_cluster = max(3, int(np.ceil(MIN_CLUSTER_FRAC * len(X))))
    best_k, best_sil, best_labels, best_centroids = 1, 0.05, np.zeros(len(X), dtype=int), None
    for k in range(2, min(MAX_SPEAKERS, len(X)) + 1):
        labels, centroids = _kmeans_pp(X, k)
        if min(np.bincount(labels, minlength=k)) < min_cluster:
            continue
        sil = _silhouette_scores(X, labels)
        if sil > best_sil:
            best_k, best_sil, best_labels, best_centroids = k, sil, labels, centroids
    return best_k, best_labels, best_centroids


def _windowed_features(signal: np.ndarray, sr: int, window_s: float = 0.6, hop_s: float = 0.3):
    """Ventanas deslizantes con voz. Devuelve lista de dicts (start, end, vec, voiced_ratio).

    Las ventanas que cruzan silencios (voiced_ratio < 0.75) se conservan para asignación
    posterior, pero nunca alimentan el entrenamiento: introducirían un cluster fantasma.
    """
    win = int(window_s * sr)
    hop = int(hop_s * sr)
    frames = _frame_signal(signal, sr)
    db = _rms_db(frames)
    threshold = _compute_vad_threshold(db)
    hop_len = int(sr * HOP_MS / 1000)

    windows = []
    for start in range(0, max(1, len(signal) - win + 1), hop):
        f0 = start // hop_len
        f1 = min(len(db), (start + win) // hop_len + 1)
        ratio = float((db[f0:f1] >= threshold).mean()) if f1 > f0 else 0.0
        if ratio < 0.4:
            continue
        vec = _region_features(signal, sr, start, start + win)
        if vec is not None:
            windows.append({"start": start, "end": start + win, "vec": vec, "voiced_ratio": ratio})
    return windows


def diarize(signal: np.ndarray, sr: int = SAMPLE_RATE) -> dict:
    """Devuelve {num_speakers, turns, speech_ratio, regions, windows}."""
    if signal is None or len(signal) < int(1.5 * sr):
        return {"num_speakers": 1, "turns": [], "speech_ratio": 0.0, "regions": 0, "windows": 0}

    frames = _frame_signal(signal, sr)
    db = _rms_db(frames)
    threshold = _compute_vad_threshold(db)
    speech_ratio = float(np.mean(db >= threshold)) if db.size else 0.0
    duration = len(signal) / sr

    windows = _windowed_features(signal, sr)
    if len(windows) < 3:
        turns = ([{"speaker": "Participante 1", "start_time": 0.0, "end_time": round(duration, 2)}]
                 if speech_ratio > 0.05 else [])
        return {"num_speakers": 1, "turns": turns, "speech_ratio": round(speech_ratio, 3),
                "regions": 0, "windows": len(windows)}

    pure = [w for w in windows if w["voiced_ratio"] >= 0.75] or windows
    X_train = np.array([w["vec"] for w in pure])
    k, _, centroids = _choose_k(X_train)
    if centroids is None:
        labels = np.zeros(len(windows), dtype=int)
    else:
        X_all = np.array([w["vec"] for w in windows])
        dists = np.sqrt(np.sum((X_all[:, None, :] - centroids[None, :, :]) ** 2, axis=2))
        labels = dists.argmin(axis=1)

    # Reetiquetar por orden de aparición (Participante 1 = quien habla primero)
    first_appearance = {}
    for idx, lab in enumerate(labels):
        first_appearance.setdefault(int(lab), idx)
    order = sorted(first_appearance.items(), key=lambda kv: kv[1])
    remap = {lab: rank + 1 for rank, (lab, _) in enumerate(order)}

    # Turnos: agrupar ventanas adyacentes del mismo participante
    merge_gap = int(0.9 * sr)
    turns: List[dict] = []
    for w, lab in zip(windows, labels):
        start, end = w["start"], w["end"]
        speaker = f"Participante {remap[int(lab)]}"
        if turns and turns[-1]["speaker"] == speaker and (start - turns[-1]["end_sample"]) < merge_gap:
            turns[-1]["end_sample"] = end
        else:
            turns.append({"speaker": speaker, "start_sample": start, "end_sample": end})

    out_turns = [
        {"speaker": t["speaker"],
         "start_time": round(t["start_sample"] / sr, 2),
         "end_time": round(t["end_sample"] / sr, 2)}
        for t in turns
    ]

    return {
        "num_speakers": len({t["speaker"] for t in out_turns}),
        "turns": out_turns,
        "speech_ratio": round(speech_ratio, 3),
        "regions": 0,
        "windows": len(windows),
    }


def assign_segment_speakers(turns: List[dict], segments: List) -> List[Optional[str]]:
    """Asocia cada segmento transcrito al participante con mayor solape temporal."""
    labels = []
    for seg in segments:
        best, best_overlap = None, 0.0
        for turn in turns:
            overlap = min(seg.end_time, turn["end_time"]) - max(seg.start_time, turn["start_time"])
            if overlap > best_overlap:
                best_overlap, best = overlap, turn["speaker"]
        labels.append(best if best_overlap > 0.05 else None)
    return labels
