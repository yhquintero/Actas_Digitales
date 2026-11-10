#!/usr/bin/env python3
"""
Lanzador universal del servidor Actas Digitales.
Gestiona el arranque de Uvicorn con TLS 1.3 / HTTPS de forma robusta y multiplataforma.
"""

import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

def asegurar_certificados():
    certs_dir = ROOT_DIR / "certs"
    key_path = certs_dir / "server.key"
    cert_path = certs_dir / "fullchain.pem"
    ca_path = certs_dir / "ca.crt"

    if not (key_path.exists() and cert_path.exists() and ca_path.exists()):
        print("[*] Generando certificados TLS 1.3 con SAN...")
        try:
            from tools.generar_certificados_https import generar_certificados_firmados
            generar_certificados_firmados(salida_dir=certs_dir)
            print("[OK] Certificados generados exitosamente.")
        except Exception as e:
            print(f"[!] Error al generar certificados: {e}")

    return key_path, cert_path

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Actas Digitales Server")
    parser.add_argument("--port", type=int, default=8443, help="Puerto del servidor (def: 8443)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host (def: 0.0.0.0)")
    parser.add_argument("--no-ssl", action="store_true", help="Desactivar SSL/TLS")
    args, _ = parser.parse_known_args()

    # Si se pasa un argumento posicional numérico (ej: python run_server.py 8443)
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        args.port = int(sys.argv[1])

    ssl_kwargs = {}
    if not args.no_ssl:
        key_path, cert_path = asegurar_certificados()
        if key_path.exists() and cert_path.exists():
            ssl_kwargs = {
                "ssl_keyfile": str(key_path),
                "ssl_certfile": str(cert_path),
            }
            print(f"[*] Modo HTTPS activado en https://localhost:{args.port}")
        else:
            print(f"[!] Certificados no disponibles. Iniciando en modo HTTP...")

    import uvicorn
    from app.main import app

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info",
        **ssl_kwargs
    )

if __name__ == "__main__":
    main()
