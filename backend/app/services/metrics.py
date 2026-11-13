"""
Observabilidad ligera en memoria para Actas Digitales (sin dependencias externas).

Este módulo mantiene contadores por proceso y un registro de eventos
estructurados (JSON Lines en el log) para dar visibilidad básica a instalaciones
auto-alojadas: descargas del APK, consultas de metadatos, trabajos y actas
sincronizadas desde la app móvil.

NOTA HONESTA: los contadores se reinician con el proceso y no son agregación
multinódulo; para producción multi-instancia use Prometheus/Grafana con un
exportador delante de GET /api/metrics.
"""

import json
import logging
import threading
import time
from typing import Any

logger = logging.getLogger("actas.observabilidad")

_STARTED_AT = time.time()


def log_event(event: str, **fields: Any) -> None:
    """Emite una línea de log estructurado (JSON) con el evento y sus campos."""
    record = {
        "event": event,
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        **{k: v for k, v in fields.items() if v is not None},
    }
    try:
        logger.info(json.dumps(record, ensure_ascii=False, default=str))
    except Exception:  # nunca romper la request por un fallo de logging
        logger.info("evt=%s", event)


class MetricsRegistry:
    """Contadores thread-safe del proceso."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._counters: dict[str, int] = {
            "http_requests_total": 0,
            "app_info_requests_total": 0,
            "app_downloads_total": 0,
            "app_downloads_bytes_total": 0,
            "acts_sync_requests_total": 0,
            "acts_synced_total": 0,
        }
        self._last_download_at: str | None = None
        self._last_download_artifact: str | None = None

    def inc(self, name: str, value: int = 1) -> None:
        with self._lock:
            self._counters[name] = self._counters.get(name, 0) + value

    def record_download(self, artifact_kind: str, size_bytes: int) -> None:
        with self._lock:
            self._counters["app_downloads_total"] += 1
            self._counters["app_downloads_bytes_total"] += int(size_bytes or 0)
            self._last_download_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            self._last_download_artifact = artifact_kind

    def record_acts_synced(self, count: int) -> None:
        with self._lock:
            self._counters["acts_sync_requests_total"] += 1
            self._counters["acts_synced_total"] += int(count)

    def snapshot(self, *, version: str, jobs_total: int) -> dict[str, Any]:
        with self._lock:
            counters = dict(self._counters)
            last_at = self._last_download_at
            last_artifact = self._last_download_artifact
        return {
            "service": "actas-digitales",
            "version": version,
            "uptime_seconds": int(time.time() - _STARTED_AT),
            "counters": counters,
            "jobs_in_memory": jobs_total,
            "last_download": {
                "at": last_at,
                "artifact_kind": last_artifact,
            },
            "note": (
                "Contadores en memoria por proceso (se reinician con el servidor). "
                "Para agregación multi-instancia, exporte /api/metrics a Prometheus."
            ),
        }


metrics = MetricsRegistry()
