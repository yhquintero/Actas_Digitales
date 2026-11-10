#!/usr/bin/env python3
"""
Lanzador del Servidor Seguro HTTPS con Certificados Firmados TLS 1.3
"""

import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CERTS_DIR = BASE_DIR / "certs"
CERT_FILE = CERTS_DIR / "fullchain.pem"
KEY_FILE = CERTS_DIR / "server.key"

def main():
    if not (CERT_FILE.exists() and KEY_FILE.exists()):
        print("Certificados HTTPS no encontrados. Generando certificados con CA local...")
        from generar_certificados_https import generar_certificados_firmados
        generar_certificados_firmados()

    print("\n" + "="*60)
    print(" 🔒 INICIANDO SERVIDOR ACTAS DIGITALES CON HTTPS Y TLS 1.3")
    print(f"  - Certificado: {CERT_FILE}")
    print(f"  - Clave privada: {KEY_FILE}")
    print("  - URL Segura:  https://127.0.0.1:8443 o https://localhost:8443")
    print("="*60 + "\n")

    cmd = [
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8443",
        "--ssl-keyfile", str(KEY_FILE),
        "--ssl-certfile", str(CERT_FILE),
        "--app-dir", str(BASE_DIR / "backend")
    ]
    subprocess.run(cmd)

if __name__ == "__main__":
    main()
