import React, { useEffect, useState } from 'react';
import { Cloud, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { ApiService } from '../services/api';
import { SyncedActa } from '../types';

/**
 * Actas sincronizadas desde la App móvil.
 * La app persiste en Room (local del teléfono) y sube lotes idempotentes
 * (POST /api/acts/sync); esta sección muestra la copia compartida en el
 * servidor. Si el servidor no tiene actas o el endpoint falla, se oculta.
 */
export const SyncedActas: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [acts, setActs] = useState<SyncedActa[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ApiService.listSyncedActas(10).then((res) => {
      if (cancelled) return;
      setTotal(res.total);
      setActs(res.acts);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;
  if (total === 0) return null;

  return (
    <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 font-semibold">
          <Cloud className="w-4 h-4" />
          Actas del móvil (Room → servidor)
          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
            {total}
          </span>
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <ul className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
          {acts.map((acta) => (
            <li
              key={acta.audio_sha256}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2"
            >
              <button
                className="w-full flex items-center gap-2 text-left"
                onClick={() => setExpandedId((id) => (id === acta.audio_sha256 ? null : acta.audio_sha256))}
                aria-expanded={expandedId === acta.audio_sha256}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {acta.filename}
                  </span>
                  <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {acta.words_count} palabras · sha {acta.audio_sha256.slice(0, 12)}…
                  </span>
                </span>
              </button>
              {expandedId === acta.audio_sha256 && (
                <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-4 whitespace-pre-wrap">
                  {acta.final_text}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
