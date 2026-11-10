from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    PREPROCESSING = "PREPROCESSING"
    TRANSCRIBING = "TRANSCRIBING"
    CONSOLIDATING = "CONSOLIDATING"
    CORRECTING = "CORRECTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AudioSegment(BaseModel):
    id: int
    start_time: float
    end_time: float
    text: str

class CorrectionItem(BaseModel):
    original: str
    corrected: str
    type: str  # "ortografia", "gramatica", "puntuacion", "muletilla", "repeticion"
    explanation: Optional[str] = None

class JobStats(BaseModel):
    original_words: int = 0
    final_words: int = 0
    removed_fillers: int = 0
    orthographic_corrections: int = 0
    processing_time_sec: float = 0.0
    audio_duration_sec: float = 0.0
    audio_duration_formatted: str = "00:00"
    reading_duration_sec: float = 0.0
    reading_duration_formatted: str = "00:00"
    words_per_minute: float = 0.0
    duration_coverage_percent: float = 100.0
    acoustic_verification_status: str = "VERIFICADO_COINCIDENTE"

class JobResponse(BaseModel):
    job_id: str
    filename: str
    file_size_bytes: int
    status: JobStatus
    progress_percent: int = 0
    current_step: str = ""
    language: str = "es"
    created_at: datetime
    updated_at: datetime
    
    # Results (populated when completed)
    raw_transcription: Optional[str] = None
    cleaned_transcription: Optional[str] = None
    final_corrected_text: Optional[str] = None
    segments: List[AudioSegment] = Field(default_factory=list)
    corrections_applied: List[CorrectionItem] = Field(default_factory=list)
    stats: Optional[JobStats] = None
    error_message: Optional[str] = None

class DirectTranscribeRequest(BaseModel):
    language: str = "es"
    clean_fillers: bool = True
    correct_grammar: bool = True
