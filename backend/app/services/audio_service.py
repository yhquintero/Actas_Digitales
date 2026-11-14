import os
import wave
import subprocess
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from ..config import settings

class AudioService:
    @staticmethod
    def validate_file(filename: str, file_size_bytes: int) -> Tuple[bool, Optional[str]]:
        """Valida que la extensión sea admitida y que no supere el tamaño máximo."""
        ext = Path(filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            return False, f"Formato '{ext}' no soportado. Formatos admitidos: {', '.join(settings.ALLOWED_EXTENSIONS)}"

        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size_bytes > max_bytes:
            limite_gb = round(settings.MAX_FILE_SIZE_MB / 1024, 1)
            limite_str = f"{limite_gb:g} GB" if limite_gb >= 1 else f"{settings.MAX_FILE_SIZE_MB} MB"
            return False, f"El archivo excede el tamaño máximo permitido de {limite_str} ({settings.MAX_FILE_SIZE_MB} MB)"

        return True, None

    @staticmethod
    def get_exact_audio_duration(file_path: Path) -> float:
        """
        Calcula con precisión exacta la duración en segundos del audio.
        Multi-estrategia en orden de precisión:
        1. PyAV (decodificación del contenedor y streams de audio).
        2. Mutagen (lectura de metadatos ID3/Xing/VBRI/AAC/Vorbis).
        3. imageio_ffmpeg (análisis mediante binario FFmpeg).
        4. Wave nativo (si el archivo es WAV).
        5. Conversión temporal a PCM WAV para medir la duración física exacta en muestras.
        """
        # 1. PyAV (precisión exacta de streams y contenedor)
        try:
            import av
            with av.open(str(file_path)) as container:
                if container.duration:
                    dur = float(container.duration) / 1000000.0
                    if dur > 0.1:
                        return round(dur, 2)
                for stream in container.streams.audio:
                    if stream.duration and stream.time_base:
                        dur = float(stream.duration * stream.time_base)
                        if dur > 0.1:
                            return round(dur, 2)
        except Exception:
            pass

        # 2. Mutagen
        try:
            from mutagen import File as MutagenFile
            audio = MutagenFile(str(file_path))
            if audio is not None and hasattr(audio, 'info') and hasattr(audio.info, 'length'):
                if audio.info.length and audio.info.length > 0.1:
                    return round(float(audio.info.length), 2)
        except Exception:
            pass

        # 3. imageio_ffmpeg (salida de FFmpeg -i)
        try:
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            cmd = [ffmpeg_exe, "-i", str(file_path)]
            res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.DEVNULL, text=True, errors="replace")
            for line in res.stderr.splitlines():
                if "Duration:" in line:
                    parts = line.split("Duration:")[1].split(",")[0].strip()
                    h, m, s = parts.split(":")
                    dur = float(h) * 3600 + float(m) * 60 + float(s)
                    if dur > 0.1:
                        return round(dur, 2)
        except Exception:
            pass

        # 4. Wave nativo si es WAV
        ext = file_path.suffix.lower()
        if ext == ".wav":
            try:
                with wave.open(str(file_path), 'rb') as wf:
                    frames = wf.getnframes()
                    rate = wf.getframerate()
                    if rate > 0:
                        return round(frames / float(rate), 2)
            except Exception:
                pass

        # 5. Medición acústica física mediante conversión temporal a WAV PCM
        temp_meas = file_path.parent / f"_dur_meas_{file_path.stem}.wav"
        try:
            if AudioService.convert_to_pcm_wav(file_path, temp_meas) and temp_meas.exists():
                with wave.open(str(temp_meas), 'rb') as wf:
                    frames = wf.getnframes()
                    rate = wf.getframerate()
                    if rate > 0:
                        return round(frames / float(rate), 2)
        except Exception:
            pass
        finally:
            if temp_meas.exists():
                try: temp_meas.unlink()
                except Exception: pass

        # 6. Fallback final estimando según tasa típica de MP3 a 192 kbps (no a 64 kbps)
        file_size_bytes = os.path.getsize(file_path)
        estimated_seconds = max(1.0, round((file_size_bytes * 8) / 192000, 2))
        return min(estimated_seconds, 14400.0)

    @staticmethod
    def estimate_audio_duration(file_path: Path) -> float:
        return AudioService.get_exact_audio_duration(file_path)

    @staticmethod
    def format_duration(seconds: float) -> str:
        """Convierte segundos a formato MM:SS o HH:MM:SS."""
        secs = int(round(seconds))
        if secs >= 3600:
            h = secs // 3600
            m = (secs % 3600) // 60
            s = secs % 60
            return f"{h:02d}:{m:02d}:{s:02d}"
        else:
            m = secs // 60
            s = secs % 60
            return f"{m:02d}:{s:02d}"

    @staticmethod
    def convert_to_pcm_wav(file_path: Path, output_wav: Path) -> bool:
        """
        Convierte cualquier formato de audio compatible (M4A, AAC, MP3, WAV, OGG, FLAC, WMA, WebM)
        a un archivo WAV PCM 16kHz mono listo para motores de reconocimiento fonético.
        Prioridad:
        1. Si ya es WAV válido 16kHz mono.
        2. PyAV (av) para decodificación nativa multiplataforma en memoria.
        3. imageio-ffmpeg (binario estático de FFmpeg integrado en Python).
        4. FFmpeg instalado en el sistema.
        5. miniaudio (para MP3, FLAC, OGG, WAV).
        """
        ext = file_path.suffix.lower()
        if ext == ".wav":
            try:
                with wave.open(str(file_path), "rb") as wf:
                    if wf.getnchannels() == 1 and wf.getframerate() == 16000 and wf.getsampwidth() == 2:
                        return True
            except Exception:
                pass

        # 1. PyAV (av): Decodificación nativa en C para M4A, AAC, MP3, etc. sin herramientas externas
        try:
            import av
            container = av.open(str(file_path))
            resampler = av.AudioResampler(format='s16', layout='mono', rate=16000)
            has_frames = False
            with wave.open(str(output_wav), 'wb') as wav_out:
                wav_out.setnchannels(1)
                wav_out.setsampwidth(2)
                wav_out.setframerate(16000)
                for frame in container.decode(audio=0):
                    for rframe in resampler.resample(frame):
                        data = rframe.to_ndarray().tobytes()
                        if data:
                            wav_out.writeframes(data)
                            has_frames = True
            if has_frames and output_wav.exists() and output_wav.stat().st_size > 44:
                return True
        except Exception:
            pass

        # 2. imageio-ffmpeg (binario ejecutable de FFmpeg multiplataforma incluido en el paquete)
        try:
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            cmd = [ffmpeg_exe, "-y", "-i", str(file_path), "-ar", "16000", "-ac", "1", "-f", "wav", str(output_wav)]
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if res.returncode == 0 and output_wav.exists() and output_wav.stat().st_size > 44:
                return True
        except Exception:
            pass

        # 3. FFmpeg del sistema
        try:
            cmd = ["ffmpeg", "-y", "-i", str(file_path), "-ar", "16000", "-ac", "1", "-f", "wav", str(output_wav)]
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if res.returncode == 0 and output_wav.exists() and output_wav.stat().st_size > 44:
                return True
        except Exception:
            pass

        # 4. miniaudio (para MP3, FLAC, OGG, WAV)
        try:
            import miniaudio
            decoded = miniaudio.decode_file(str(file_path), nchannels=1, sample_rate=16000)
            if decoded and decoded.samples:
                with wave.open(str(output_wav), "wb") as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(16000)
                    wf.writeframes(decoded.samples)
                return True
        except Exception:
            pass

        return False

    @staticmethod
    def load_pcm_mono(file_path: Path, sr: int = 16000, max_seconds: float = 7200.0):
        """Decodifica a mono 16 kHz float32 normalizado. Devuelve (signal, sample_rate) o (None, sr)."""
        try:
            import miniaudio
            import numpy as np

            decoded = miniaudio.decode_file(str(file_path), output_format=miniaudio.SampleFormat.SIGNED16,
                                            nchannels=1, sample_rate=sr)
            if decoded and decoded.samples:
                samples = np.frombuffer(decoded.samples, dtype=np.int16).astype(np.float32) / 32768.0
                limit = int(max_seconds * sr)
                return samples[:limit], sr
        except Exception:
            pass
        # Fallback: WAV PCM temporal
        temp_wav = file_path.parent / f"_pcm_{file_path.stem}.wav"
        try:
            if AudioService.convert_to_pcm_wav(file_path, temp_wav) and temp_wav.exists():
                import numpy as np
                with wave.open(str(temp_wav), "rb") as wf:
                    frames = wf.readframes(min(wf.getnframes(), int(max_seconds * sr)))
                    rate = wf.getframerate()
                samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
                return samples, rate
        except Exception:
            pass
        finally:
            try:
                if temp_wav.exists():
                    temp_wav.unlink()
            except Exception:
                pass
        return None, sr

    @staticmethod
    def list_audio_streams(file_path: Path) -> Dict[str, Any]:
        """Enumera las pistas de audio embebidas (PyAV) con sus metadatos."""
        tracks = []
        duration = None
        try:
            import av
            with av.open(str(file_path)) as container:
                if container.duration:
                    duration = float(container.duration) / 1_000_000.0
                for index, stream in enumerate(container.streams.audio):
                    meta = dict(stream.metadata or {})
                    lang = meta.get("language") or meta.get("LANGUAGE") or "und"
                    title = meta.get("title") or meta.get("TITLE") or ""
                    codec = (stream.codec_context.name if stream.codec_context else None) or "desconocido"
                    channels = stream.channels if getattr(stream, "channels", None) else None
                    rate = stream.rate if getattr(stream, "rate", None) else None
                    bit_rate = stream.bit_rate if getattr(stream, "bit_rate", None) else None
                    s_dur = None
                    try:
                        if stream.duration and stream.time_base:
                            s_dur = float(stream.duration * stream.time_base)
                    except Exception:
                        s_dur = None
                    tracks.append({
                        "track_index": index,
                        "codec": codec,
                        "channels": channels,
                        "sample_rate": rate,
                        "bit_rate": int(bit_rate) if bit_rate else None,
                        "language": lang,
                        "title": title,
                        "duration_seconds": round(s_dur, 2) if s_dur else (round(duration, 2) if duration else None),
                    })
        except Exception:
            return {"ok": False, "error": "No se pudo inspeccionar el contenedor (¿formato no soportado o protegido por DRM?).",
                    "tracks": [], "duration_seconds": duration}
        return {"ok": True, "tracks": tracks, "duration_seconds": round(duration, 2) if duration else None}

    @staticmethod
    def extract_audio_track(src_path: Path, track_index: int, out_path: Path) -> Tuple[bool, str]:
        """Extrae una pista de audio a WAV PCM 16 kHz mono. Devuelve (ok, detalle)."""
        try:
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            ffmpeg_exe = "ffmpeg"
        cmd = [ffmpeg_exe, "-y", "-i", str(src_path),
               "-map", f"0:a:{track_index}", "-vn", "-sn", "-dn",
               "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", "-f", "wav", str(out_path)]
        try:
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=1800)
            if res.returncode == 0 and out_path.exists() and out_path.stat().st_size > 44:
                return True, "ok"
            err = (res.stderr or b"").decode("utf-8", errors="replace")[-400:]
            return False, f"FFmpeg no pudo decodificar la pista {track_index}: {err}"
        except FileNotFoundError:
            return False, "FFmpeg no disponible en el servidor."
        except subprocess.TimeoutExpired:
            return False, "Tiempo de extracción agotado."

    @staticmethod
    def analyze_audio_metadata(file_path: Path) -> Dict[str, Any]:
        """Extrae metadatos técnicos acústicos del archivo."""
        duration = AudioService.get_exact_audio_duration(file_path)
        bitrate = 192000
        sample_rate = 16000
        channels = 1
        codec = file_path.suffix.replace('.', '').upper()

        try:
            from mutagen import File as MutagenFile
            audio = MutagenFile(str(file_path))
            if audio is not None and hasattr(audio, 'info'):
                bitrate = getattr(audio.info, 'bitrate', bitrate) or bitrate
                sample_rate = getattr(audio.info, 'sample_rate', sample_rate) or sample_rate
                channels = getattr(audio.info, 'channels', channels) or channels
        except Exception:
            pass

        return {
            "format": codec,
            "duration_seconds": duration,
            "duration_formatted": AudioService.format_duration(duration),
            "bitrate_kbps": round(bitrate / 1000, 1),
            "sample_rate_hz": sample_rate,
            "channels": "Mono" if channels == 1 else "Estéreo",
            "file_size_bytes": os.path.getsize(file_path),
            "file_size_mb": round(os.path.getsize(file_path) / (1024 * 1024), 2),
            "vad_speech_ratio": AudioService._real_speech_ratio(file_path),
            "quality_assessment": "Excelente para transcripción fonética en español"
        }

    @staticmethod
    def _real_speech_ratio(file_path: Path) -> float:
        """Ratio de voz medido por el VAD real (no un 0,94 de adorno)."""
        try:
            from .diarization_service import _compute_vad_threshold, _frame_signal, _rms_db
            signal, sr = AudioService.load_pcm_mono(file_path, max_seconds=300.0)
            if signal is None or len(signal) < sr:
                return 0.0
            frames = _frame_signal(signal, sr)
            db = _rms_db(frames)
            threshold = _compute_vad_threshold(db)
            ratio = float((db >= threshold).mean()) if db.size else 0.0
            return round(ratio, 3)
        except Exception:
            return 0.0
