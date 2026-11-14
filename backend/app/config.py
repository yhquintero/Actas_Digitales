import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Descubrimiento robusto del .env del servidor: funciona igual si se arranca
# con «cd backend && python run_server.py», «python backend/run_server.py»
# desde la raíz, o con uvicorn directo. Prioridad: CWD → backend/.env → raíz/.env
_ENV_CANDIDATES = [
    Path(".env"),
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env",
]
ENV_FILE = next((str(c) for c in _ENV_CANDIDATES if c.exists()), ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Actas Digitales - Audio to Text Pipeline"
    VERSION: str = "1.7.0"
    API_PREFIX: str = "/api"
    
    # Uploads
    UPLOAD_DIR: Path = Path(__file__).resolve().parent.parent / "uploads"
    MAX_FILE_SIZE_MB: int = 1024  # Límite ampliado a 1 GB (1024 MB)
    ALLOWED_EXTENSIONS: set[str] = {
        ".mp3", ".wav", ".m4a", ".ogg", ".webm", ".aac", ".flac",
        ".opus", ".wma", ".mp4", ".oga", ".amr", ".3gp", ".m4p", ".caf",
        ".mov", ".mkv", ".avi", ".m4v", ".ts", ".flv", ".wmv",
    }
    
    # Language
    DEFAULT_LANGUAGE: str = "es"
    
    # Honestidad / seguridad (ver SECURITY.md)
    DEMO_MODE: bool = os.getenv("ACTAS_DEMO_MODE", "0").lower() in ("1", "true", "yes", "on")
    ALLOW_GOOGLE_ASR: bool = os.getenv("ACTAS_ALLOW_GOOGLE_ASR", "0").lower() in ("1", "true", "yes", "on")
    ADMIN_TOKEN: str = os.getenv("ACTAS_ADMIN_TOKEN", "")
    SYNC_TOKEN: str = os.getenv("ACTAS_SYNC_TOKEN", "")
    RETENTION_HOURS: float = float(os.getenv("ACTAS_RETENTION_HOURS", "720"))  # 0 = desactivada
    
    # Optional External APIs
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")
    
    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    class Config:
        env_file = ENV_FILE

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
