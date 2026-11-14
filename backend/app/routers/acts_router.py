"""
Sincronización de Actas entre la App móvil (Room) y la Web.

La app móvil persiste sus actas en Room (base local del dispositivo). Este
router permite subirlas al servidor para que la Web las muestre: el almacén
canónico es SQLite (`acts.db` en UPLOAD_DIR), con deduplicación por
SHA-256 del audio.

SEGURIDAD (obligatoria): ambos endpoints exigen la cabecera `X-Sync-Token`
igual que `ACTAS_SYNC_TOKEN` del servidor. Si el servidor no tiene el token
configurado, la sincronización queda DESACTIVADA (503) — abierto sólo en la
retaguardia confiable no es una opción aceptable para actas confidenciales.

Endpoints:
  GET  /api/acts        -> Lista de actas sincronizadas (limit)   [X-Sync-Token]
  POST /api/acts/sync   -> Subida por lotes (idempotente)         [X-Sync-Token]
"""

from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query, status
from pydantic import BaseModel, Field

from ..config import settings
from ..services import acts_store
from ..services.metrics import metrics, log_event

router = APIRouter(prefix="/acts", tags=["Actas (Sync móvil ⇄ Web)"])

MAX_ACTS_PER_SYNC = 200


class ActSyncItem(BaseModel):
    """Acta generada en el dispositivo (Room) lista para compartir con la Web."""
    audio_sha256: str = Field(..., min_length=64, max_length=64, pattern=r"^[0-9a-f]{64}$")
    job_id: Optional[str] = Field(default=None, max_length=128)
    filename: str = Field(..., min_length=1, max_length=255)
    final_text: str = Field(..., min_length=1, max_length=200_000)
    raw_text: Optional[str] = Field(default=None, max_length=200_000)
    words_count: int = Field(default=0, ge=0)
    removed_fillers: int = Field(default=0, ge=0)
    orthographic_corrections: int = Field(default=0, ge=0)
    timestamp: Optional[int] = Field(default=None, description="epoch millis")


class ActSyncBatch(BaseModel):
    acts: list[ActSyncItem] = Field(..., min_length=1, max_length=MAX_ACTS_PER_SYNC)
    source: str = Field(default="android-room", max_length=64)


def _require_sync_token(x_sync_token: Optional[str]) -> None:
    if not settings.SYNC_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sincronización móvil⇄Web desactivada: el servidor no tiene ACTAS_SYNC_TOKEN configurado.",
        )
    if not x_sync_token or x_sync_token != settings.SYNC_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Sync-Token inválido o ausente.",
        )


@router.get("")
async def list_synced_acts(limit: int = Query(default=20, ge=1, le=100),
                           x_sync_token: Optional[str] = Header(default=None, alias="X-Sync-Token")):
    _require_sync_token(x_sync_token)
    return {"total": acts_store.count_acts(), "acts": acts_store.list_acts(limit)}


@router.post("/sync")
async def sync_acts(batch: ActSyncBatch,
                    x_sync_token: Optional[str] = Header(default=None, alias="X-Sync-Token")):
    _require_sync_token(x_sync_token)
    try:
        stored, duplicates = acts_store.sync_items([item.model_dump() for item in batch.acts],
                                                   source=batch.source)
    except OSError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"No se pudo persistir el almacén de actas: {exc}")

    metrics.record_acts_synced(stored)
    log_event("acts_synced", stored=stored, duplicates=duplicates, source=batch.source)
    return {"received": len(batch.acts), "stored": stored, "duplicates": duplicates}
