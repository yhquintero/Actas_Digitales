import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Cloud, ChevronDown, ChevronUp, FileText, KeyRound, Loader2, Search, X } from 'lucide-react';
import { ApiService } from '../services/api';
import { SyncedActa, SyncedActaSearchResult } from '../types';

/**
 * Actas sincronizadas desde la App móvil (Room → SQLite del servidor).
 *
 * Seguridad: el servidor exige X-Sync-Token (ACTAS_SYNC_TOKEN). Esta sección
 * lo pide UNA vez por pestaña (sessionStorage). Sin token o con token malo,
 * muestra un panel honesto en vez de ocultarse en silencio.
 *
 * Búsqueda: GET /api/acts/search?q=… (SQLite FTS5 en el servidor, BM25,
 * snippet con «» como marcas de resaltado). La consulta se procesa siempre
 * en el servidor; nada sale de la infraestructura.
 */
type LoadState =
  | { kind: 'loading' }
  | { kind: 'locked'; reason: 'missing' | 'invalid' | 'disabled' | 'error' }
  | { kind: 'ready' };

export const SyncedActas: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [total, setTotal] = useState(0);
  const [acts, setActs] = useState<SyncedActa[]>([]);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenBusy, setTokenBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Búsqueda FTS5
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SyncedActaSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    const { status, data } = await ApiService.listSyncedActasRaw(10);
    if (status === 200 && data) {
      setTotal(data.total);
      setActs(data.acts);
      setState({ kind: 'ready' });
      return;
    }
    if (status === 401) setState({ kind: 'locked', reason: 'invalid' });
    else if (status === 503) setState({ kind: 'locked', reason: 'disabled' });
    else setState({ kind: 'locked', reason: status === 0 ? 'error' : 'missing' });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Búsqueda con debounce; solo cuando hay token válido y al menos 2 caracteres
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setSearching(false);
      setSearchError(null);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await ApiService.searchSyncedActas(q, 20);
        setResults(res.results);
        setSearchError(null);
      } catch (err) {
        setResults([]);
        setSearchError(err instanceof Error ? err.message : 'No se pudo buscar.');
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleUnlock = async () => {
    const token = tokenInput.trim();
    if (!token) return;
    setTokenBusy(true);
    setTokenError(null);
    ApiService.setSyncToken(token);
    const { status, data } = await ApiService.listSyncedActasRaw(10);
    if (status === 200 && data) {
      setTotal(data.total);
      setActs(data.acts);
      setState({ kind: 'ready' });
      setTokenInput('');
    } else {
      ApiService.setSyncToken('');
      setTokenError(status === 503 ? 'El servidor no tiene ACTAS_SYNC_TOKEN configurado.' : 'Token rechazado por el servidor.');
      setState({ kind: 'locked', reason: status === 503 ? 'disabled' : 'invalid' });
    }
    setTokenBusy(false);
  };

  if (state.kind === 'loading') return null;

  // Bloqueado: panel honesto en lugar de ocultar la función en silencio
  if (state.kind === 'locked') {
    const disabled = state.reason === 'disabled';
    return (
      <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <KeyRound className="w-4 h-4 text-amber-500" />
            Actas del móvil protegidas
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            {disabled
              ? 'El servidor no tiene ACTAS_SYNC_TOKEN configurado: la sincronización está desactivada (seguro por defecto).'
              : 'El servidor exige el token de sincronización. Introdúcelo para ver y buscar las actas del móvil (se guarda solo en esta pestaña).'}
          </p>
          {!disabled && (
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="ACTAS_SYNC_TOKEN"
                aria-label="Token de sincronización"
                className="flex-1 min-w-0 text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={handleUnlock}
                disabled={tokenBusy || !tokenInput.trim()}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white transition flex items-center gap-1"
              >
                {tokenBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                Entrar
              </button>
            </div>
          )}
          {tokenError && <p className="text-[11px] text-rose-600 dark:text-rose-400">{tokenError}</p>}
        </div>
      </div>
    );
  }

  if (total === 0 && !query) {
    return (
      <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic inline-flex items-center gap-1.5">
          <Cloud className="w-4 h-4" /> Sin actas sincronizadas aún desde la app móvil.
        </p>
      </div>
    );
  }

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
        <>
          {/* Buscador FTS5 en el servidor */}
          <div className="mt-2 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
            {searching ? (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en actas (FTS5): «presupuesto», «quórum»…"
              aria-label="Buscar en actas sincronizadas"
              className="flex-1 min-w-0 text-[11px] bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchError && <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{searchError}</p>}

          {results !== null ? (
            <ul className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
              {results.length === 0 && (
                <li className="text-[11px] text-slate-400 dark:text-slate-500 italic px-1">Sin coincidencias para «{query.trim()}».</li>
              )}
              {results.map((hit) => (
                <li key={hit.audio_sha256} className="rounded-xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/40 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{hit.filename}</span>
                    <span className="ml-auto text-[9px] font-mono text-slate-400">bm25 {hit.rank.toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{hit.snippet}</p>
                </li>
              ))}
            </ul>
          ) : (
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
        </>
      )}
    </div>
  );
};
