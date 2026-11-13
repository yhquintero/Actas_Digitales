#!/usr/bin/env python3
"""
Sincroniza el APK oficial de distribución con `web/public/ActasDigitales.apk`.

La Web (y cualquier hosting estático del frontend, p. ej. GitHub Pages o el
contenedor nginx de `web/`) sirve una copia estática del mismo APK que el
backend entrega en /api/app/download cuando este no está disponible. Este
script evita que ambas copias diverjan.

Orden de preferencia del artefacto de origen:
  1. Ruta en ACTAS_APK_SRC (si está definida y existe)
  2. android/app/release/app-release.apk  (app nativa completa, v2/v3)
  3. android/ActasDigitales.apk           (APK mínimo autónomo)

Uso:
  python tools/sync_apk.py [--check]

  --check    Solo verifica la sincronía (exit 1 si difieren); no copia.
"""

import argparse
import hashlib
import os
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TARGET = REPO_ROOT / "web" / "public" / "ActasDigitales.apk"

OVERRIDE = os.getenv("ACTAS_APK_SRC", "").strip()

CANDIDATES = []
if OVERRIDE:
    CANDIDATES.append(Path(OVERRIDE))
CANDIDATES += [
    REPO_ROOT / "android" / "app" / "release" / "app-release.apk",
    REPO_ROOT / "android" / "ActasDigitales.apk",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def resolve_source() -> Path:
    for candidate in CANDIDATES:
        if candidate.is_file() and candidate.stat().st_size > 0:
            return candidate
    print("[ERROR] No se encontró ningún APK candidato:", *CANDIDATES, sep="\n  - ")
    sys.exit(2)


def main() -> int:
    parser = argparse.ArgumentParser(description="Sincroniza el APK oficial con web/public")
    parser.add_argument("--check", action="store_true", help="solo verificación, sin copiar")
    args = parser.parse_args()

    source = resolve_source()
    source_hash = sha256(source)

    if args.check:
        if not TARGET.is_file():
            print(f"[FALTA] {TARGET.relative_to(REPO_ROOT)} no existe. Ejecuta: python tools/sync_apk.py")
            return 1
        target_hash = sha256(TARGET)
        if target_hash != source_hash:
            print(
                "[DESINCRONIZADO]\n"
                f"  origen ({source.name}): {source_hash}\n"
                f"  destino web       : {target_hash}\n"
                "Ejecuta: python tools/sync_apk.py"
            )
            return 1
        print(f"[OK] web/public/ActasDigitales.apk sincronizado con {source.name}")
        return 0

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, TARGET)
    if sha256(TARGET) != source_hash:
        print("[ERROR] La copia no coincide tras la escritura (disco lleno?)")
        return 1
    print(f"[OK] APK sincronizado: {source.relative_to(REPO_ROOT)} -> web/public/ActasDigitales.apk")
    print(f"     SHA-256: {source_hash}")
    print(f"     Tamaño : {TARGET.stat().st_size / (1024 * 1024):.2f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
