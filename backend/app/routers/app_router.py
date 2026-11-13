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
import zipfile
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/app", tags=["App Android (Descarga)"])

# Raíz del repositorio: backend/app/routers/app_router.py -> parents[3]
REPO_ROOT = Path(__file__).resolve().parents[3]

# Candidatos en orden de preferencia. La app nativa completa (Jetpack Compose)
# es el artefacto oficial de distribución y está firmada con APK Signature
# Scheme v2/v3. El APK raíz (mínimo, generado por tools/compilar_apk.py) se
# conserva como respaldo para entornos sin la build de Gradle.
# La variable de entorno APK_DOWNLOAD_PATH permite sobreescribirlo
# (p. ej. en Docker, montando ./android:/android:ro).
_ENV_APK = os.getenv("APK_DOWNLOAD_PATH", "").strip()

_RELEASE_CANDIDATE = REPO_ROOT / "android" / "app" / "release" / "app-release.apk"
_STUB_CANDIDATE = REPO_ROOT / "android" / "ActasDigitales.apk"

_CANDIDATES = []
if _ENV_APK:
    _CANDIDATES.append(Path(_ENV_APK))
_CANDIDATES += [_RELEASE_CANDIDATE, _STUB_CANDIDATE]

# Metadatos por artefacto: se informa la verdad de lo que se sirve.
# La build Gradle comprometida declara versionName 1.0.0 / versionCode 1
# en android/app/build.gradle.kts (bumpada a 1.3.0 para la próxima build).
ARTIFACT_PROFILES = {
    str(_RELEASE_CANDIDATE): {
        "version_name": "1.0.0",
        "version_code": 1,
        "min_sdk": 26,
        "requires_android": "Android 8.0 (API 26) o superior",
        "signature": "APK Signature Scheme v2/v3 (Gradle release)",
        "artifact_kind": "release-gradle",
        "description": "App nativa completa en Kotlin + Jetpack Compose (WorkManager, Room, BiometricPrompt)",
    },
    str(_STUB_CANDIDATE): {
        "version_name": "1.2.0",
        "version_code": 1,
        "min_sdk": 24,
        "requires_android": "Android 7.0 (API 24) o superior",
        "signature": "v1 JAR Scheme · RSA-4096 · Actas Digitales Mobile (autofirmada)",
        "artifact_kind": "stub-demo",
        "description": "APK mínimo autónomo generado por tools/compilar_apk.py (demo de instalación)",
    },
}

DEFAULT_PROFILE = {
    "version_name": "1.0.0",
    "version_code": 1,
    "min_sdk": 26,
    "requires_android": "Android 8.0 (API 26) o superior",
    "signature": "Detectada por firma del APK",
    "artifact_kind": "external",
    "description": "APK provisto vía APK_DOWNLOAD_PATH",
}

APK_METADATA = {
    "name": "Actas Digitales",
    "package": "com.actasdigitales.app",
    "target_sdk": 34,
    "abi": "Universal (arm64-v8a, armeabi-v7a, x86, x86_64)",
    "permissions": [
        "RECORD_AUDIO",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "READ_MEDIA_AUDIO",
        "WAKE_LOCK",
    ],
    "filename": "ActasDigitales.apk",
}


def _artifact_profile(path: Path) -> dict:
    try:
        key = str(path.resolve())
    except OSError:
        key = str(path)
    for candidate_path, profile in ARTIFACT_PROFILES.items():
        try:
            if str(Path(candidate_path).resolve()) == key:
                return profile
        except OSError:
            continue
    return DEFAULT_PROFILE

# Caché en memoria del SHA-256 y de los esquemas de firma
_hash_cache: dict = {"key": None, "sha256": None, "schemes": []}

APK_SIG_BLOCK_MAGIC = b"APK Sig Block 42"


def _apk_signature_schemes(path: Path) -> list[str]:
    """
    Detecta los esquemas de firma realmente presentes en el APK:
      - v1 (JAR):  entradas META-INF/*.RSA|*.DSA|*.SF con certificado
      - v2/v3:     bloque "APK Sig Block 42" antes del Central Directory
    Un APK sin ninguno de los dos no se puede instalar (Android lo rechaza).
    """
    schemes: list[str] = []
    try:
        with zipfile.ZipFile(path) as archive:
            names = [info.filename.upper() for info in archive.infolist()]
            has_cert = any(
                name.startswith("META-INF/")
                and (name.endswith((".RSA", ".DSA", ".EC")) or name.endswith(".SF"))
                for name in names
            )
            if has_cert:
                schemes.append("v1 (JAR)")
    except (zipfile.BadZipFile, OSError):
        return schemes

    try:
        # El bloque de firma v2/v3 precede al Central Directory: buscar la firma mágica
        with path.open("rb") as handle:
            data = handle.read()
        if APK_SIG_BLOCK_MAGIC in data:
            schemes.append("v2/v3 (APK Signature Scheme)")
    except OSError:
        pass
    return schemes


def _resolve_apk() -> Path | None:
    """
    Devuelve el primer APK *instalable* (firmado) de la lista de candidatos.
    La variable de entorno APK_DOWNLOAD_PATH se respeta como último recurso
    aunque no se detecte firma (responsabilidad del operador), pero los
    candidatos por defecto sin firma se descartan: servir un APK que Android
    rechazará es peor que un 404 explicativo.
    """
    env_fallback = None
    for candidate in _CANDIDATES:
        try:
            if not candidate.is_file() or candidate.stat().st_size == 0:
                continue
        except OSError:
            continue
        is_env_override = bool(_ENV_APK) and candidate == Path(_ENV_APK)
        if _apk_signature_schemes(candidate):
            return candidate
        if is_env_override:
            env_fallback = candidate
    return env_fallback


def _sha256_of(path: Path) -> tuple[str, int, float, list[str]]:
    stat = path.stat()
    cache_key = f"{path}:{stat.st_mtime_ns}:{stat.st_size}"
    if _hash_cache["key"] != cache_key:
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        _hash_cache["key"] = cache_key
        _hash_cache["sha256"] = digest.hexdigest()
        _hash_cache["schemes"] = _apk_signature_schemes(path)
    return _hash_cache["sha256"], stat.st_size, stat.st_mtime, _hash_cache["schemes"]


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

    sha256, size, mtime, schemes = _sha256_of(apk_path)
    installable = len(schemes) > 0
    profile = _artifact_profile(apk_path)

    return {
        **APK_METADATA,
        **profile,
        "available": True,
        "size_bytes": size,
        "size_formatted": _format_size(size),
        "sha256": sha256,
        "signed": installable,
        "signature_schemes": schemes,
        "installable": installable,
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

    sha256, size, _, schemes = _sha256_of(apk_path)
    profile = _artifact_profile(apk_path)

    return FileResponse(
        path=str(apk_path),
        media_type="application/vnd.android.package-archive",
        filename=APK_METADATA["filename"],
        headers={
            "Content-Length": str(size),
            "X-APK-SHA256": sha256,
            "X-APK-Version": profile["version_name"],
            "X-APK-Package": APK_METADATA["package"],
            "X-APK-Signature-Scheme": ", ".join(schemes) if schemes else "sin firma detectada",
            "Cache-Control": "public, max-age=300, must-revalidate",
        },
    )
