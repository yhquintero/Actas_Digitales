import json
import asyncio
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, status
from fastapi.responses import StreamingResponse
import aiofiles

from ..config import settings
from ..models.job import JobResponse, JobStatus, CorrectionItem
from ..services.audio_service import AudioService
from ..services.job_manager import job_manager
from ..services.consolidation_service import ConsolidationService
from ..services.correction_service import CorrectionService

router = APIRouter(prefix="/audio", tags=["Audio & Transcripción"])

@router.post("/upload", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_audio(
    file: UploadFile = File(...),
    language: str = Form("es"),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """
    Recibe el archivo de audio (Web o Android), valida el formato y tamaño,
    crea un trabajo de transcripción y comienza el pipeline en segundo plano.
    """
    # Leer contenido inicial para calcular tamaño
    content = await file.read()
    file_size = len(content)

    # Validar formato y tamaño
    valid, err_msg = AudioService.validate_file(file.filename, file_size)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # Guardar archivo en disco
    job = job_manager.create_job(filename=file.filename, file_size_bytes=file_size, language=language)
    safe_name = f"{job.job_id}_{Path(file.filename).name}"
    target_path = settings.UPLOAD_DIR / safe_name

    async with aiofiles.open(target_path, "wb") as f:
        await f.write(content)

    # Disparar tarea en segundo plano sin bloquear la respuesta HTTP
    asyncio.create_task(
        job_manager.process_job(
            job_id=job.job_id,
            file_path=target_path,
            custom_api_key=x_api_key or ""
        )
    )

    return job

@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job_status(job_id: str):
    """
    Consulta el estado y resultados de un trabajo de transcripción por su ID.
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trabajo no encontrado")
    return job

@router.get("/jobs/{job_id}/stream")
async def stream_job_status(job_id: str):
    """
    Canal Server-Sent Events (SSE) para recibir actualizaciones en tiempo real
    del avance del procesamiento (Web y Android).
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trabajo no encontrado")

    queue = await job_manager.subscribe(job_id)

    async def event_generator():
        try:
            while True:
                updated_job: JobResponse = await queue.get()
                payload = updated_job.model_dump_json()
                yield f"data: {payload}\n\n"
                if updated_job.status in (JobStatus.COMPLETED, JobStatus.FAILED):
                    break
        finally:
            job_manager.unsubscribe(job_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/jobs", response_model=List[JobResponse])
async def list_jobs(limit: int = 15):
    """
    Lista los trabajos de transcripción procesados recientemente.
    """
    return job_manager.list_jobs(limit=limit)

@router.post("/test-text-pipeline")
async def test_text_pipeline(
    raw_text: str = Form(...),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """
    Permite probar directamente la consolidación, eliminación de muletillas
    y corrección ortotipográfica sobre un texto sin necesidad de subir audio.
    """
    cleaned, clean_corr, fillers = ConsolidationService.clean_and_consolidate(raw_text)
    final_text, grammar_corr = CorrectionService.correct_text(cleaned, custom_api_key=x_api_key or "")
    
    return {
        "raw_text": raw_text,
        "cleaned_text": cleaned,
        "final_corrected_text": final_text,
        "removed_fillers": fillers,
        "corrections": clean_corr + grammar_corr
    }
