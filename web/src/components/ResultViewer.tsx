import React, { useState } from 'react';
import { Copy, Check, Download, Sparkles, FileText, SplitSquareVertical, ArrowRight } from 'lucide-react';
import { JobResponse } from '../types';

interface ResultViewerProps {
  job: JobResponse;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ job }) => {
  const [activeTab, setActiveTab] = useState<'corrected' | 'comparison' | 'raw' | 'corrections'>('corrected');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'txt' | 'md') => {
    const textToExport = job.final_corrected_text || '';
    let content = textToExport;
    let filename = `${job.filename.replace(/\.[^/.]+$/, '')}_corregido.${format}`;

    if (format === 'md') {
      content = `# Acta Transcrita y Corregida\n\n**Archivo Original:** ${job.filename}\n**Fecha:** ${new Date(job.created_at).toLocaleString('es-ES')}\n**Duración:** ${job.stats?.audio_duration_sec || 0}s\n\n---\n\n## Texto Corregido\n\n${textToExport}\n\n---\n\n### Estadísticas de Procesamiento\n- Palabras originales: ${job.stats?.original_words}\n- Palabras finales consolidadas: ${job.stats?.final_words}\n- Muletillas y cortes eliminados: ${job.stats?.removed_fillers}\n- Correcciones ortotipográficas: ${job.stats?.orthographic_corrections}\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8 animate-in fade-in">
      {/* Header bar with stats */}
      <div className="bg-slate-900 text-white p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Resultado Consolidado</h2>
              <p className="text-xs text-slate-400">Audio transcrito, desduplicado y corregido ortográficamente</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopy(job.final_corrected_text)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition border border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado al portapapeles' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={() => handleDownload('txt')}
              className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              <span>Descargar .TXT</span>
            </button>

            <button
              onClick={() => handleDownload('md')}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition border border-slate-700"
            >
              <FileText className="w-4 h-4" />
              <span>.MD</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        {job.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Tiempo Procesamiento</span>
              <span className="text-xl font-bold font-mono text-indigo-300">{job.stats.processing_time_sec}s</span>
              <span className="text-[10px] text-slate-500 block">audio: ~{job.stats.audio_duration_sec}s</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Palabras</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{job.stats.final_words}</span>
              <span className="text-[10px] text-slate-500 block">orig: {job.stats.original_words}</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Muletillas / Cortes</span>
              <span className="text-xl font-bold font-mono text-amber-400">{job.stats.removed_fillers}</span>
              <span className="text-[10px] text-slate-500 block">eliminadas</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Correcciones Ortotip.</span>
              <span className="text-xl font-bold font-mono text-cyan-400">{job.stats.orthographic_corrections}</span>
              <span className="text-[10px] text-slate-500 block">tildes y puntuación</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 px-6 flex space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('corrected')}
          className={`py-3.5 border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'corrected'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Texto Final Corregido</span>
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`py-3.5 border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'comparison'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SplitSquareVertical className="w-4 h-4" />
          <span>Comparativa Antes / Después</span>
        </button>

        <button
          onClick={() => setActiveTab('corrections')}
          className={`py-3.5 border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'corrections'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Auditoría de Cambios ({job.corrections_applied.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`py-3.5 border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'raw'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Transcripción Cruda (STT)</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'corrected' && (
          <div className="bg-slate-50/70 p-6 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-sans text-base whitespace-pre-wrap selection:bg-indigo-100">
            {job.final_corrected_text || 'No hay texto disponible'}
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Antes (Transcripción Original con Artefactos)
                </span>
              </div>
              <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-200 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {job.raw_transcription}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Después (Consolidado y Corregido)
                </span>
              </div>
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200 text-slate-900 text-sm leading-relaxed whitespace-pre-wrap font-sans font-medium">
                {job.final_corrected_text}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'corrections' && (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2">
            {job.corrections_applied.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No se detectaron faltas de ortografía o muletillas.</p>
            ) : (
              job.corrections_applied.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      c.type === 'muletilla'
                        ? 'bg-amber-100 text-amber-800'
                        : c.type === 'repeticion'
                        ? 'bg-purple-100 text-purple-800'
                        : c.type === 'puntuacion'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {c.type}
                    </span>
                    <span className="line-through text-slate-400 font-mono">{c.original || '—'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-900 font-mono">{c.corrected || '(suprimido)'}</span>
                  </div>
                  {c.explanation && (
                    <span className="text-slate-500 text-[11px] hidden sm:block truncate max-w-xs pl-2">
                      {c.explanation}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="space-y-4">
            <div className="bg-slate-100 p-4 rounded-xl text-slate-700 text-sm font-mono whitespace-pre-wrap">
              {job.raw_transcription}
            </div>

            {job.segments.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Segmentos de Audio con Marcas de Tiempo</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {job.segments.map((seg) => (
                    <div key={seg.id} className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs flex items-start space-x-3">
                      <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold flex-shrink-0">
                        {seg.start_time.toFixed(1)}s - {seg.end_time.toFixed(1)}s
                      </span>
                      <span className="text-slate-800">{seg.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
