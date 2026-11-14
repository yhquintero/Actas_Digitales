import React from 'react';
import { Shield, Cpu, Smartphone } from 'lucide-react';

interface FooterProps {
  onOpenSecurity: () => void;
  onOpenControlPanel: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenSecurity,
  onOpenControlPanel,
}) => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 mt-12 py-8 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            AD
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Actas Digitales · <span className="font-normal text-slate-500 dark:text-slate-400">Captura. Transcribe. Consolida. Formaliza.</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Arquitectura Segura de Audio a Texto con Ortotipografía Oficial RAE
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
          <a
            href="#descarga-app"
            className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Descargar App Android</span>
          </a>

          <button
            onClick={onOpenSecurity}
            className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Blindaje TLS 1.3 & SHA-256</span>
          </button>

          <button
            onClick={onOpenControlPanel}
            className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Panel de Telemetría</span>
          </button>

          <span className="font-mono text-slate-400 dark:text-slate-500">v1.7.0 · On-Premise Sovereign</span>
        </div>
      </div>
    </footer>
  );
};
