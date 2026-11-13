"""
Sincronización de Actas entre la App móvil (Room) y la Web.

La app móvil persiste sus actas en Room (base local del dispositivo). Este
router permite subirlas al servidor para que la Web las muestre: la fuente de
verdad compartida es este almacén (NDJSON en UPLOAD_DIR), con deduplicación
por SHA-256 del audio.

Endpoints:
  GET  /api/acts        -> Lista de actas sincronizadas (limit)
  POST /api/acts/sync   -> Subida por lotes desde la app (idempotente por audio_sha256)
"""

import json
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..config import settings
from ..services.metrics import metrics, log_event

router = APIRouter(prefix="/acts", tags=["Actas (Sync móvil ⇄ Web)"])

STORE_PATH = settings.UPLOAD_DIR / "synced_acts.jsonl"
MAX_ACTS_PER_SYNC = 200


class ActSyncItem(BaseModel):
    """Acta generada en el dispositivo (Room) lista para compartir con la Web."""
    audio_sha256: str = Field(..., min_length=64, max_length=64, pattern=r"^[0-9a-f]{64}$")
    job_id: str | None = Field(default=None, max_length=128)
    filename: str = Field(..., min_length=1, max_length=255)
    final_text: str = Field(..., min_length=1, max_length=200_000)
    raw_text: str | None = Field(default=None, max_length=200_000)
    words_count: int = Field(default=0, ge=0)
    removed_fillers: int = Field(default=0, ge=0)
    orthographic_corrections: int = Field(default=0, ge=0)
    timestamp: int | None = Field(default=None, description="epoch millis")


class ActSyncBatch(BaseModel):
    acts: list[ActSyncItem] = Field(..., min_length=1, max_length=MAX_ACTS_PER_SYNC)
    source: str = Field(default="android-room", max_length=64)


def _load_store() -> list[dict]:
    acts: list[dict] = []
    try:
        if STORE_PATH.is_file():
            with STORE_PATH.open("r", encoding="utf-8") as handle:
                for line in handle:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        record = json.loads(line)
                        if isinstance(record, dict) and record.get("audio_sha256"):
                            acts.append(record)
                    except json.JSONDecodeError:
                        continue
    except OSError:
        return []
    return acts


@router.get("")
async def list_synced_acts(limit: int = Query(default=20, ge=1, le=100)):
    acts = _load_store()
    acts.sort(key=lambda record: record.get("timestamp") or 0, reverse=True)
    return {"total": len(acts), "acts": acts[:limit]}


@router.post("/sync")
async def sync_acts(batch: ActSyncBatch):
    existing = _load_store()
    known_hashes = {record.get("audio_sha256") for record in existing}

    stored, duplicates = [], 0
    try:
        STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with STORE_PATH.open("a", encoding="utf-8") as handle:
            for item in batch.acts:
                if item.audio_sha256 in known_hashes:
                    duplicates += 1
                    continue
                record = item.model_dump()
                record["synced_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                record["source"] = batch.source
                if record.get("timestamp") is None:
                    record["timestamp"] = int(time.time() * 1000)
                handle.write(json.dumps(record, ensure_ascii=False) + "\n")
                known_hashes.add(item.audio_sha256)
                stored.append(item.audio_sha256)
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"No se pudo persistir el almacén de actas: {exc}")

    metrics.record_acts_synced(len(stored))
    log_event("acts_synced", stored=len(stored), duplicates=duplicates, source=batch.source)
    return {"received": len(batch.acts), "stored": len(stored), "duplicates": duplicates}
