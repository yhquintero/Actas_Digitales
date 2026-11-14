#!/usr/bin/env python3
"""Prueba reproducible de v1.6.0: diarización y extracción de pistas.

[1] Diarización con 2 voces sintéticas claramente diferenciadas → 2 participantes,
    turnos alternos correctos.
[2] Vídeo sintético de 2 pistas de audio → extracción de las 2 como WAV 16 kHz mono,
    SHA-256 verificable y metadatos de codec/canales.
[3] Asignación de participantes a segmentos transcritos por solape.

Sintético = sin dependencia de grabaciones reales ni de la red.
Uso:  python3 tools/test_audio_inteligente.py
"""
import hashlib
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402

SR = 16000


def make_two_speaker_wav(path: Path) -> Path:
    """P1 (tono grave, vibrato lento) · P2 (tono agudo, vibrato rápido), alternando."""
    rng = np.random.default_rng(7)

    def voice(freq, formant, seconds, amp=0.55):
        """Timbre armónico: fundamental + armónicos con formante propio."""
        t = np.arange(int(seconds * SR)) / SR
        f0 = freq + 8 * np.sin(2 * np.pi * 4.5 * t)  # vibrato leve
        phase = 2 * np.pi * np.cumsum(f0) / SR
        harmonics = [1, 2, 3, 4, 5, 6]
        weights = [np.exp(-0.5 * ((h * freq - f) / 320.0) ** 2) for f, h in [(formant, h) for h in harmonics]]
        weights = np.array(weights)
        weights = weights / weights.sum()
        tone = np.zeros_like(t)
        for h, w in zip(harmonics, weights):
            tone += w * np.sin(h * phase)
        # "sílabas": envolvente de energía por bursts ~4 Hz
        envelope = (0.55 + 0.45 * np.sin(2 * np.pi * 3.7 * t)) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 0.9 * t)))
        noise = 0.02 * rng.standard_normal(len(t))
        return (amp * tone * envelope + noise).astype(np.float32)

    pieces = [
        voice(110.0, 750.0, 3.3),
        np.zeros(int(0.25 * SR), dtype=np.float32),
        voice(220.0, 1150.0, 3.8),
        np.zeros(int(0.25 * SR), dtype=np.float32),
        voice(112.0, 700.0, 3.35),
        np.zeros(int(0.22 * SR), dtype=np.float32),
        voice(225.0, 1250.0, 3.5),
    ]
    signal = np.concatenate(pieces)
    pcm = (np.clip(signal, -1.0, 1.0) * 32767).astype(np.int16)

    import wave
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())
    return path


def make_multi_track_video(path: Path) -> Path:
    """Vídeo mínimo con 2 pistas de audio (AAC) de tonos distintos."""
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg, "-y",
        "-f", "lavfi", "-i", "testsrc=size=128x96:rate=1:duration=5",
        "-f", "lavfi", "-i", "sine=frequency=110:duration=5",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=5",
        "-map", "0:v:0", "-map", "1:a:0", "-map", "2:a:0",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "48k",
        "-shortest",
        str(path),
    ]
    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=120)
    if res.returncode != 0:
        raise RuntimeError(f"ffmpeg falló: {res.stderr.decode('utf-8', errors='replace')[-300:]}")
    return path


def main() -> int:
    ok = True
    from backend.app.services.diarization_service import diarize, assign_segment_speakers
    from backend.app.services.audio_service import AudioService
    from backend.app.models.job import AudioSegment

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        wav = make_two_speaker_wav(tmp_path / "reunion_test.wav")

        # ---------- [1] Diarización ----------
        signal, sr = AudioService.load_pcm_mono(wav)
        dia = diarize(signal, sr)
        print(f"[1] Diarización: num_speakers={dia['num_speakers']} turnos={len(dia['turns'])} ratio_voz={dia['speech_ratio']}")
        for t in dia["turns"]:
            print(f"     · {t['speaker']}: {t['start_time']:.2f}s → {t['end_time']:.2f}s")
        speakers = {t["speaker"] for t in dia["turns"]}
        check1 = dia["num_speakers"] == 2
        check2 = speakers == {"Participante 1", "Participante 2"}
        check3 = dia["speech_ratio"] > 0.5
        print(f"     · 2 participantes={'OK' if check1 else 'FALLO'} · etiquetas={'OK' if check2 else 'FALLO'} · ratio_voz={'OK' if check3 else 'FALLO'}")
        ok = ok and check1 and check2 and check3

        # ---------- [2] Extracción multipista ----------
        video = make_multi_track_video(tmp_path / "multipistas.mp4")
        probe = AudioService.list_audio_streams(video)
        print(f"[2] Pistas detectadas: {len(probe.get('tracks', []))} (duración {probe.get('duration_seconds')}s)")
        probe_ok = bool(probe.get("ok")) and len(probe.get("tracks", [])) == 2
        print(f"     · 2 pistas detectadas={'OK' if probe_ok else 'FALLO'}")
        ok = ok and probe_ok
        for track in probe.get("tracks", []):
            out = tmp_path / f"track_{track['track_index']}.wav"
            ok_ext, detail = AudioService.extract_audio_track(video, track["track_index"], out)
            sha = hashlib.sha256(out.read_bytes()).hexdigest() if ok_ext else None
            print(f"     · pista {track['track_index']} (códec={track['codec']} {track['channels']}ch @{track['sample_rate']}Hz): "
                  f"extracción={'OK' if ok_ext else 'FALLO'} sha256={sha[:12] if sha else '-'}…")
            ok = ok and ok_ext and out.stat().st_size > 1000

        # ---------- [3] Asignación a segmentos ----------
        segments = [
            AudioSegment(id=0, start_time=0.0, end_time=3.2, text="Intervención de apertura."),
            AudioSegment(id=1, start_time=3.5, end_time=7.4, text="Réplica de la secretaría."),
            AudioSegment(id=2, start_time=7.8, end_time=11.1, text="Contra-réplica de presidencia."),
        ]
        labels = assign_segment_speakers(dia["turns"], segments)
        print(f"[3] Segmentos asignados: {list(zip([s.id for s in segments], labels))}")
        seg_ok = labels[0] == "Participante 1" and labels[1] == "Participante 2" and labels[2] == "Participante 1"
        print(f"     · asignación a segmentos={'OK' if seg_ok else 'FALLO'}")
        ok = ok and seg_ok

    print('\nRESULTADO:', 'todas las pruebas superadas ✔' if ok else 'FALLOS DETECTADOS ✘')
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
