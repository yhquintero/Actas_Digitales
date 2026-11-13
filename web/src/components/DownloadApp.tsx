import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  ScanLine,
  BadgeCheck,
  Apple,
  Share,
  FileArchive,
  ChevronRight,
  Wifi,
} from 'lucide-react';
import { ApiService } from '../services/api';
import { AndroidAppInfo } from '../types';

const FALLBACK_APK_URL = '/api/app/download';

/**
 * Sección de descarga de la App Android directamente desde la Web.
 * Se apoya en el backend (/api/app/info y /api/app/download) para conocer
 * versión, tamaño y hash SHA-256 de custodia, y genera un código QR con la
 * URL absoluta de descarga para instalar desde el teléfono escaneando.
 */
export const DownloadApp: React.FC = () => {
  const [info, setInfo] = useState<AndroidAppInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSteps, setShowSteps] = useState(true);

  const absoluteDownloadUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${FALLBACK_APK_URL}`
      : FALLBACK_APK_URL;

  const loadInfo = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await ApiService.getAppInfo();
      setInfo(data);
    } catch (err: any) {
      setInfo(null);
      setLoadError(err?.message || 'No se pudo consultar el paquete en el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
    // Generar QR como SVG → data URL (no depende de <canvas>; compatible con CSP img-src data:)
    QRCode.toString(absoluteDownloadUrl, {
      type: 'svg',
      width: 180,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((svg) => setQrDataUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`))
      .catch(() => setQrDataUrl(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [absoluteDownloadUrl]);

  const handleCopyHash = async () => {
    if (!info?.sha256) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(info.sha256);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = info.sha256;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadHref = info?.download_url || FALLBACK_APK_URL;
  const versionLabel = info ? `v${info.version_name}` : 'v1.2.0';

  return (
    <section
      id="descarga-app"
      aria-labelledby="descarga-app-title"
      className="mt-8 scroll-mt-24"
    >
      <div className="relative overflow-hidden rounded-3xl border border-emerald-900/50 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 text-white shadow-xl">
        {/* Glow decorativo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-8 p-6 sm:p-8">
          {/* ─── Columna izquierda: titular + CTA ─── */}
          <div className="lg:col-span-3 flex flex-col justify-center space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                <Smartphone className="w-3.5 h-3.5" /> App Oficial Android
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full">
                {versionLabel} · APK
              </span>
              {info?.signed && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5" /> Firma RSA-4096
                </span>
              )}
            </div>

            <div>
              <h2
                id="descarga-app-title"
                className="text-2xl sm:text-3xl font-black tracking-tight text-white"
              >
                Descarga la App para tu móvil
              </h2>
              <p className="mt-2 text-sm sm:text-[15px] text-slate-300 leading-relaxed max-w-xl">
                Lleva Actas Digitales al bolsillo: captura acústica de alta fidelidad,
                subida resiliente en segundo plano con <span className="text-emerald-300 font-semibold">WorkManager</span>,
                reanudación automática ante cortes de red y cifrado TLS 1.3 de extremo a extremo.
                El paquete se sirve directamente desde este servidor, sin tiendas ni terceros.
              </p>
            </div>

            {/* CTA principal + estado del servidor */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={downloadHref}
                download="ActasDigitales.apk"
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm sm:text-base tracking-tight shadow-[0_10px_35px_-10px_rgba(16,185,129,0.55)] hover:shadow-[0_14px_40px_-8px_rgba(16,185,129,0.65)] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-400/40"
                aria-label="Descargar el APK de Actas Digitales para Android"
              >
                <Download className="w-5 h-5 transition-transform duration-200 group-hover:translate-y-0.5" />
                <span>Descargar para Android</span>
                <span className="text-[11px] font-mono font-bold bg-slate-950/15 px-2 py-0.5 rounded-md">
                  {info?.size_formatted || 'APK'}
                </span>
              </a>

              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verificando paquete…
                </span>
              ) : info ? (
                <span className="inline-flex items-center gap-2 text-xs text-emerald-300 font-mono">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                  </span>
                  Servidor listo · APK verificado
                </span>
              ) : (
                <button
                  onClick={loadInfo}
                  className="inline-flex items-center gap-2 text-xs text-amber-300 hover:text-amber-200 font-mono transition"
                  title="Reintentar consulta al servidor"
                >
                  <AlertTriangle className="w-4 h-4" /> {loadError || 'Sin conexión con el servidor'} · Reintentar
                </button>
              )}
            </div>

            {/* Metadatos del paquete */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] font-mono text-slate-400">
              <span>Paquete: <span className="text-slate-200">{info?.package || 'com.actasdigitales.app'}</span></span>
              <span>Android: <span className="text-slate-200">{info?.requires_android || '7.0+ (API 24)'}</span></span>
              <span>ABI: <span className="text-slate-200">{info?.abi || 'Universal'}</span></span>
            </div>

            {/* SHA-256 de custodia */}
            {info?.sha256 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SHA-256 de Custodia
                  </span>
                  <button
                    onClick={handleCopyHash}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2 py-1 transition"
                    aria-label="Copiar SHA-256 del APK"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <code className="block text-[10px] sm:text-[11px] text-emerald-200/90 break-all leading-relaxed select-all">
                  {info.sha256}
                </code>
                <p className="mt-1.5 text-[10px] text-slate-500 font-mono">
                  Verifica tras descargar: <span className="text-slate-300">sha256sum ActasDigitales.apk</span>
                </p>
              </div>
            )}

            {/* Pasos de instalación (plegable en móvil) */}
            <div>
              <button
                onClick={() => setShowSteps((v) => !v)}
                className="text-[11px] font-mono uppercase tracking-widest text-slate-400 hover:text-white flex items-center gap-1.5 transition"
                aria-expanded={showSteps}
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showSteps ? 'rotate-90' : ''}`} />
                Cómo instalar en Android
              </button>
              {showSteps && (
                <ol className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  {[
                    'Descarga el APK con el botón verde o escanea el QR.',
                    'Abre el archivo desde las notificaciones o la carpeta Descargas.',
                    'Activa "Instalar apps desconocidas" para tu navegador si Android lo pide.',
                    'Confirma la instalación. La app nunca pide cuentas ni datos externos.',
                  ].map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-300 font-mono text-[10px] font-bold flex items-center justify-center border border-emerald-500/30">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* ─── Columna derecha: QR + nota iOS ─── */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center gap-4">
            <div className="w-full max-w-xs bg-white text-slate-900 rounded-3xl p-5 shadow-2xl border border-emerald-100 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-700">
                <ScanLine className="w-4 h-4" /> Escanea y descarga
              </div>
              <div className="mt-3 p-2 rounded-2xl bg-white border-2 border-slate-100 shadow-inner">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    width={180}
                    height={180}
                    alt="Código QR con la URL de descarga de Actas Digitales para Android"
                    className="w-[180px] h-[180px]"
                  />
                ) : (
                  <div className="w-[180px] h-[180px] flex items-center justify-center bg-slate-50 rounded-xl text-slate-300">
                    <FileArchive className="w-10 h-10" />
                  </div>
                )}
              </div>
              <p className="mt-3 text-[11px] text-slate-500 leading-snug">
                Apunta con la cámara de tu Android a este código para abrir la descarga al instante.
              </p>
              <code className="mt-2 text-[9px] text-slate-400 break-all bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-full select-all">
                {absoluteDownloadUrl}
              </code>
            </div>

            {/* Nota iOS / PWA */}
            <div className="w-full max-w-xs rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 flex items-start gap-3">
              <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                <Apple className="w-4 h-4" />
              </div>
              <p className="text-[10.5px] text-slate-400 leading-snug">
                <span className="text-slate-200 font-semibold flex items-center gap-1">
                  ¿iPhone o iPad? <Share className="w-3 h-3 inline" />
                </span>
                iOS no instala APK: abre esta página en Safari → <em>Compartir</em> →
                <em> Añadir a pantalla de inicio</em> y úsala como app.
              </p>
            </div>

            <p className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
              <Wifi className="w-3.5 h-3.5" /> Descarga desde la misma red/VPN del servidor
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
