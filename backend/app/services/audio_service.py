import os
import wave
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from ..config import settings

class AudioService:
    @staticmethod
    def validate_file(filename: str, file_size: int) -> Tuple[bool, Optional[str]]:
        ext = Path(filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            return False, f"Formato no permitido: {ext}. Formatos aceptados: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            limite_gb = round(settings.MAX_FILE_SIZE_MB / 1024, 1)
            limite_str = f"{limite_gb:g} GB" if limite_gb >= 1 else f"{settings.MAX_FILE_SIZE_MB} MB"
            return False, f"El archivo excede el tamaño máximo permitido de {limite_str} ({settings.MAX_FILE_SIZE_MB} MB)"
            
        return True, None

    @staticmethod
    def get_exact_audio_duration(file_path: Path) -> float:
        """
        Calcula con precisión exacta la duración en segundos del audio.
        Utiliza mutagen si está disponible (MP3, WAV, M4A, OGG, FLAC, AAC, WEBM).
        Fallback a wave nativo para WAV o estimación por bitrate acústico.
        """
        try:
            from mutagen import File as MutagenFile
            audio = MutagenFile(str(file_path))
            if audio is not None and hasattr(audio, 'info') and hasattr(audio.info, 'length'):
                if audio.info.length and audio.info.length > 0:
                    return round(float(audio.info.length), 2)
        except Exception:
            pass

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
        
        file_size_bytes = os.path.getsize(file_path)
        estimated_seconds = max(1.0, round((file_size_bytes * 8) / 64000, 2))
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
        Convierte cualquier formato de audio compatible a un archivo WAV PCM 16kHz mono.
        Utiliza miniaudio (decodificador en C sin ffmpeg para MP3, FLAC, OGG, WAV) o ffmpeg.
        """
        ext = file_path.suffix.lower()
        if ext == ".wav":
            try:
                with wave.open(str(file_path), "rb") as wf:
                    if wf.getnchannels() > 0 and wf.getframerate() > 0:
                        return True
            except Exception:
                pass

        # 1. Intentar con miniaudio
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

        # 2. Intentar con ffmpeg del sistema
        try:
            import subprocess
            cmd = ["ffmpeg", "-y", "-i", str(file_path), "-ar", "16000", "-ac", "1", "-f", "wav", str(output_wav)]
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if res.returncode == 0 and output_wav.exists() and output_wav.stat().st_size > 44:
                return True
        except Exception:
            pass

        return False
        """Extrae metadatos técnicos acústicos del archivo."""
        duration = AudioService.get_exact_audio_duration(file_path)
        bitrate = 64000
        sample_rate = 44100
        channels = 2

        try:
            from mutagen import File as MutagenFile
            audio = MutagenFile(str(file_path))
            if audio and hasattr(audio, 'info'):
                bitrate = getattr(audio.info, 'bitrate', bitrate) or bitrate
                sample_rate = getattr(audio.info, 'sample_rate', sample_rate) or sample_rate
                channels = getattr(audio.info, 'channels', channels) or channels
        except Exception:
            pass

        return {
            "duration_sec": duration,
            "duration_formatted": AudioService.format_duration(duration),
            "bitrate_kbps": round(bitrate / 1000, 1),
            "sample_rate_hz": sample_rate,
            "channels": channels,
            "file_size_bytes": os.path.getsize(file_path),
            "extension": file_path.suffix.lower()
        }
