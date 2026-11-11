import React, { useState } from 'react';
import { PILLARS_DATA } from '../../constants/pillars';
import { PillarStep } from '../../types';
import { Mic, FileAudio, Sparkles, FileCheck, CheckCircle2, ChevronRight, Shield, Zap, Lock } from 'lucide-react';

interface PillarsWorkflowProps {
  currentStage?: 'captura' | 'transcribe' | 'consolida' | 'formaliza';
  onPillarClick?: (pillar: PillarStep) => void;
}

export const PillarsWorkflow: React.FC<PillarsWorkflowProps> = ({
  currentStage,
  onPillarClick,
}) => {
  const [selectedPillarId, setSelectedPillarId] = useState<string>('captura');

  const selectedPillar = PILLARS_DATA.find((p) => p.id === selectedPillarId) || PILLARS_DATA[0];

  const getPillarIcon = (id: string) => {
    switch (id) {
      case 'captura':
        return <Mic className="w-5 h-5" />;
      case 'transcribe':
        return <FileAudio className="w-5 h-5" />;
      case 'consolida':
        return <Sparkles className="w-5 h-5" />;
      case 'formaliza':
        return <FileCheck className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 border-b border-indigo-950 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-indigo-400 uppercase font-bold px-2 py-0.5 rounded bg-indigo-900/50 border border-indigo-500/30">
              Pipeline de Inteligencia Acústica RAE
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              <Lock className="w-3 h-3" /> Blindaje Criptográfico TLS 1.3
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
            Captura. Transcribe. Consolida. Formaliza.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5 max-w-2xl">
            Los cuatro pilares de ingeniería para transformar cualquier archivo de audio o señal oral en actas oficiales con validez legal.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-mono text-slate-400">Estado del Motor</p>
            <p className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Operativo 100% On-Premise
            </p>
          </div>
        </div>
      </div>

      {/* Stepper Grid (4 Pillars) */}
      <div className="p-4 sm:p-6 bg-slate-50/50 border-b border-slate-200/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PILLARS_DATA.map((pillar) => {
            const isSelected = selectedPillarId === pillar.id;
            const isCurrentInExecution = currentStage === pillar.id;

            return (
              <button
                key={pillar.id}
                onClick={() => {
                  setSelectedPillarId(pillar.id);
                  if (onPillarClick) onPillarClick(pillar);
                }}
                className={`relative text-left p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white shadow-2xs'
                }`}
              >
                {isCurrentInExecution && (
                  <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                    En Proceso
                  </span>
                )}

                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {getPillarIcon(pillar.id)}
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    0{pillar.order}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
                    <span>{pillar.title}</span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </h3>
                  <p className="text-xs text-indigo-600 font-semibold">{pillar.subtitle}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{pillar.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Pane for Selected Pillar */}
      <div className="p-5 sm:p-6 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                Pilar 0{selectedPillar.order} · {selectedPillar.title.toUpperCase()}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {selectedPillar.metrics}
              </span>
            </div>

            <h4 className="text-lg font-bold text-slate-900">
              {selectedPillar.subtitle}: <span className="font-normal text-slate-600">{selectedPillar.tagline}</span>
            </h4>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {selectedPillar.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {selectedPillar.highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Technical Specs Card */}
          <div className="lg:w-80 bg-slate-900 text-white rounded-xl p-4.5 border border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2 mb-3">
                <span className="font-mono uppercase">Seguridad & Rendimiento</span>
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <ul className="text-xs space-y-2 text-slate-300">
                <li className="flex justify-between">
                  <span className="text-slate-400">Canal Seguro:</span>
                  <span className="font-mono text-emerald-400 font-bold">HTTPS TLS 1.3</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Hash de Custodia:</span>
                  <span className="font-mono text-cyan-300">SHA-256</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Gramática:</span>
                  <span className="font-semibold text-white">RAE Española</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Fidelidad:</span>
                  <span className="text-emerald-400 font-bold">100% Acústica</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 leading-tight">
                Diseñado para consejos de administración, asambleas de socios y organismos oficiales con estricto secreto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
