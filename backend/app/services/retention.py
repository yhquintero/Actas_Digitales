"""
Retención automática del directorio de subidas.

Borra ficheros de `UPLOAD_DIR` más antiguos que `ACTAS_RETENTION_HOURS`
(defecto 720 h ≈ 30 días; `0` desactiva). Nunca toca el almacén de actas ni
los marcadores necesarios. No registra ni el contenido ni los nombres fuera
de un recuento agregado.
"""

import asyncio
import shutil
import time
from pathlib import Path
from typing import Tuple

from ..config import settings
from .acts_store import KEEP_FROM_PURGE
from .metrics import log_event


def purge_old_uploads(retention_hours: float) -> Tuple[int, int]:
    if retention_hours is None or retention_hours <= 0:
        return 0, 0
    cutoff = time.time() - float(retention_hours) * 3600.0
    removed = freed = 0
    upload_dir = settings.UPLOAD_DIR
    if not upload_dir.is_dir():
        return 0, 0
    for p in upload_dir.glob("*"):
        if not p.is_file() or p.name in KEEP_FROM_PURGE:
            continue
        try:
            if p.stat().st_mtime < cutoff:
                freed += p.stat().st_size
                p.unlink()
                removed += 1
        except OSError:
            continue

    # Temporales de extracción (UPLOAD_DIR/extract/<id>/) más antiguos del TTL
    extract_root = upload_dir / "extract"
    if extract_root.is_dir():
        for child in extract_root.iterdir():
            try:
                mtime = max((f.stat().st_mtime for f in child.rglob("*") if f.is_file()), default=child.stat().st_mtime)
                if mtime < cutoff:
                    for f in child.rglob("*"):
                        if f.is_file():
                            freed += f.stat().st_size
                            removed += 1
                    shutil.rmtree(child, ignore_errors=True)
            except OSError:
                continue
    return removed, freed


async def retention_loop(interval_seconds: float = 6 * 3600.0) -> None:
    """Purga inmediata al arrancar y cada 6 h; nunca lanza excepciones."""
    while True:
        try:
            removed, freed = purge_old_uploads(settings.RETENTION_HOURS)
            if removed:
                log_event("retention_purge", removed_files=removed, freed_bytes=freed)
                print(f"[retention] Purga automática: {removed} ficheros, {freed / 1024 / 1024:.1f} MB liberados")
        except Exception as exc:  # pragma: no cover - defensa total
            print(f"[retention] Aviso: {exc}")
        await asyncio.sleep(interval_seconds)
