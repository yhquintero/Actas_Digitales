#!/usr/bin/env python3
"""Prueba la generación de PDF y DOCX del acta (servidor).

- build_acta_pdf: magic %PDF, tamaños de papel, modos de contenido y sanitización latin-1.
- Endpoints /api/audio/export-pdf y /api/audio/export-docx vía TestClient.
- DOCX oficial debe incluir la huella SHA-256 del contenido.

Uso:  python3 tools/test_exports.py  (exit 0 OK, 1 fallos)
"""
import io
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

SAMPLE = (
    "Sesión ordinaria del consejo — «acta nº 12»…\n\n"
    "El presupuesto “2026” — 1.000.000 € — quedó aprobado por unanimidad.\n"
    "Asistieron Dña. María López (Secretaria) y D. José Pérez (Presidente)…\n"
    "Signos: ¿Aprobado? ¡Sí! Tildes: áéíóú · ñ · ü.\n"
)


def main() -> int:
    ok = True

    # 1) Unit: sanitización latin-1
    from app.services.pdf_service import build_acta_pdf, sanitize_latin1
    sanitized = sanitize_latin1("em — dash… comillas “x” bullet • tilde á ñ ¿ ¡ «ok» · middle")
    print(f"  [1] sanitize_latin1: {sanitized!r}")
    ok &= sanitized == 'em - dash... comillas "x" bullet * tilde á ñ ¿ ¡ «ok» · middle'

    # 2) Unit: build_acta_pdf en sus 6 combinaciones
    for mode in ("full_text", "official_acta"):
        for size in ("a4", "letter", "legal"):
            try:
                pdf = build_acta_pdf(
                    SAMPLE, title="Sesión Ordinaria", export_type=mode,
                    paper_size=size, margin_type="binding", date_str="14/11/2026",
                    place="Sala Principal", attendees="Presidente, Secretario",
                    president="D. Presidente", secretary="D. Secretario",
                    audio_duration="00:15", wpm="120", reading_time="00:44",
                )
                magic = pdf[:5] == b"%PDF-"
                print(f"  [2] {mode:14s} {size:6s} -> {len(pdf):5d} bytes · magic {'OK' if magic else 'INVÁLIDO'}")
                ok &= magic and len(pdf) > 1000
            except Exception as exc:
                print(f"  [2] {mode} {size} -> EXCEPCIÓN: {exc}")
                ok = False

    # 3) Endpoints vía TestClient
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    for mode in ("full_text", "official_acta"):
        r = client.post("/api/audio/export-pdf", data={
            "text": SAMPLE, "title": "Sesión Ordinaria", "export_type": mode,
            "paper_size": "a4", "margin_type": "standard", "date_str": "14/11/2026",
        })
        magic = r.content[:5] == b"%PDF-"
        sha = r.headers.get("x-content-sha256", "")
        print(f"  [3] export-pdf {mode:14s} -> HTTP {r.status_code} · magic {'OK' if magic else 'INVÁLIDO'} · sha256 {'OK' if len(sha) == 64 else 'AUSENTE'}")
        ok &= r.status_code == 200 and magic and len(sha) == 64

        r = client.post("/api/audio/export-docx", data={
            "text": SAMPLE, "title": "Sesión Ordinaria", "export_type": mode,
            "paper_size": "a4", "margin_type": "standard", "date_str": "14/11/2026",
        })
        is_zip = r.content[:4] == b"PK\x03\x04"
        print(f"  [3] export-docx {mode:14s} -> HTTP {r.status_code} · zip {'OK' if is_zip else 'INVÁLIDO'}")
        ok &= r.status_code == 200 and is_zip
        if is_zip:
            with zipfile.ZipFile(io.BytesIO(r.content)) as z:
                xml = z.read("word/document.xml").decode("utf-8", errors="replace")
                has_doc_xml = "word/document.xml" in z.namelist()
                print(f"       document.xml presente: {has_doc_xml}")
                ok &= has_doc_xml
                if mode == "official_acta":
                    has_sha = "Huella SHA-256" in xml
                    print(f"       huella SHA-256 en DOCX: {has_sha}")
                    ok &= has_sha

    print("\nRESULTADO:", "todas las pruebas superadas ✔" if ok else "FALLOS DETECTADOS ✘")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
