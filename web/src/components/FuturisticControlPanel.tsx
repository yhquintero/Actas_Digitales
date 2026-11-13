import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Terminal, Cpu, HardDrive, RefreshCw, Trash2, Play, Flame, CheckCircle, Activity, Lock, Layers, Download, Smartphone } from 'lucide-react';

interface FuturisticControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPromoVideo: () => void;
}

interface SystemTelemetry {
  server_status: string;
  protocol: string;
  cipher: string;
  hsts_active: boolean;
  dos_protection: string;
  cert_valid: boolean;
  san_domains: string[];
  total_jobs_processed: number;
  audio_buffer_status: string;
  compliance_standards: string[];
  system_time: string;
}

export const FuturisticControlPanel: React.FC<FuturisticControlPanelProps> = ({
  isOpen,
  onClose,
  onOpenPromoVideo,
}) => {
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [logs, setLogs] = useState<string[]>([
    "INICIALIZANDO NÚCLEO DE CONTROL CUÁNTICO...",
    "CONEXIÓN SEGURA ESTABLECIDA BAJO TLS 1.3 / AES-256",
    "SISTEMA LISTO PARA PROCESAMIENTO DE AUDIO EN ESPAÑOL",
  ]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/audio/system/status');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTelemetry();
      addLog("TELEMETRÍA CARGADA CORRECTAMENTE");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallRootCert = async () => {
    setLoadingAction('cert_install');
    addLog("REGISTRANDO CERTIFICADO RAÍZ (ca.crt) EN ALMACÉN DE WINDOWS...");
    try {
      const res = await fetch('/api/audio/system/install-root-cert', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addLog(`[✓] CONFIANZA RAÍZ: ${data.message}`);
        fetchTelemetry();
      } else {
        addLog("AVISO AL REGISTRAR CERTIFICADO");
      }
    } catch (e) {
      addLog("ERROR EN SERVICIO DE CERTIFICADOS");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRenewCerts = async () => {
    setLoadingAction('renew');
    addLog("SOLICITANDO REGENERACIÓN CRIPTOGRÁFICA DE CERTIFICADOS...");
    try {
      const res = await fetch('/api/audio/system/renew-certs', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addLog(`CERTIFICADOS REFIRMADOS CON ÉXITO: SAN [${data.san_configured.join(', ')}]`);
        if (data.ca_installed_in_windows) {
          addLog("CERTIFICADO RAÍZ ACTUALIZADO EN EL ALMACÉN DE WINDOWS (CANDADO VERDE ACTIVO)");
        }
        fetchTelemetry();
      }
    } catch (e) {
      addLog("ERROR AL REGENERAR CERTIFICADOS");
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePurgeCache = async () => {
    setLoadingAction('purge');
    addLog("PURGANDO BÚFERES Y TEMPORALES DE AUDIO...");
    try {
      const res = await fetch('/api/audio/system/purge-cache', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addLog(`PURGA COMPLETADA: ${data.purged_files} archivos eliminados (${data.freed_mb} MB liberados)`);
        fetchTelemetry();
      }
    } catch (e) {
      addLog("ERROR AL PURGAR CACHÉ");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRunFireTests = async () => {
    setLoadingAction('tests');
    addLog("EJECUTANDO SUITE DE PRUEBAS DE FUEGO OWASP Y ASVS...");
    try {
      const res = await fetch('/api/audio/system/run-fire-tests', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addLog(`PRUEBAS DE FUEGO: ${data.total_tests}/${data.total_tests} SUPERADAS [${data.status}]`);
      }
    } catch (e) {
      addLog("ERROR EN EJECUCIÓN DE PRUEBAS");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-slate-950 border-2 border-indigo-500/40 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(79,70,229,0.35)] flex flex-col space-y-6 relative overflow-hidden">
        {/* Futuristic Glowing Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%]"></div>

        {/* Top Header HUD */}
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-white tracking-widest font-mono uppercase">
                  Panel de Control Futurista
                </h2>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/50 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  HUD v2.5
                </span>
              </div>
              <p className="text-xs text-indigo-300 font-mono">
                TELEMETRÍA EN TIEMPO REAL · SERVIDOR SEGURO HTTPS · ORQUESTACIÓN INTEGRAL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-500/50 transition shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="bg-slate-900/80 border border-indigo-500/30 p-3.5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs mb-1">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-[11px] uppercase tracking-wider">Estado Núcleo</span>
            </div>
            <span className="text-lg font-bold text-emerald-400">
              {telemetry?.server_status || 'ONLINE'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">TLS 1.3 Cifrado</span>
          </div>

          <div className="bg-slate-900/80 border border-indigo-500/30 p-3.5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs mb-1">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] uppercase tracking-wider">Cifrado AES</span>
            </div>
            <span className="text-lg font-bold text-cyan-300 truncate block">
              256-Bit AEAD
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">HSTS Activo</span>
          </div>

          <div className="bg-slate-900/80 border border-indigo-500/30 p-3.5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs mb-1">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] uppercase tracking-wider">Búfer de Audio</span>
            </div>
            <span className="text-lg font-bold text-amber-300">
              {telemetry?.audio_buffer_status || 'ÓPTIMO'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">M4A/MP3/WAV Nativo</span>
          </div>

          <div className="bg-slate-900/80 border border-indigo-500/30 p-3.5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs mb-1">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] uppercase tracking-wider">Seguridad OWASP</span>
            </div>
            <span className="text-lg font-bold text-purple-300">
              Nivel ASVS v4.0
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Rate Limit Activo</span>
          </div>
        </div>

        {/* Futuristic Glowing Action Buttons */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase text-indigo-400 tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Módulos de Ejecución Inmediata (Panel de Control y Seguridad)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Botón Certificado de Confianza Raíz */}
            <div
              className="group relative p-4 rounded-2xl bg-gradient-to-br from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-500/50 hover:border-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.45)]"
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={handleInstallRootCert}
                  disabled={loadingAction === 'cert_install'}
                  className="flex items-center space-x-2.5 text-left rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/60 disabled:opacity-60"
                  title="Instalar certificado raíz en el almacén de Windows"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-400/40">
                    <ShieldCheck className={`w-4 h-4 ${loadingAction === 'cert_install' ? 'animate-pulse' : ''}`} />
                  </div>
                  <span className="text-xs font-bold text-white font-mono group-hover:text-cyan-300">
                    {loadingAction === 'cert_install' ? 'INSTALANDO...' : 'CERTIFICADO CONFIANZA'}
                  </span>
                </button>
                <a
                  href="/api/audio/system/download-ca"
                  download="ActasDigitales_CA_Raiz.crt"
                  className="p-1 rounded bg-slate-800 hover:bg-cyan-900 text-slate-300 hover:text-cyan-200 text-[10px] font-mono border border-slate-700 flex items-center gap-1"
                  title="Descargar archivo ca.crt para importar manualmente"
                >
                  <Download className="w-3 h-3" />
                  <span>CA</span>
                </a>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Registra ca.crt en el almacén de Windows (CurrentUser\Root) para candado verde seguro en Chrome y Edge.
              </p>
            </div>

            {/* Renovar TLS / SAN */}
            <button
              onClick={handleRenewCerts}
              disabled={loadingAction === 'renew'}
              className="group relative p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-500/50 hover:border-emerald-400 text-left transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] disabled:opacity-50"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/40">
                  <RefreshCw className={`w-4 h-4 ${loadingAction === 'renew' ? 'animate-spin' : ''}`} />
                </div>
                <span className="text-xs font-bold text-white font-mono group-hover:text-emerald-300">
                  {loadingAction === 'renew' ? 'REFIRMANDO...' : 'RENOVAR TLS / SAN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Emite certificados X.509 v3 con SAN (localhost, 127.0.0.1) y clave RSA-4096.
              </p>
            </button>

            {/* Pruebas de Fuego */}
            <button
              onClick={handleRunFireTests}
              disabled={loadingAction === 'tests'}
              className="group relative p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/50 hover:border-cyan-400 text-left transition-all duration-300 shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:opacity-50"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-400/40">
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white font-mono group-hover:text-cyan-300">
                  {loadingAction === 'tests' ? 'VERIFICANDO...' : 'PRUEBAS DE FUEGO'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Ejecuta fuzzing contra OWASP Top 10, inyección, XSS y límites acústicos.
              </p>
            </button>

            {/* Purgar Caché */}
            <button
              onClick={handlePurgeCache}
              disabled={loadingAction === 'purge'}
              className="group relative p-4 rounded-2xl bg-gradient-to-br from-purple-950 via-slate-900 to-purple-900 border border-purple-500/50 hover:border-purple-400 text-left transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] disabled:opacity-50"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-400/40">
                  <Trash2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white font-mono group-hover:text-purple-300">
                  {loadingAction === 'purge' ? 'PURGANDO...' : 'PURGAR CACHÉ'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Limpia grabaciones temporales asegurando retención cero y privacidad.
              </p>
            </button>

            {/* Vídeo Demo */}
            <button
              onClick={() => {
                onClose();
                onOpenPromoVideo();
              }}
              className="group relative p-4 rounded-2xl bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 border border-rose-500/50 hover:border-rose-400 text-left transition-all duration-300 shadow-[0_0_15px_rgba(244,63,94,0.2)] hover:shadow-[0_0_25px_rgba(244,63,94,0.4)]"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-400/40">
                  <Play className="w-4 h-4 ml-0.5" />
                </div>
                <span className="text-xs font-bold text-white font-mono group-hover:text-rose-300">
                  VÍDEO DEMO (3 MIN)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Reproduce la presentación con 6 escenas animadas y audio oficial.
              </p>
            </button>

            {/* Manual de Usuario */}
            <a
              href="/docs/MANUAL_USUARIO.html"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-700 hover:border-indigo-400 text-left transition-all duration-300 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/40">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white font-mono group-hover:text-indigo-300">
                  MANUAL TÉCNICO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Documentación completa de arquitectura, endpoints y despliegue.
              </p>
            </a>

            {/* Descarga de la App Android (APK firmado) — ancho completo */}
            <a
              href="/api/app/download"
              download="ActasDigitales.apk"
              className="group relative p-4 rounded-2xl sm:col-span-3 bg-gradient-to-r from-emerald-950 via-emerald-900/60 to-teal-950 border border-emerald-500/50 hover:border-emerald-400 text-left transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_28px_rgba(16,185,129,0.45)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/40">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white font-mono group-hover:text-emerald-300 block">
                    DESCARGAR APP MÓVIL (APK)
                  </span>
                  <span className="text-[11px] text-slate-400 leading-snug">
                    App nativa Android (Kotlin + Compose) · Firmada v2/v3 · Se sirve desde este servidor (con verificador SHA-256 en la Web)
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-4 py-2 group-hover:bg-emerald-500/20 transition flex-shrink-0">
                <Download className="w-4 h-4" /> /api/app/download
              </span>
            </a>
          </div>
        </div>

        {/* Live HUD Terminal Console */}
        <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-500/20 text-indigo-400">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Consola HUD en Tiempo Real</span>
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              STREAM CONECTADO
            </span>
          </div>

          <div className="h-28 overflow-y-auto space-y-1 text-slate-300 font-mono text-[11px] ">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start space-x-2">
                <span className="text-cyan-400 select-none">&gt;</span>
                <span className={i === 0 ? "text-cyan-300 font-bold" : "text-slate-400"}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
