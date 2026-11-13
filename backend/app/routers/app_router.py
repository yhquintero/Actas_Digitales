"""
Router de distribución de la App Android (APK) servida directamente por el servidor.

Permite que, desde la propia Web de Actas Digitales (servida por este mismo
proceso o proxied a través de nginx/caddy), el usuario pueda descargar el
paquete instalable para su teléfono sin depender de GitHub ni de servicios
externos.

Endpoints:
  GET /api/app/info      -> Metadatos del APK (versión, tamaño, SHA-256, firma)
  GET /api/app/download  -> Descarga del paquete (application/vnd.android.package-archive)
"""

import hashlib
import os
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/app", tags=["App Android (Descarga)"])

# Raíz del repositorio: backend/app/routers/app_router.py -> parents[3]
REPO_ROOT = Path(__file__).resolve().parents[3]

# Candidatos en orden de preferencia. El paquete raíz está firmado
# (RSA-4096 · SHA-256) y es el artefacto oficial de distribución.
# La variable de entorno APK_DOWNLOAD_PATH permite sobreescribirlo
# (p. ej. en Docker, montando ./android:/android:ro).
_ENV_APK = os.getenv("APK_DOWNLOAD_PATH", "").strip()

_CANDIDATES = []
if _ENV_APK:
    _CANDIDATES.append(Path(_ENV_APK))
_CANDIDATES += [
    REPO_ROOT / "android" / "ActasDigitales.apk",
    REPO_ROOT / "android" / "app" / "release" / "app-release.apk",
]

APK_METADATA = {
    "name": "Actas Digitales",
    "package": "com.actasdigitales.app",
    "version_name": "1.2.0",
    "version_code": 1,
    "min_sdk": 24,
    "target_sdk": 34,
    "requires_android": "Android 7.0 (API 24) o superior",
    "abi": "Universal (arm64-v8a, armeabi-v7a, x86, x86_64)",
    "signature": "RSA-4096 · SHA-256 · Actas Digitales Mobile (firma autofirmada)",
    "permissions": [
        "RECORD_AUDIO",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "READ_MEDIA_AUDIO",
        "WAKE_LOCK",
    ],
    "filename": "ActasDigitales.apk",
}

# Caché en memoria del SHA-256 (el archivo de 5-13 MB se hashea una sola vez por mtime)
_hash_cache: dict = {"key": None, "sha256": None}


def _resolve_apk() -> Path | None:
    for candidate in _CANDIDATES:
        try:
            if candidate.is_file() and candidate.stat().st_size > 0:
                return candidate
        except OSError:
            continue
    return None


def _sha256_of(path: Path) -> tuple[str, int, float]:
    stat = path.stat()
    cache_key = f"{path}:{stat.st_mtime_ns}:{stat.st_size}"
    if _hash_cache["key"] != cache_key:
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        _hash_cache["key"] = cache_key
        _hash_cache["sha256"] = digest.hexdigest()
    return _hash_cache["sha256"], stat.st_size, stat.st_mtime


def _format_size(size_bytes: int) -> str:
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    if size_bytes >= 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes} B"


@router.get("/info")
async def app_info():
    """
    Devuelve los metadatos públicos del APK disponible para descarga:
    versión, tamaño, hash SHA-256 de custodia y requisitos de instalación.
    """
    apk_path = _resolve_apk()
    if apk_path is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "El paquete APK no está disponible en este servidor. "
                "Ejecuta tools/compilar_apk.py o monta ./android en el contenedor "
                "y define la variable APK_DOWNLOAD_PATH."
            ),
        )

    sha256, size, mtime = _sha256_of(apk_path)
    is_signed_distribution = apk_path.name == "ActasDigitales.apk"

    return {
        **APK_METADATA,
        "available": True,
        "size_bytes": size,
        "size_formatted": _format_size(size),
        "sha256": sha256,
        "signed": is_signed_distribution,
        "source": apk_path.name,
        "download_url": "/api/app/download",
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(mtime)),
    }


@router.api_route("/download", methods=["GET", "HEAD"])
async def download_apk():
    """
    Descarga directa del APK firmado. Se sirve con el tipo MIME oficial de
    Android para que el dispositivo ofrezca instalarlo al abrir el archivo.
    """
    apk_path = _resolve_apk()
    if apk_path is None:
        raise HTTPException(
            status_code=404,
            detail="El paquete APK no está disponible en este servidor.",
        )

    sha256, size, _ = _sha256_of(apk_path)

    return FileResponse(
        path=str(apk_path),
        media_type="application/vnd.android.package-archive",
        filename=APK_METADATA["filename"],
        headers={
            "Content-Length": str(size),
            "X-APK-SHA256": sha256,
            "X-APK-Version": APK_METADATA["version_name"],
            "X-APK-Package": APK_METADATA["package"],
            "Cache-Control": "public, max-age=300, must-revalidate",
        },
    )
