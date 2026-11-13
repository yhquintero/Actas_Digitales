import React, { useState } from 'react';
import { SECURITY_FEATURES, SECURITY_RECOMMENDATIONS } from '../../constants/security';
import { Shield, Lock, CheckCircle2, Server, X } from 'lucide-react';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  if (!isOpen) return null;

  const categories = [
    { id: 'todos', label: 'Todas las Capas' },
    { id: 'Cifrado & Transporte', label: 'TLS 1.3 & Cifrado' },
    { id: 'Integridad & Custodia', label: 'Cadena de Custodia SHA-256' },
    { id: 'Privacidad & Soberanía', label: 'Modo Soberano On-Premise' },
    { id: 'Defensa en Profundidad', label: 'Cabeceras & Rate Limit' },
  ];

  const filteredFeatures =
    activeCategory === 'todos'
      ? SECURITY_FEATURES
      : SECURITY_FEATURES.filter((f) => f.category === activeCategory);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-indigo-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-lg text-white">
                  Centro de Seguridad, Blindaje y Cadena de Custodia
                </h3>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Nivel Gubernamental
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Arquitectura de defensa integral para garantizar "Captura. Transcribe. Consolida. Formaliza." sin fisuras.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-white p-2 rounded-lg hover:bg-white/10 hover:dark:bg-slate-900/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-slate-100 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {/* Active Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeatures.map((feat) => (
              <div
                key={feat.id}
                className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900 hover:border-indigo-300 hover:dark:border-indigo-700 transition-all shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{feat.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                    {feat.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feat.description}</p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1 text-[11px]">
                  <p className="text-indigo-900 font-medium flex items-center gap-1">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">Impacto:</span> {feat.impact}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px] bg-slate-50 dark:bg-slate-950 p-1.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                    {feat.technicalDetails}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Strategic Alternatives for Further Hardening */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-sm text-white">
                  Alternativas de Mejora de Seguridad para Producción
                </h4>
              </div>
              <span className="text-[11px] font-mono text-cyan-300">Hoja de Ruta Legal Tech</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {SECURITY_RECOMMENDATIONS.map((rec, i) => (
                <div key={i} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-1">
                  <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{rec.title}</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <p className="flex items-center gap-1.5 font-mono">
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            Certificados TLS 1.3 SAN: localhost, 127.0.0.1, actasdigitales.local
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
