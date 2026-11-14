"""
Almacén persistente de actas sincronizadas (SQLite).

- Sustituye al antiguo JSONL (`synced_acts.jsonl`) por SQLite con PRIMARY KEY
  en `audio_sha256`: deduplicación atómica, sin límite de crecimiento silencioso,
  lectura O(log n) y modo WAL.
- Migra automáticamente el legado JSONL en el primer arranque (INSERT OR IGNORE
  y renombra el fichero a `synced_acts.jsonl.migrated`).
"""

import json
import sqlite3
import threading
import time
from pathlib import Path
from typing import List, Optional

from ..config import settings

_LOCK = threading.Lock()
KEEP_FROM_PURGE = {".gitkeep", "acts.db", "acts.db-wal", "acts.db-shm",
                    "synced_acts.jsonl", "synced_acts.jsonl.migrated"}

_SCHEMA = """
CREATE TABLE IF NOT EXISTS acts (
    audio_sha256 TEXT PRIMARY KEY,
    job_id TEXT,
    filename TEXT NOT NULL,
    final_text TEXT NOT NULL,
    raw_text TEXT,
    words_count INTEGER NOT NULL DEFAULT 0,
    removed_fillers INTEGER NOT NULL DEFAULT 0,
    orthographic_corrections INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER,
    synced_at TEXT,
    source TEXT
);
CREATE INDEX IF NOT EXISTS idx_acts_timestamp ON acts (timestamp DESC);
"""


def _db_path() -> Path:
    return settings.UPLOAD_DIR / "acts.db"


def _legacy_path() -> Path:
    return settings.UPLOAD_DIR / "synced_acts.jsonl"


def _connect() -> sqlite3.Connection:
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_db_path()), timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


def init() -> None:
    """Crea la tabla (si falta) y migra el legado JSONL de forma segura."""
    with _LOCK, _connect() as conn:
        conn.executescript(_SCHEMA)
        legacy = _legacy_path()
        if legacy.exists():
            migrated = 0
            try:
                with legacy.open("r", encoding="utf-8") as handle:
                    for line in handle:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            record = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        if not isinstance(record, dict):
                            continue
                        sha = record.get("audio_sha256")
                        if not sha or len(str(sha)) != 64:
                            continue
                        cur = conn.execute(
                            """INSERT OR IGNORE INTO acts (
                                   audio_sha256, job_id, filename, final_text, raw_text,
                                   words_count, removed_fillers, orthographic_corrections,
                                   timestamp, synced_at, source)
                               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                            (str(sha), record.get("job_id"), record.get("filename") or "acta",
                             record.get("final_text") or "", record.get("raw_text"),
                             int(record.get("words_count") or 0), int(record.get("removed_fillers") or 0),
                             int(record.get("orthographic_corrections") or 0),
                             record.get("timestamp"), record.get("synced_at"), record.get("source")))
                        migrated += cur.rowcount
                legacy.rename(legacy.with_suffix(".jsonl.migrated"))
                print(f"[acts_store] Legado JSONL migrado: {migrated} actas importadas ({legacy.name}.migrated)")
            except OSError as exc:
                print(f"[acts_store] Aviso: no se pudo migrar el legado JSONL ({exc}); se conserva el fichero.")


def list_acts(limit: int = 20) -> List[dict]:
    with _LOCK, _connect() as conn:
        rows = conn.execute(
            """SELECT audio_sha256, job_id, filename, final_text, raw_text, words_count,
                      removed_fillers, orthographic_corrections, timestamp, synced_at, source
               FROM acts ORDER BY COALESCE(timestamp, 0) DESC LIMIT ?""",
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]


def count_acts() -> int:
    with _LOCK, _connect() as conn:
        return int(conn.execute("SELECT COUNT(*) FROM acts").fetchone()[0])


def sync_items(items: List[dict], source: str = "android-room") -> tuple:
    """Inserta items nuevos. Devuelve (stored, duplicates)."""
    stored = duplicates = 0
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with _LOCK, _connect() as conn:
        for item in items:
            sha = item.get("audio_sha256")
            if not sha:
                continue
            cur = conn.execute(
                """INSERT OR IGNORE INTO acts (
                       audio_sha256, job_id, filename, final_text, raw_text,
                       words_count, removed_fillers, orthographic_corrections,
                       timestamp, synced_at, source)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                (sha, item.get("job_id"), item.get("filename") or "acta",
                 item.get("final_text") or "", item.get("raw_text"),
                 int(item.get("words_count") or 0), int(item.get("removed_fillers") or 0),
                 int(item.get("orthographic_corrections") or 0),
                 item.get("timestamp") or int(time.time() * 1000), now_iso, source))
            if cur.rowcount:
                stored += 1
            else:
                duplicates += 1
    return stored, duplicates
