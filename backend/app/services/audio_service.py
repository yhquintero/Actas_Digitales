import os
import wave
import aifc
from pathlib import Path
from typing import Tuple, Optional
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
    def estimate_audio_duration(file_path: Path) -> float:
        """
        Calcula la duración en segundos del audio.
        Para WAV inspecciona los encabezados nativos sin dependencias externas.
        Para otros formatos, estima a partir de la tasa de bits típica de voz (~64 kbps).
        """
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
        
        # Estimación heurística por tamaño para compresión de voz común (~64 kbps)
        file_size_bytes = os.path.getsize(file_path)
        estimated_seconds = max(1.0, round((file_size_bytes * 8) / 64000, 2))
        return min(estimated_seconds, 7200.0)
