import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Actas Digitales - Audio to Text Pipeline"
    VERSION: str = "1.5.0"
    API_PREFIX: str = "/api"
    
    # Uploads
    UPLOAD_DIR: Path = Path(__file__).resolve().parent.parent / "uploads"
    MAX_FILE_SIZE_MB: int = 1024  # Límite ampliado a 1 GB (1024 MB)
    ALLOWED_EXTENSIONS: set[str] = {
        ".mp3", ".wav", ".m4a", ".ogg", ".webm", ".aac", ".flac",
        ".opus", ".wma", ".mp4", ".oga", ".amr", ".3gp", ".m4p", ".caf"
    }
    
    # Language
    DEFAULT_LANGUAGE: str = "es"
    
    # Optional External APIs
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")
    
    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    class Config:
        env_file = ".env"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
