#!/usr/bin/env python3
"""
Acceso directo universal para ejecutar Actas Digitales desde la raiz del repositorio.
Permite ejecutar 'python run_server.py' directamente en la carpeta principal.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from run_server import main

if __name__ == "__main__":
    main()
