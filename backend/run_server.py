#!/usr/bin/env python3
"""
Lanzador universal del servidor Actas Digitales.
Gestiona el autoaseguramiento de certificados TLS 1.3, autoinstalacion de dependencias
y deteccion de entornos virtuales (venv / .venv) de forma robusta y multiplataforma.
"""

import sys
import os
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Silenciar excepcion benigna de Windows asyncio Proactor en desconexiones SSE
if sys.platform == "win32":
    try:
        import asyncio
        from asyncio.proactor_events import _ProactorBasePipeTransport
        _orig_ccl = _ProactorBasePipeTransport._call_connection_lost
        def _silent_ccl(self, exc):
            try:
                _orig_ccl(self, exc)
            except ConnectionResetError:
                pass
            except Exception:
                pass
        _ProactorBasePipeTransport._call_connection_lost = _silent_ccl
    except Exception:
        pass

def ejecutar_pip_install(py_exe, req_path):
    cmd = [str(py_exe), "-m", "pip", "install", "-r", str(req_path)]
    try:
        subprocess.check_call(cmd)
        return True
    except subprocess.CalledProcessError:
        try:
            subprocess.check_call(cmd + ["--break-system-packages"])
            return True
        except Exception as e:
            print(f"[!] Advertencia al instalar con pip: {e}")
            return False

def asegurar_dependencias():
    """Valida que uvicorn, fastapi, cryptography y python-docx esten disponibles."""
    try:
        import uvicorn
        import fastapi
        import docx
        import cryptography
        return
    except ImportError as e:
        print(f"[*] Modulo faltante en el interprete actual ({sys.executable}): {e.name}")

    # Buscar si existe un entorno virtual en backend o raiz
    posibles_venvs = [
        BASE_DIR / "venv",
        BASE_DIR / ".venv",
        ROOT_DIR / "venv",
        ROOT_DIR / ".venv",
    ]
    for v in posibles_venvs:
        py_win = v / "Scripts" / "python.exe"
        py_nix = v / "bin" / "python"
        candidate = py_win if os.name == "nt" else py_nix
        if candidate.exists() and str(candidate.resolve()) != str(Path(sys.executable).resolve()):
            print(f"[*] Entorno virtual detectado en: {v}")
            req_file = BASE_DIR / "requirements.txt"
            res = subprocess.run([str(candidate), "-c", "import uvicorn, fastapi; print('OK')"],
                                 capture_output=True, text=True)
            if "OK" not in res.stdout:
                print(f"[*] Instalando librerias faltantes en el entorno virtual ({v})...")
                ejecutar_pip_install(candidate, req_file)
            
            print(f"[*] Reanudando servidor con el entorno virtual ({candidate})...")
            ret = subprocess.call([str(candidate)] + sys.argv)
            sys.exit(ret)

    # Si no hay otro venv o ya estamos en el venv, instalar en el interprete actual
    print("[*] Instalando dependencias necesarias en el interprete actual...")
    req_file = BASE_DIR / "requirements.txt"
    if ejecutar_pip_install(sys.executable, req_file):
        print("[OK] Dependencias instaladas con exito.")
        ret = subprocess.call([sys.executable] + sys.argv)
        sys.exit(ret)

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

    # 1. Asegurar dependencias (uvicorn, fastapi, docx, etc.)
    asegurar_dependencias()

    # 2. Asegurar certificados TLS 1.3
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
