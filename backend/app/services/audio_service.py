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
    def analyze_audio_metadata(file_path: Path) -> Dict[str, Any]:
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
