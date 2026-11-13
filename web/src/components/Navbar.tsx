import React, { useState } from 'react';
import { Mic, Key, Film, ShieldCheck, Cpu, Shield, Smartphone } from 'lucide-react';

interface NavbarProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onOpenPromoVideo: () => void;
  onOpenControlPanel: () => void;
  onOpenSecurity?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiKey,
  onApiKeyChange,
  onOpenPromoVideo,
  onOpenControlPanel,
  onOpenSecurity,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  const handleSave = () => {
    onApiKeyChange(tempKey);
    setShowSettings(false);
  };

  return (
    <header className="bg-slate-900 border-b border-indigo-950 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-white tracking-tight">Actas Digitales</span>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/40 font-mono tracking-wider">
                v1.2 · ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Captura · Transcribe · Consolida · Formaliza
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Security Center Button */}
          {onOpenSecurity && (
            <button
              onClick={onOpenSecurity}
              className="flex items-center space-x-1.5 text-xs text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 px-3 py-1.5 rounded-xl transition-all border border-emerald-500/50 font-mono font-medium shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:shadow-[0_0_18px_rgba(16,185,129,0.5)]"
              title="Ver Centro de Seguridad y Cadena de Custodia"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Seguridad & Custodia</span>
              <span className="md:hidden">TLS 1.3</span>
            </button>
          )}

          {/* Download Android App Button */}
          <a
            href="#descarga-app"
            className="flex items-center space-x-1.5 text-xs text-emerald-100 bg-emerald-600/80 hover:bg-emerald-500/80 px-3 py-1.5 rounded-xl transition-all border border-emerald-400/50 font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_20px_rgba(16,185,129,0.55)]"
            title="Descargar la App para Android (APK firmado) directamente desde este servidor"
            aria-label="Descargar la App Android de Actas Digitales"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden sm:inline">App</span>
          </a>

          {/* Futuristic Control Panel Trigger Button */}
          <button
            onClick={onOpenControlPanel}
            className="flex items-center space-x-1.5 text-xs text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900/80 px-3 py-1.5 rounded-xl transition-all border border-cyan-500/50 font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]"
            title="Abrir Panel de Control Futurista"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Telemetría</span>
          </button>

          {/* Promo Video Trigger */}
          <button
            onClick={onOpenPromoVideo}
            className="hidden sm:flex items-center space-x-1.5 text-xs text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/60 px-3 py-1.5 rounded-xl transition-colors border border-indigo-500/40 font-medium"
            title="Ver presentación oficial de 3 minutos"
          >
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span>Vídeo</span>
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={() => {
              setTempKey(apiKey);
              setShowSettings(true);
            }}
            className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors border border-slate-700"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{apiKey ? 'API Key OK' : 'API Key'}</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fade-zoom-in">
            <div className="flex items-center space-x-2 mb-3">
              <Key className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900 text-lg">Configuración de Proveedor IA</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Por defecto el servidor utiliza el motor integrado de procesamiento y corrección en español. Opcionalmente puedes suministrar una API Key de OpenAI o Groq para modelos cloud como Whisper Large v3 o GPT-4o.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                API Key (OpenAI o Groq)
              </label>
              <input
                type="password"
                placeholder="sk-... o gsk_..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> La clave se transmite únicamente en el encabezado X-API-Key de tu sesión.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
