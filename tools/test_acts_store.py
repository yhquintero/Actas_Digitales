#!/usr/bin/env python3
"""Prueba el almacén SQLite de actas sincronizadas y la retención automática.

Aislada: usa un directorio temporal propio y restaura settings.UPLOAD_DIR al finalizar.
"""
import json
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.app.config import settings  # noqa: E402

original_upload_dir = settings.UPLOAD_DIR

def main() -> int:
    ok = True
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        settings.UPLOAD_DIR = tmp_path

        # 1) Semilla legada JSONL con una fila válida y una corrupto
        legacy = tmp_path / 'synced_acts.jsonl'
        valid_sha = 'a' * 64
        legacy.write_text(
            json.dumps({'audio_sha256': valid_sha, 'filename': 'acta1.m4a',
                        'final_text': 'Texto final 1', 'words_count': 10,
                        'removed_fillers': 2, 'orthographic_corrections': 3,
                        'timestamp': 1000}) + '\n'
            + 'no-es-json\n'
            + json.dumps({'audio_sha256': 'bb', 'filename': 'corta', 'final_text': 'x'}) + '\n',
            encoding='utf-8')

        from backend.app.services import acts_store, retention
        acts_store.init()

        n = acts_store.count_acts()
        print(f'  [1] Migración JSONL → SQLite: filas={n} (esperado 1)')
        ok &= (n == 1)
        assert not legacy.exists(), 'el JSONL legado debe renombrarse tras la migración'
        ok = ok and not legacy.exists()

        # 2) Sync idempotente: reenviar la misma acta cuenta como duplicado
        stored, dups = acts_store.sync_items([
            {'audio_sha256': valid_sha, 'filename': 'acta1.m4a', 'final_text': 'Texto final 1'},
        ])
        print(f'  [2] Re-sync del mismo SHA-256: stored={stored} duplicates={dups}')
        ok &= (stored == 0 and dups == 1)

        # 3) Insertar una nueva y verificar orden por timestamp desc
        new_sha = 'c' * 64
        stored, dups = acts_store.sync_items([
            {'audio_sha256': new_sha, 'filename': 'acta2.m4a', 'final_text': 'Texto final 2',
             'timestamp': 2000},
        ])
        acts = acts_store.list_acts(10)
        print(f'  [3] Sync nueva acta: stored={stored} · total listado={len(acts)} · primera={acts[0]["filename"]}')
        ok &= (stored == 1 and len(acts) == 2 and acts[0]['filename'] == 'acta2.m4a')

        # 4) Retención: fichero antiguo se borra; acts.db y .gitkeep se conservan
        old_file = tmp_path / 'viejo.wav'
        old_file.write_bytes(b'x' * 16)
        forever = tmp_path / '.gitkeep'
        forever.write_bytes(b'')
        os_time = time.time() - 31 * 24 * 3600
        import os
        os.utime(old_file, (os_time, os_time))
        removed, freed = retention.purge_old_uploads(720)
        print(f'  [4] Retención 720h: eliminados={removed} bytes_liberados={freed}')
        ok &= (removed == 1 and not old_file.exists())
        assert (tmp_path / 'acts.db').exists(), 'acts.db jamás debe ser purgado'
        ok = ok and (tmp_path / 'acts.db').exists()
        assert forever.exists(), '.gitkeep jamás debe ser purgado'
        ok = ok and forever.exists()
        ok = ok and True

        # 5) Retención desactivada con 0
        removed, freed = retention.purge_old_uploads(0)
        print(f'  [5] Retención 0 (desactivada): eliminados={removed}')
        ok &= (removed == 0)

    settings.UPLOAD_DIR = original_upload_dir
    print('\nRESULTADO:', 'todas las pruebas superadas ✔' if ok else 'FALLOS DETECTADOS ✘')
    return 0 if ok else 1

if __name__ == '__main__':
    sys.exit(main())
