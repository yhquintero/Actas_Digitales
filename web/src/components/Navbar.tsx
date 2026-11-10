import React, { useState } from 'react';
import { Mic, Key, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ apiKey, onApiKeyChange }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  const handleSave = () => {
    onApiKeyChange(tempKey);
    setShowSettings(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">Actas Digitales</span>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Voz a texto consolidado y corrección ortotipográfica en español
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium">Motor NLP Español Activo</span>
          </div>

          <button
            onClick={() => {
              setTempKey(apiKey);
              setShowSettings(true);
            }}
            className="flex items-center space-x-1.5 text-xs text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? 'API Key configurada' : 'Configurar API Key'}</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 mb-3">
              <Key className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900 text-lg">Configuración de Proveedor IA</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Por defecto el servidor utiliza el motor integrado de procesamiento y corrección en español. Opcionalmente puedes suministrar una API Key de OpenAI o Groq para modelos cloud como Whisper o GPT-4o.
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
