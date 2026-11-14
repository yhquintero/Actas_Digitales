#!/usr/bin/env python3
"""Verifica que la versión del proyecto esté sincronizada en todos los puntos:

  - web/package.json            (fuente canónica)
  - backend/app/config.py       (VERSION)
  - README.md                   (badge de versión)
  - docs/index.html             (brand-badge)
  - web/src/components/layout/Footer.tsx  (insignia vX · On-Premise Sovereign)
  - CHANGELOG.md                (existe sección [X])

Uso:  python3 tools/check_version_sync.py  (exit 0 OK, 1 divergencia)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors: list[str] = []

web_pkg = json.loads((ROOT / 'web' / 'package.json').read_text())
version = web_pkg['version']
print(f'Versión canónica (web/package.json): {version}')

def check(name: str, ok: bool, detail: str = ''):
    mark = '✓' if ok else '✗'
    suffix = f' — {detail}' if (detail and not ok) else ''
    print(f'  {mark} {name}{suffix}')
    if not ok:
        errors.append(name)

# backend VERSION
cfg = (ROOT / 'backend' / 'app' / 'config.py').read_text()
m = re.search(r'VERSION: str = "([^"]+)"', cfg)
check('backend/app/config.py VERSION', bool(m) and m.group(1) == version,
      f'encontrado: {m.group(1) if m else "sin match"}')

# README badge
readme = (ROOT / 'README.md').read_text()
m = re.search(r'versi%C3%B3n-([0-9][^-]*)-', readme)
check('README.md badge', bool(m) and m.group(1) == version,
      f'encontrado: {m.group(1) if m else "sin match"}')

# docs brand-badge
docs = (ROOT / 'docs' / 'index.html').read_text()
m = re.search(r'brand-badge">v([^<]+)</span>', docs)
check('docs/index.html brand-badge', bool(m) and m.group(1) == version,
      f'encontrado: {m.group(1) if m else "sin match"}')

# Footer web
footer = (ROOT / 'web' / 'src' / 'components' / 'layout' / 'Footer.tsx').read_text()
m = re.search(r'v([0-9][0-9.]*) · On-Premise Sovereign', footer)
check('Footer.tsx insignia', bool(m) and m.group(1) == version,
      f'encontrado: {m.group(1) if m else "sin match"}')

# CHANGELOG sección
changelog = (ROOT / 'CHANGELOG.md').read_text()
m = re.search(rf'## \[{re.escape(version)}\]', changelog)
check(f'CHANGELOG.md sección [{version}]', bool(m), 'no se encontró la sección')

if errors:
    print('\nDIVERGENCIA: actualiza los puntos anteriores para que todos coincidan con', version)
    sys.exit(1)
print('\nOK: la versión está sincronizada en todo el proyecto.')
