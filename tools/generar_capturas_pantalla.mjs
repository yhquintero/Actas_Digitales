import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '../web/node_modules/@resvg/resvg-js/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAPTURAS_DIR = path.join(__dirname, '..', 'docs', 'assets', 'capturas');
const ASSETS_DIR = path.join(__dirname, '..', 'docs', 'assets');

fs.mkdirSync(CAPTURAS_DIR, { recursive: true });

async function savePng(svgString, outputPath, width = 1200) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: width },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'sans-serif'
    }
  });
  const pngData = resvg.render();
  fs.writeFileSync(outputPath, pngData.asPng());
  console.log(`✓ Generada captura: ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
}

// 1. Galería Panorámica General (1600 x 900)
const galeriaSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090D16" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#4F46E5" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="shadow" x="-8%" y="-8%" width="116%" height="116%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <rect width="1600" height="900" fill="url(#bgGrad)" />

  <!-- Background decorative glows -->
  <circle cx="200" cy="180" r="180" fill="#4F46E5" opacity="0.15" filter="blur(80px)" />
  <circle cx="1400" cy="240" r="220" fill="#10B981" opacity="0.12" filter="blur(90px)" />

  <!-- Top Title Banner -->
  <g transform="translate(100, 45)">
    <rect width="1400" height="84" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
    <text x="700" y="36" font-family="sans-serif" font-size="26" font-weight="900" fill="#FFFFFF" text-anchor="middle">Actas Digitales · Ecosistema Integral de Voz a Texto Oficial RAE</text>
    
    <!-- 4 Pillars Ribbon -->
    <rect x="220" y="48" width="960" height="26" rx="13" fill="rgba(99, 102, 241, 0.15)" stroke="#6366F1" stroke-width="1" />
    <text x="700" y="65" font-family="sans-serif" font-size="12" font-weight="bold" fill="#A5B4FC" text-anchor="middle">
      LOS 4 PILARES: 01 Captura Concurrente  ·  02 Transcribe Adaptativo  ·  03 Consolida Inteligente  ·  04 Formaliza con RAE
    </text>
  </g>

  <!-- Left: Web App Window Mockup -->
  <g transform="translate(80, 160)" filter="url(#shadow)">
    <!-- Window Frame -->
    <rect width="980" height="680" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
    <!-- Window Bar -->
    <rect width="980" height="46" rx="18" fill="#F8FAFC" />
    <circle cx="26" cy="23" r="6" fill="#EF4444" />
    <circle cx="46" cy="23" r="6" fill="#F59E0B" />
    <circle cx="66" cy="23" r="6" fill="#10B981" />
    <!-- URL Pill -->
    <rect x="110" y="11" width="520" height="24" rx="8" fill="#FFFFFF" stroke="#E2E8F0" />
    <text x="130" y="27" font-family="monospace" font-size="11" fill="#4338CA" font-weight="bold">🔒 https://actasdigitales.local · TLS 1.3 (RSA-4096 / SHA-256)</text>
    <rect x="820" y="11" width="135" height="24" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
    <text x="887" y="27" font-family="sans-serif" font-size="10" font-weight="bold" fill="#065F46" text-anchor="middle">HSTS &amp; CSP Activo</text>

    <!-- Top App Navigation -->
    <rect x="24" y="62" width="932" height="54" rx="12" fill="url(#indigoGrad)" />
    <text x="48" y="96" font-family="sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF">🎙️ Actas Digitales</text>
    <text x="210" y="95" font-family="sans-serif" font-size="11" fill="#C7D2FE">|  Transcripción &amp; Consolidación Oficial</text>

    <rect x="680" y="74" width="125" height="30" rx="8" fill="rgba(255,255,255,0.2)" />
    <text x="742" y="93" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">🛡️ Centro Seguridad</text>

    <rect x="815" y="74" width="125" height="30" rx="8" fill="#10B981" />
    <text x="877" y="93" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">⬇️ Descargar APK</text>

    <!-- Side-by-Side Analysis Cards -->
    <!-- Card 1: Crudo -->
    <g transform="translate(24, 130)">
      <rect width="456" height="260" rx="14" fill="#FFF1F2" stroke="#FECDD3" />
      <rect x="18" y="14" width="220" height="26" rx="6" fill="#FFE4E6" />
      <text x="28" y="31" font-family="sans-serif" font-size="11" font-weight="bold" fill="#9F1239">Transcripción Cruda (STT)</text>
      <text x="430" y="31" font-family="sans-serif" font-size="10" font-weight="bold" fill="#BE123C" text-anchor="end">41 palabras</text>

      <rect x="18" y="52" width="420" height="140" rx="8" fill="#FFFFFF" stroke="#FFE4E6" />
      <text x="30" y="78" font-family="monospace" font-size="11.5" fill="#881337">
        <tspan x="30" dy="0">"bueno pues este... yo-yo creo que</tspan>
        <tspan x="30" dy="22">vamos a a a revisar la sesion del</tspan>
        <tspan x="30" dy="22">dia de hoy. ¿habra alguna duda o</tspan>
        <tspan x="30" dy="22">pregunta sobre el presupuesto?"</tspan>
      </text>

      <!-- Badge Tags -->
      <rect x="18" y="206" width="130" height="24" rx="6" fill="#FEE2E2" />
      <text x="26" y="222" font-family="sans-serif" font-size="10" font-weight="bold" fill="#991B1B">⚠️ 4 Muletillas / Tartamudeo</text>
      <rect x="156" y="206" width="140" height="24" rx="6" fill="#FEE2E2" />
      <text x="164" y="222" font-family="sans-serif" font-size="10" font-weight="bold" fill="#991B1B">⚠️ 6 Fallos Ortotipográficos</text>
    </g>

    <!-- Card 2: Consolidado Oficial -->
    <g transform="translate(500, 130)">
      <rect width="456" height="260" rx="14" fill="#ECFDF5" stroke="#A7F3D0" />
      <rect x="18" y="14" width="240" height="26" rx="6" fill="#D1FAE5" />
      <text x="28" y="31" font-family="sans-serif" font-size="11" font-weight="bold" fill="#065F46">Acta Oficial Consolidada RAE</text>
      <text x="430" y="31" font-family="sans-serif" font-size="10" font-weight="bold" fill="#047857" text-anchor="end">28 palabras</text>

      <rect x="18" y="52" width="420" height="140" rx="8" fill="#FFFFFF" stroke="#A7F3D0" />
      <text x="30" y="78" font-family="sans-serif" font-size="12" font-weight="500" fill="#047857">
        <tspan x="30" dy="0">"Damos inicio a la sesión del día de hoy.</tspan>
        <tspan x="30" dy="22">Yo creo que vamos a revisar el presupuesto</tspan>
        <tspan x="30" dy="22">técnico. ¿Habrá alguna duda o pregunta</tspan>
        <tspan x="30" dy="22">sobre el dictamen presentado?"</tspan>
      </text>

      <!-- Badge Tags -->
      <rect x="18" y="206" width="160" height="24" rx="6" fill="#DCFCE7" />
      <text x="26" y="222" font-family="sans-serif" font-size="10" font-weight="bold" fill="#166534">✓ 100% Reglas RAE Aplicadas</text>
      <rect x="186" y="206" width="140" height="24" rx="6" fill="#DCFCE7" />
      <text x="194" y="222" font-family="sans-serif" font-size="10" font-weight="bold" fill="#166534">✓ Tildes y Signos ¿ ¡</text>
    </g>

    <!-- Bottom Cryptographic Custody & Pipeline -->
    <g transform="translate(24, 410)">
      <rect width="932" height="245" rx="14" fill="#F8FAFC" stroke="#E2E8F0" />

      <!-- Custody Fingerprint Bar -->
      <rect x="20" y="18" width="892" height="50" rx="8" fill="#0F172A" />
      <text x="38" y="48" font-family="monospace" font-size="11.5" fill="#38BDF8">
        SHA-256 Custodia: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
      </text>
      <rect x="800" y="28" width="100" height="30" rx="6" fill="#10B981" />
      <text x="850" y="47" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">✓ VERIFICADO</text>

      <!-- Metrics Row -->
      <g transform="translate(20, 85)">
        <rect width="210" height="65" rx="8" fill="#FFFFFF" stroke="#E2E8F0" />
        <text x="16" y="28" font-family="sans-serif" font-size="10" fill="#64748B">Tiempo de Audio</text>
        <text x="16" y="52" font-family="monospace" font-size="18" font-weight="bold" fill="#1E293B">02:45 min</text>

        <rect x="228" width="210" height="65" rx="8" fill="#FFFFFF" stroke="#E2E8F0" />
        <text x="244" y="28" font-family="sans-serif" font-size="10" fill="#64748B">Tasa de Muestreo &amp; Bitrate</text>
        <text x="244" y="52" font-family="sans-serif" font-size="16" font-weight="bold" fill="#4F46E5">128 kbps · AAC</text>

        <rect x="456" width="210" height="65" rx="8" fill="#FFFFFF" stroke="#E2E8F0" />
        <text x="472" y="28" font-family="sans-serif" font-size="10" fill="#64748B">Velocidad de Lectura</text>
        <text x="472" y="52" font-family="sans-serif" font-size="16" font-weight="bold" fill="#059669">135 ppm · Óptimo</text>

        <rect x="684" width="208" height="65" rx="8" fill="#FFFFFF" stroke="#E2E8F0" />
        <text x="700" y="28" font-family="sans-serif" font-size="10" fill="#64748B">Cifrado de Sesión</text>
        <text x="700" y="52" font-family="sans-serif" font-size="15" font-weight="bold" fill="#3B82F6">TLS 1.3 / RSA-4096</text>
      </g>

      <!-- 4 Pillars Interactive Indicator -->
      <g transform="translate(20, 168)">
        <rect width="892" height="62" rx="10" fill="#EEF2FF" stroke="#C7D2FE" />
        <text x="24" y="26" font-family="sans-serif" font-size="11" font-weight="bold" fill="#3730A3">FLUJO DE PROCESAMIENTO ACTIVO:</text>
        <text x="24" y="47" font-family="sans-serif" font-size="11" fill="#4338CA">
          ✓ Ingesta y Hash SHA-256  ➔  ✓ VAD Silencios + STT Español  ➔  ✓ Desduplicación y Muletillas  ➔  ✓ Ortotipografía Oficial RAE
        </text>
        <rect x="750" y="16" width="125" height="30" rx="8" fill="#4F46E5" />
        <text x="812" y="35" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Exportar PDF / DOCX</text>
      </g>
    </g>
  </g>

  <!-- Right: Native Android Mobile Mockup -->
  <g transform="translate(1130, 160)" filter="url(#shadow)">
    <!-- Phone Outer Body -->
    <rect width="380" height="680" rx="42" fill="#0F172A" stroke="#334155" stroke-width="6" />
    <!-- Dynamic Island / Speaker -->
    <rect x="140" y="18" width="100" height="18" rx="9" fill="#1E293B" />
    <circle cx="215" cy="27" r="4" fill="#3B82F6" opacity="0.6" />

    <!-- Screen Surface -->
    <rect x="16" y="46" width="348" height="618" rx="30" fill="#F8FAFC" />

    <!-- Mobile Top App Bar -->
    <rect x="16" y="46" width="348" height="60" rx="4" fill="#4F46E5" />
    <text x="36" y="82" font-family="sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF">Actas Digitales Móvil</text>
    <rect x="250" y="64" width="98" height="24" rx="12" fill="#312E81" />
    <text x="299" y="80" font-family="sans-serif" font-size="10" font-weight="bold" fill="#A5B4FC" text-anchor="middle">v1.2.0 · APK</text>

    <!-- Native Audio Recorder Card -->
    <g transform="translate(32, 120)">
      <rect width="316" height="230" rx="18" fill="#FFFFFF" stroke="#E2E8F0" />
      <text x="20" y="30" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0F172A">Grabadora Oficial de Juntas</text>
      <text x="20" y="48" font-family="sans-serif" font-size="10" fill="#64748B">AAC 128 kbps · WorkManager Asíncrono</text>

      <!-- Central Recording Button -->
      <circle cx="158" cy="115" r="42" fill="#E11D48" />
      <circle cx="158" cy="115" r="52" fill="none" stroke="#E11D48" stroke-width="3" opacity="0.4" />
      <rect x="145" y="102" width="26" height="26" rx="4" fill="#FFFFFF" />

      <!-- Acoustic VU Meter Bars -->
      <g transform="translate(78, 175)">
        <rect x="0" y="10" width="4" height="20" rx="2" fill="#E11D48" />
        <rect x="8" y="4" width="4" height="26" rx="2" fill="#E11D48" />
        <rect x="16" y="0" width="4" height="30" rx="2" fill="#E11D48" />
        <rect x="24" y="6" width="4" height="24" rx="2" fill="#E11D48" />
        <rect x="32" y="12" width="4" height="18" rx="2" fill="#E11D48" />
        <rect x="40" y="2" width="4" height="28" rx="2" fill="#E11D48" />
        <rect x="48" y="0" width="4" height="30" rx="2" fill="#E11D48" />
        <rect x="56" y="8" width="4" height="22" rx="2" fill="#E11D48" />
        <rect x="64" y="14" width="4" height="16" rx="2" fill="#E11D48" />
        <rect x="72" y="6" width="4" height="24" rx="2" fill="#E11D48" />
        <rect x="80" y="0" width="4" height="30" rx="2" fill="#E11D48" />
        <rect x="88" y="4" width="4" height="26" rx="2" fill="#E11D48" />
        <rect x="96" y="8" width="4" height="22" rx="2" fill="#E11D48" />
        <rect x="104" y="12" width="4" height="18" rx="2" fill="#E11D48" />
        <rect x="112" y="2" width="4" height="28" rx="2" fill="#E11D48" />
        <rect x="120" y="0" width="4" height="30" rx="2" fill="#E11D48" />
        <rect x="128" y="8" width="4" height="22" rx="2" fill="#E11D48" />
        <rect x="136" y="14" width="4" height="16" rx="2" fill="#E11D48" />
        <rect x="144" y="6" width="4" height="24" rx="2" fill="#E11D48" />
        <rect x="152" y="10" width="4" height="20" rx="2" fill="#E11D48" />
      </g>
      <text x="158" y="220" font-family="monospace" font-size="12" font-weight="bold" fill="#E11D48" text-anchor="middle">GRABANDO: 02:45.3</text>
    </g>

    <!-- Mobile Security Switch Card -->
    <g transform="translate(32, 365)">
      <rect width="316" height="95" rx="14" fill="#FFFFFF" stroke="#E2E8F0" />
      <text x="18" y="28" font-family="sans-serif" font-size="11.5" font-weight="bold" fill="#1E293B">Seguridad TLS 1.3 &amp; Certificado</text>
      <text x="18" y="46" font-family="sans-serif" font-size="9.5" fill="#64748B">Admite CA raíz autofirmada de desarrollo</text>
      
      <!-- Switch Toggle On -->
      <rect x="18" y="58" width="280" height="24" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
      <text x="30" y="74" font-family="sans-serif" font-size="10" font-weight="bold" fill="#065F46">✓ Conexión HTTPS verificada con RSA-4096</text>
    </g>

    <!-- Mobile Recent Result Card -->
    <g transform="translate(32, 475)">
      <rect width="316" height="170" rx="14" fill="#ECFDF5" stroke="#A7F3D0" />
      <text x="18" y="26" font-family="sans-serif" font-size="11.5" font-weight="bold" fill="#065F46">✓ Última Acta Procesada</text>
      
      <rect x="18" y="38" width="280" height="60" rx="8" fill="#FFFFFF" stroke="#A7F3D0" />
      <text x="26" y="58" font-family="sans-serif" font-size="10" fill="#047857">
        <tspan x="26" dy="0">"Damos inicio a la sesión del día</tspan>
        <tspan x="26" dy="16">de hoy. Aprobados los acuerdos por</tspan>
        <tspan x="26" dy="16">unanimidad de la asamblea general."</tspan>
      </text>

      <rect x="18" y="110" width="135" height="42" rx="8" fill="#4F46E5" />
      <text x="85" y="136" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Copiar Texto</text>

      <rect x="163" y="110" width="135" height="42" rx="8" fill="#FFFFFF" stroke="#CBD5E1" />
      <text x="230" y="136" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1E293B" text-anchor="middle">Compartir</text>
    </g>
  </g>
</svg>`;

// 2. Grabación de Audio con VU-Meter y Custodia SHA-256
const grabacionSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="100%" height="100%">
  <defs>
    <linearGradient id="recGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F8FAFC" />
    </linearGradient>
  </defs>

  <rect width="1000" height="650" rx="20" fill="url(#recGrad)" stroke="#E2E8F0" stroke-width="2" />
  
  <!-- Window Header -->
  <rect width="1000" height="48" rx="20" fill="#F1F5F9" />
  <circle cx="24" cy="24" r="6" fill="#EF4444" /><circle cx="44" cy="24" r="6" fill="#F59E0B" /><circle cx="64" cy="24" r="6" fill="#10B981" />
  <text x="96" y="29" font-family="sans-serif" font-size="12" fill="#4338CA" font-weight="bold">🔒 Grabación de Audio en Directo · Web Audio API / MediaRecorder (128 kbps)</text>

  <!-- Big Recording Card -->
  <g transform="translate(100, 80)">
    <rect width="800" height="520" rx="16" fill="#FFFFFF" stroke="#E2E8F0" />

    <!-- Pulse Mic Indicator -->
    <circle cx="400" cy="140" r="68" fill="#E11D48" />
    <circle cx="400" cy="140" r="88" fill="none" stroke="#E11D48" stroke-width="3" opacity="0.3" />
    <circle cx="400" cy="140" r="105" fill="none" stroke="#E11D48" stroke-width="1.5" opacity="0.15" />
    <rect x="382" y="122" width="36" height="36" rx="6" fill="#FFFFFF" />

    <!-- Timer & Status -->
    <text x="400" y="270" font-family="monospace" font-size="38" font-weight="bold" fill="#0F172A" text-anchor="middle">02:45.3</text>
    <text x="400" y="305" font-family="sans-serif" font-size="15" font-weight="bold" fill="#E11D48" text-anchor="middle">● Grabando sesión oficial en directo... Habla claramente en español</text>
    <text x="400" y="330" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">Muestreo nativo 16 kHz · Bitrate objetivo 128 kbps · Cancelación acústica de eco activa</text>

    <!-- Waveform Visualizer Bars -->
    <g transform="translate(150, 360)">
      <rect x="0" y="25" width="8" height="50" rx="4" fill="#6366F1" />
      <rect x="18" y="10" width="8" height="80" rx="4" fill="#6366F1" />
      <rect x="36" y="30" width="8" height="40" rx="4" fill="#6366F1" />
      <rect x="54" y="5" width="8" height="90" rx="4" fill="#6366F1" />
      <rect x="72" y="15" width="8" height="70" rx="4" fill="#6366F1" />
      <rect x="90" y="0" width="8" height="100" rx="4" fill="#4F46E5" />
      <rect x="108" y="20" width="8" height="60" rx="4" fill="#4F46E5" />
      <rect x="126" y="8" width="8" height="84" rx="4" fill="#4F46E5" />
      <rect x="144" y="2" width="8" height="96" rx="4" fill="#4F46E5" />
      <rect x="162" y="18" width="8" height="64" rx="4" fill="#4F46E5" />
      <rect x="180" y="12" width="8" height="76" rx="4" fill="#4F46E5" />
      <rect x="198" y="28" width="8" height="44" rx="4" fill="#6366F1" />
      <rect x="216" y="5" width="8" height="90" rx="4" fill="#6366F1" />
      <rect x="234" y="0" width="8" height="100" rx="4" fill="#6366F1" />
      <rect x="252" y="14" width="8" height="72" rx="4" fill="#6366F1" />
      <rect x="270" y="20" width="8" height="60" rx="4" fill="#6366F1" />
      <rect x="288" y="2" width="8" height="96" rx="4" fill="#4F46E5" />
      <rect x="306" y="10" width="8" height="80" rx="4" fill="#4F46E5" />
      <rect x="324" y="25" width="8" height="50" rx="4" fill="#4F46E5" />
      <rect x="342" y="8" width="8" height="84" rx="4" fill="#4F46E5" />
      <rect x="360" y="0" width="8" height="100" rx="4" fill="#4F46E5" />
      <rect x="378" y="15" width="8" height="70" rx="4" fill="#6366F1" />
      <rect x="396" y="30" width="8" height="40" rx="4" fill="#6366F1" />
      <rect x="414" y="10" width="8" height="80" rx="4" fill="#6366F1" />
      <rect x="432" y="20" width="8" height="60" rx="4" fill="#6366F1" />
      <rect x="450" y="5" width="8" height="90" rx="4" fill="#6366F1" />
      <rect x="468" y="18" width="8" height="64" rx="4" fill="#6366F1" />
      <rect x="486" y="25" width="8" height="50" rx="4" fill="#6366F1" />
    </g>

    <!-- Custody Hash Live & Actions -->
    <rect x="60" y="475" width="680" height="32" rx="8" fill="#F1F5F9" />
    <text x="400" y="496" font-family="monospace" font-size="11" fill="#334155" text-anchor="middle">
      SHA-256 Custodia en Memoria: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d6...
    </text>
  </g>
</svg>`;

// 3. Pipeline de Progreso (Los 4 Pilares Fundamentales)
const pipelineSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="100%" height="100%">
  <rect width="1000" height="650" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
  <rect width="1000" height="48" rx="20" fill="#F8FAFC" />
  <circle cx="24" cy="24" r="6" fill="#EF4444" /><circle cx="44" cy="24" r="6" fill="#F59E0B" /><circle cx="64" cy="24" r="6" fill="#10B981" />
  <text x="96" y="29" font-family="sans-serif" font-size="12" fill="#4338CA" font-weight="bold">🔒 Flujo Integral de los 4 Pilares · Procesamiento Asíncrono en Tiempo Real</text>

  <!-- Job Info -->
  <text x="50" y="90" font-family="sans-serif" font-size="18" font-weight="bold" fill="#0F172A">Junta_Directiva_Sesion_Ordinaria.m4a (14.2 MB)</text>
  <text x="950" y="90" font-family="monospace" font-size="26" font-weight="bold" fill="#4F46E5" text-anchor="end">88%</text>

  <!-- Progress Bar -->
  <rect x="50" y="110" width="900" height="14" rx="7" fill="#E2E8F0" />
  <rect x="50" y="110" width="792" height="14" rx="7" fill="#4F46E5" />

  <!-- 4 Pillars Cards Grid -->
  <g transform="translate(50, 150)">
    <!-- Pilar 1 -->
    <rect width="210" height="260" rx="14" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="2" />
    <circle cx="105" cy="45" r="24" fill="#10B981" />
    <text x="105" y="53" font-size="20" fill="#FFFFFF" text-anchor="middle">✓</text>
    <text x="105" y="95" font-family="sans-serif" font-size="13" font-weight="bold" fill="#065F46" text-anchor="middle">01. CAPTURA</text>
    <text x="105" y="125" font-family="sans-serif" font-size="11" fill="#047857" text-anchor="middle">Validación MIME segura</text>
    <text x="105" y="145" font-family="sans-serif" font-size="11" fill="#047857" text-anchor="middle">Encolado asíncrono</text>
    <text x="105" y="165" font-family="sans-serif" font-size="11" fill="#047857" text-anchor="middle">Hash SHA-256 generado</text>
    <rect x="25" y="210" width="160" height="26" rx="6" fill="#D1FAE5" />
    <text x="105" y="227" font-family="sans-serif" font-size="10" font-weight="bold" fill="#065F46" text-anchor="middle">COMPLETADO · 0.2s</text>

    <!-- Pilar 2 -->
    <g transform="translate(230, 0)">
      <rect width="210" height="260" rx="14" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="2" />
      <circle cx="105" cy="45" r="24" fill="#10B981" />
      <text x="105" y="53" font-size="20" fill="#FFFFFF" text-anchor="middle">✓</text>
      <text x="105" y="95" font-family="sans-serif" font-size="13" font-weight="bold" fill="#065F46" text-anchor="middle">02. TRANSCRIBE</text>
      <text x="105" y="125" font-family="sans-serif" font-size="11" fill="#047857" text-anchor="middle">Detección VAD silencios</text>
      <text x="105" y="145" font-family="sans-serif" font-size="11" fill="#047857" text-anchor="middle">Segmentación acústica</text>
      <text x="105" y="165" font-family="sans-serif" font-size="11" fill="#047857" text-anchor="middle">Whisper STT en Español</text>
      <rect x="25" y="210" width="160" height="26" rx="6" fill="#D1FAE5" />
      <text x="105" y="227" font-family="sans-serif" font-size="10" font-weight="bold" fill="#065F46" text-anchor="middle">COMPLETADO · 2.1s</text>
    </g>

    <!-- Pilar 3 -->
    <g transform="translate(460, 0)">
      <rect width="210" height="260" rx="14" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="2" />
      <circle cx="105" cy="45" r="24" fill="#10B981" />
      <text x="105" y="53" font-size="20" fill="#FFFFFF" text-anchor="middle">✓</text>
      <text x="105" y="95" font-family="sans-serif" font-size="13" font-weight="bold" fill="#065F46" text-anchor="middle">03. CONSOLIDA</text>
      <text x="105" y="125" font-family="sans-serif" font-size="11" fill="#047857" text-anchor="middle">Fusión de fragmentos</text>
      <text x="105" y="145" font-family="sans-serif" font-size="11" fill="#047857" text-anchor="middle">Desduplicación oral</text>
      <text x="105" y="165" font-family="sans-serif" font-size="11" fill="#047857" text-anchor="middle">Supresión de muletillas</text>
      <rect x="25" y="210" width="160" height="26" rx="6" fill="#D1FAE5" />
      <text x="105" y="227" font-family="sans-serif" font-size="10" font-weight="bold" fill="#065F46" text-anchor="middle">COMPLETADO · 0.4s</text>
    </g>

    <!-- Pilar 4 -->
    <g transform="translate(690, 0)">
      <rect width="210" height="260" rx="14" fill="#EEF2FF" stroke="#6366F1" stroke-width="2" />
      <circle cx="105" cy="45" r="24" fill="#4F46E5" />
      <text x="105" y="53" font-size="20" fill="#FFFFFF" text-anchor="middle">⚙️</text>
      <text x="105" y="95" font-family="sans-serif" font-size="13" font-weight="bold" fill="#312E81" text-anchor="middle">04. FORMALIZA</text>
      <text x="105" y="125" font-family="sans-serif" font-size="11" fill="#4338CA" text-anchor="middle">Ortotipografía RAE</text>
      <text x="105" y="145" font-family="sans-serif" font-size="11" fill="#4338CA" text-anchor="middle">Concordancia verbal</text>
      <text x="105" y="165" font-family="sans-serif" font-size="11" fill="#4338CA" text-anchor="middle">Sellado y firma oficial</text>
      <rect x="25" y="210" width="160" height="26" rx="6" fill="#6366F1" />
      <text x="105" y="227" font-family="sans-serif" font-size="10" font-weight="bold" fill="#FFFFFF" text-anchor="middle">PROCESANDO · 88%</text>
    </g>
  </g>

  <!-- Live SSE Telemetry Box -->
  <rect x="50" y="440" width="900" height="150" rx="14" fill="#0F172A" />
  <text x="75" y="475" font-family="sans-serif" font-size="13" font-weight="bold" fill="#38BDF8">Conexión en Tiempo Real vía Server-Sent Events (SSE)</text>
  <text x="75" y="505" font-family="monospace" font-size="11.5" fill="#E2E8F0">
    [10:45:01] INFO  - Chunk 04 recibido (SHA-256: 7f83b165...): Audio resampleado a 16000 Hz
  </text>
  <text x="75" y="525" font-family="monospace" font-size="11.5" fill="#E2E8F0">
    [10:45:02] INFO  - Pilar 03 completado: 4 muletillas suprimidas ("bueno pues este...", "yo-yo")
  </text>
  <text x="75" y="545" font-family="monospace" font-size="11.5" fill="#4ADE80">
    [10:45:03] INFO  - Pilar 04 ejecutando: Aplicando 7 reglas gramaticales y acentuación diacrítica RAE...
  </text>
</svg>`;

// 4. Comparativa Antes / Después (Ultra Profesional)
const comparativaSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="100%" height="100%">
  <rect width="1000" height="650" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
  <rect width="1000" height="48" rx="20" fill="#F8FAFC" />
  <circle cx="24" cy="24" r="6" fill="#EF4444" /><circle cx="44" cy="24" r="6" fill="#F59E0B" /><circle cx="64" cy="24" r="6" fill="#10B981" />
  <text x="96" y="29" font-family="sans-serif" font-size="12" fill="#4338CA" font-weight="bold">🔒 Comparativa de Calidad Lingüística: Transcripción Cruda vs Acta Consolidada</text>

  <g transform="translate(40, 75)">
    <!-- Left Box: Raw Transcript -->
    <rect width="440" height="520" rx="16" fill="#FFF1F2" stroke="#FECDD3" />
    <rect x="20" y="20" width="240" height="30" rx="6" fill="#FFE4E6" />
    <text x="32" y="40" font-family="sans-serif" font-size="12" font-weight="bold" fill="#9F1239">ANTES · TRANSCRIPCIÓN CRUDA</text>
    <text x="420" y="40" font-family="sans-serif" font-size="11" font-weight="bold" fill="#BE123C" text-anchor="end">41 Palabras</text>

    <!-- Raw Text Area -->
    <rect x="20" y="65" width="400" height="310" rx="10" fill="#FFFFFF" stroke="#FFE4E6" />
    <text x="35" y="100" font-family="monospace" font-size="12.5" fill="#881337">
      <tspan x="35" dy="0">"bueno pues este... damos inicio</tspan>
      <tspan x="35" dy="28">a la sesion del dia de hoy.</tspan>
      <tspan x="35" dy="28">yo-yo creo que el presupuesto</tspan>
      <tspan x="35" dy="28">tendra que ser revisado por la</tspan>
      <tspan x="35" dy="28">comision tecnica.</tspan>
      <tspan x="35" dy="38">¿habra alguna duda o pregunta?</tspan>
      <tspan x="35" dy="38">ehhh tipo que todos estamos de</tspan>
      <tspan x="35" dy="28">acuerdo con el parrafo ultimo."</tspan>
    </text>

    <!-- Problem Badges -->
    <rect x="20" y="390" width="400" height="110" rx="10" fill="#FEE2E2" />
    <text x="35" y="415" font-family="sans-serif" font-size="12" font-weight="bold" fill="#991B1B">Deficiencias del Habla Oral Detectadas:</text>
    <text x="35" y="440" font-family="sans-serif" font-size="11" fill="#7F1D1D">• 4 muletillas y vacilaciones orales ("bueno pues este...", "ehhh tipo")</text>
    <text x="35" y="460" font-family="sans-serif" font-size="11" fill="#7F1D1D">• 1 corte por tartamudeo o duplicación ("yo-yo")</text>
    <text x="35" y="480" font-family="sans-serif" font-size="11" fill="#7F1D1D">• 5 faltas de tildes ("sesion", "dia", "tendra", "comision", "parrafo")</text>
  </g>

  <g transform="translate(520, 75)">
    <!-- Right Box: Consolidated Minutes -->
    <rect width="440" height="520" rx="16" fill="#ECFDF5" stroke="#A7F3D0" />
    <rect x="20" y="20" width="240" height="30" rx="6" fill="#D1FAE5" />
    <text x="32" y="40" font-family="sans-serif" font-size="12" font-weight="bold" fill="#065F46">DESPUÉS · ACTA CONSOLIDADA</text>
    <text x="420" y="40" font-family="sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="end">28 Palabras (-31%)</text>

    <!-- Consolidated Text Area -->
    <rect x="20" y="65" width="400" height="310" rx="10" fill="#FFFFFF" stroke="#A7F3D0" />
    <text x="35" y="100" font-family="sans-serif" font-size="13" font-weight="500" fill="#047857">
      <tspan x="35" dy="0">"Damos inicio a la sesión del día</tspan>
      <tspan x="35" dy="28">de hoy. Yo creo que el presupuesto</tspan>
      <tspan x="35" dy="28">tendrá que ser revisado por la</tspan>
      <tspan x="35" dy="28">comisión técnica.</tspan>
      <tspan x="35" dy="38">¿Habrá alguna duda o pregunta?</tspan>
      <tspan x="35" dy="38">Todos estamos de acuerdo con</tspan>
      <tspan x="35" dy="28">el párrafo último."</tspan>
    </text>

    <!-- Success Badges -->
    <rect x="20" y="390" width="400" height="110" rx="10" fill="#DCFCE7" />
    <text x="35" y="415" font-family="sans-serif" font-size="12" font-weight="bold" fill="#166534">Garantía de Calidad RAE &amp; Custodia:</text>
    <text x="35" y="440" font-family="sans-serif" font-size="11" fill="#14532D">✓ Redacción institucional limpia y concisa</text>
    <text x="35" y="460" font-family="sans-serif" font-size="11" fill="#14532D">✓ Ortotipografía española oficial (tildes y signos ¿ ¡)</text>
    <text x="35" y="480" font-family="sans-serif" font-size="11" fill="#14532D">✓ Huella SHA-256 vinculada a la pista de audio original</text>
  </g>
</svg>`;

// 5. Acta Oficial RAE con Firma y Custodia
const actaOficialSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="100%" height="100%">
  <rect width="1000" height="650" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
  <rect width="1000" height="48" rx="20" fill="#F8FAFC" />
  <circle cx="24" cy="24" r="6" fill="#EF4444" /><circle cx="44" cy="24" r="6" fill="#F59E0B" /><circle cx="64" cy="24" r="6" fill="#10B981" />
  <text x="96" y="29" font-family="sans-serif" font-size="12" fill="#4338CA" font-weight="bold">🔒 Estructuración Automática de Acta Oficial con Acuerdos y Certificación Criptográfica</text>

  <g transform="translate(50, 75)">
    <rect width="900" height="530" rx="14" fill="#FFFFFF" stroke="#CBD5E1" />

    <!-- Institutional Header -->
    <text x="450" y="38" font-family="serif" font-size="18" font-weight="bold" fill="#0F172A" text-anchor="middle">ACTA DE SESIÓN ORDINARIA DE CONSEJO DIRECTIVO</text>
    <text x="450" y="60" font-family="sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Fecha: 10 de Noviembre de 2026 · Conexión Segura TLS 1.3 · Firma RSA-4096</text>
    <line x1="30" y1="78" x2="870" y2="78" stroke="#E2E8F0" stroke-width="1.5" />

    <!-- Section 1 -->
    <text x="30" y="105" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B">1. Quórum y Participantes Convocados:</text>
    <text x="30" y="128" font-family="sans-serif" font-size="11" fill="#475569">Presidente de Consejo, Directora Ejecutiva, Secretario General, Director Técnico y Auditor Interno.</text>

    <!-- Section 2 -->
    <text x="30" y="160" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B">2. Resumen de Deliberaciones:</text>
    <text x="30" y="183" font-family="sans-serif" font-size="11" fill="#475569">
      Damos inicio a la sesión del día de hoy. El consejo revisa las metas estratégicas del ejercicio,
      confirmando la solidez de las proyecciones y aprobando el dictamen presentado por la comisión.
    </text>

    <!-- Section 3: Acuerdos -->
    <text x="30" y="225" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B">3. Acuerdos y Resoluciones Aprobadas:</text>
    
    <rect x="30" y="238" width="840" height="34" rx="6" fill="#F1F5F9" />
    <text x="45" y="260" font-family="sans-serif" font-size="11" fill="#0F172A">
      <strong>ACUERDO-01:</strong> Aprobación por unanimidad del dictamen presupuestario del ejercicio fiscal 2026.
    </text>

    <rect x="30" y="280" width="840" height="34" rx="6" fill="#F1F5F9" />
    <text x="45" y="302" font-family="sans-serif" font-size="11" fill="#0F172A">
      <strong>ACUERDO-02:</strong> Publicación inmediata del acta oficial en el repositorio institucional con firma digital.
    </text>

    <!-- Digital Signature Block -->
    <rect x="30" y="330" width="840" height="90" rx="10" fill="#0F172A" />
    <text x="50" y="358" font-family="monospace" font-size="11" fill="#38BDF8">
      Firma Digital RSA-4096: dacf48646040bd6e14a27f6b4c2b38fc74974b08c909e2a...
    </text>
    <text x="50" y="380" font-family="monospace" font-size="11" fill="#94A3B8">
      Cadena SHA-256 Custodia: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
    </text>
    <text x="50" y="402" font-family="sans-serif" font-size="10.5" fill="#4ADE80">
      ✓ Certificado X.509 Válido · Autoridad Emisora: Actas Digitales Security Authority (ES)
    </text>

    <!-- Signatures Lines -->
    <line x1="30" y1="440" x2="870" y2="440" stroke="#E2E8F0" />
    <text x="220" y="480" font-family="sans-serif" font-size="11" fill="#1E293B" text-anchor="middle">_________________________________________</text>
    <text x="220" y="500" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1E293B" text-anchor="middle">D. Alejandro Ramos (Presidente de Consejo)</text>

    <text x="680" y="480" font-family="sans-serif" font-size="11" fill="#1E293B" text-anchor="middle">_________________________________________</text>
    <text x="680" y="500" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1E293B" text-anchor="middle">Dña. Elena Belmonte (Secretaria de Actas)</text>
  </g>
</svg>`;

// 6. Auditoría de Seguridad & Correcciones Lingüísticas
const auditoriaSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="100%" height="100%">
  <rect width="1000" height="650" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
  <rect width="1000" height="48" rx="20" fill="#F8FAFC" />
  <circle cx="24" cy="24" r="6" fill="#EF4444" /><circle cx="44" cy="24" r="6" fill="#F59E0B" /><circle cx="64" cy="24" r="6" fill="#10B981" />
  <text x="96" y="29" font-family="sans-serif" font-size="12" fill="#4338CA" font-weight="bold">🔒 Auditoría Integral: Correcciones Lingüísticas RAE y Blindaje Criptográfico</text>

  <g transform="translate(50, 75)">
    <!-- Header Metrics -->
    <rect width="900" height="65" rx="10" fill="#0F172A" />
    <text x="30" y="32" font-family="sans-serif" font-size="11" fill="#94A3B8">CORRECCIONES RAE</text>
    <text x="30" y="52" font-family="monospace" font-size="18" font-weight="bold" fill="#10B981">7 Aplicadas</text>

    <text x="240" y="32" font-family="sans-serif" font-size="11" fill="#94A3B8">MULETILLAS PURGADAS</text>
    <text x="240" y="52" font-family="monospace" font-size="18" font-weight="bold" fill="#38BDF8">4 Suprimidas</text>

    <text x="460" y="32" font-family="sans-serif" font-size="11" fill="#94A3B8">CLAVE RSA / TLS</text>
    <text x="460" y="52" font-family="monospace" font-size="18" font-weight="bold" fill="#A78BFA">RSA-4096 Bits</text>

    <text x="680" y="32" font-family="sans-serif" font-size="11" fill="#94A3B8">POLÍTICAS SEGURIDAD</text>
    <text x="680" y="52" font-family="monospace" font-size="18" font-weight="bold" fill="#FBBF24">HSTS + CSP Top 1</text>

    <!-- Table of Rules Applied -->
    <g transform="translate(0, 85)">
      <!-- Row 1 -->
      <rect width="900" height="54" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
      <rect x="15" y="15" width="100" height="24" rx="12" fill="#FEF3C7" />
      <text x="65" y="31" font-family="sans-serif" font-size="10" font-weight="bold" fill="#92400E" text-anchor="middle">MULETILLA</text>
      <text x="135" y="33" font-family="monospace" font-size="12" fill="#94A3B8" text-decoration="line-through">bueno pues este...</text>
      <text x="320" y="33" font-family="sans-serif" font-size="12" fill="#64748B">→</text>
      <text x="350" y="33" font-family="monospace" font-size="12" font-weight="bold" fill="#059669">(suprimido)</text>
      <text x="520" y="33" font-family="sans-serif" font-size="11.5" fill="#475569">Vacilación oral y muletilla eliminada para dar fluidez</text>

      <!-- Row 2 -->
      <rect y="64" width="900" height="54" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
      <rect x="15" y="79" width="100" height="24" rx="12" fill="#F3E8FF" />
      <text x="65" y="95" font-family="sans-serif" font-size="10" font-weight="bold" fill="#6B21A8" text-anchor="middle">REPETICIÓN</text>
      <text x="135" y="97" font-family="monospace" font-size="12" fill="#94A3B8" text-decoration="line-through">yo-yo</text>
      <text x="320" y="97" font-family="sans-serif" font-size="12" fill="#64748B">→</text>
      <text x="350" y="97" font-family="monospace" font-size="12" font-weight="bold" fill="#059669">yo</text>
      <text x="520" y="97" font-family="sans-serif" font-size="11.5" fill="#475569">Eliminación de tartamudeo o corte fonético STT</text>

      <!-- Row 3 -->
      <rect y="128" width="900" height="54" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
      <rect x="15" y="143" width="100" height="24" rx="12" fill="#D1FAE5" />
      <text x="65" y="159" font-family="sans-serif" font-size="10" font-weight="bold" fill="#065F46" text-anchor="middle">ORTOGRAFÍA</text>
      <text x="135" y="161" font-family="monospace" font-size="12" fill="#94A3B8" text-decoration="line-through">sesion / dia</text>
      <text x="320" y="161" font-family="sans-serif" font-size="12" fill="#64748B">→</text>
      <text x="350" y="161" font-family="monospace" font-size="12" font-weight="bold" fill="#059669">sesión / día</text>
      <text x="520" y="161" font-family="sans-serif" font-size="11.5" fill="#475569">Acentuación ortográfica obligatoria según RAE</text>

      <!-- Row 4 -->
      <rect y="192" width="900" height="54" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
      <rect x="15" y="207" width="100" height="24" rx="12" fill="#DBEAFE" />
      <text x="65" y="223" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1E40AF" text-anchor="middle">PUNTUACIÓN</text>
      <text x="135" y="225" font-family="monospace" font-size="12" fill="#94A3B8" text-decoration="line-through">habra alguna duda?</text>
      <text x="320" y="225" font-family="sans-serif" font-size="12" fill="#64748B">→</text>
      <text x="350" y="225" font-family="monospace" font-size="12" font-weight="bold" fill="#059669">¿Habrá alguna duda?</text>
      <text x="520" y="225" font-family="sans-serif" font-size="11.5" fill="#475569">Signo de apertura interrogativo '¿' y tilde diacrítica</text>

      <!-- Row 5 -->
      <rect y="256" width="900" height="54" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
      <rect x="15" y="271" width="100" height="24" rx="12" fill="#E0E7FF" />
      <text x="65" y="287" font-family="sans-serif" font-size="10" font-weight="bold" fill="#3730A3" text-anchor="middle">SEGURIDAD</text>
      <text x="135" y="289" font-family="monospace" font-size="12" fill="#94A3B8">HTTP Claro (Inseguro)</text>
      <text x="320" y="289" font-family="sans-serif" font-size="12" fill="#64748B">→</text>
      <text x="350" y="289" font-family="monospace" font-size="12" font-weight="bold" fill="#059669">TLS 1.3 / HSTS 1 Año</text>
      <text x="520" y="289" font-family="sans-serif" font-size="11.5" fill="#475569">Cabecera Strict-Transport-Security y Content-Security-Policy</text>
    </g>
  </g>
</svg>`;

// 7. App Android Móvil (Jetpack Compose Layout)
const androidMovilSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="100%" height="100%">
  <rect width="1000" height="650" rx="20" fill="#0B0F19" />
  
  <text x="500" y="50" font-family="sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle">
    Aplicación Nativa Android · Actas Digitales APK
  </text>
  <text x="500" y="78" font-family="sans-serif" font-size="13" fill="#94A3B8" text-anchor="middle">
    Arquitectura Jetpack Compose · Grabación 128 kbps AAC · Tolerancia TLS 1.3 CA Autofirmada
  </text>

  <!-- Left Feature Box -->
  <g transform="translate(60, 120)">
    <rect width="280" height="480" rx="16" fill="#1E293B" stroke="#334155" />
    <text x="24" y="36" font-family="sans-serif" font-size="14" font-weight="bold" fill="#38BDF8">🛡️ Blindaje Criptográfico</text>
    
    <rect x="20" y="55" width="240" height="85" rx="8" fill="#0F172A" />
    <text x="32" y="78" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">Firma de APK</text>
    <text x="32" y="98" font-family="monospace" font-size="10.5" fill="#10B981">RSA 4096 bits · v1 Scheme</text>
    <text x="32" y="118" font-family="sans-serif" font-size="9.5" fill="#64748B">Certificado X.509 Verificado</text>

    <rect x="20" y="155" width="240" height="85" rx="8" fill="#0F172A" />
    <text x="32" y="178" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">Audio Engine</text>
    <text x="32" y="198" font-family="monospace" font-size="10.5" fill="#38BDF8">AAC 128 kbps · Estéreo</text>
    <text x="32" y="218" font-family="sans-serif" font-size="9.5" fill="#64748B">VAD local + WorkManager</text>

    <rect x="20" y="255" width="240" height="85" rx="8" fill="#0F172A" />
    <text x="32" y="278" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">Hash de Custodia</text>
    <text x="32" y="298" font-family="monospace" font-size="10" fill="#FBBF24">SHA-256 en tiempo real</text>
    <text x="32" y="318" font-family="sans-serif" font-size="9.5" fill="#64748B">Inmutable punto a punto</text>

    <rect x="20" y="370" width="240" height="75" rx="10" fill="#10B981" />
    <text x="140" y="400" font-family="sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Descargar APK</text>
    <text x="140" y="422" font-family="sans-serif" font-size="10" fill="#E6FFFA" text-anchor="middle">android/ActasDigitales.apk</text>
  </g>

  <!-- Center: Phone Mockup -->
  <g transform="translate(370, 110)">
    <rect width="270" height="510" rx="36" fill="#020617" stroke="#475569" stroke-width="5" />
    <rect x="95" y="14" width="80" height="12" rx="6" fill="#1E293B" />
    
    <rect x="12" y="36" width="246" height="460" rx="24" fill="#FFFFFF" />
    <rect x="12" y="36" width="246" height="44" rx="2" fill="#4F46E5" />
    <text x="28" y="64" font-family="sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF">Actas Digitales Móvil</text>
    <text x="228" y="64" font-family="sans-serif" font-size="12" fill="#FFFFFF">🔒</text>

    <!-- Native Recorder Card -->
    <rect x="22" y="94" width="226" height="150" rx="14" fill="#F8FAFC" stroke="#E2E8F0" />
    <circle cx="135" cy="148" r="34" fill="#E11D48" />
    <rect x="124" y="137" width="22" height="22" rx="4" fill="#FFFFFF" />
    <text x="135" y="202" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B" text-anchor="middle">Grabar Sesión Oficial</text>
    <text x="135" y="220" font-family="monospace" font-size="10" fill="#E11D48" text-anchor="middle">02:45 · 128 kbps</text>

    <!-- WorkManager Status -->
    <rect x="22" y="258" width="226" height="90" rx="12" fill="#ECFDF5" stroke="#A7F3D0" />
    <text x="32" y="280" font-family="sans-serif" font-size="11" font-weight="bold" fill="#065F46">✓ Conexión Segura Activa</text>
    <text x="32" y="298" font-family="sans-serif" font-size="9" fill="#047857">TLS 1.3 / Certificado RSA-4096</text>
    <rect x="32" y="310" width="206" height="24" rx="6" fill="#10B981" />
    <text x="135" y="326" font-family="sans-serif" font-size="10" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Acta Sincronizada con Éxito</text>

    <!-- Actions -->
    <rect x="22" y="360" width="226" height="36" rx="8" fill="#4F46E5" />
    <text x="135" y="383" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Copiar al Portapapeles</text>
    <rect x="22" y="406" width="226" height="36" rx="8" fill="#F1F5F9" stroke="#CBD5E1" />
    <text x="135" y="429" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">Compartir vía Intent</text>
  </g>

  <!-- Right: Technical Specs Box -->
  <g transform="translate(670, 120)">
    <rect width="270" height="480" rx="16" fill="#1E293B" stroke="#334155" />
    <text x="24" y="36" font-family="sans-serif" font-size="14" font-weight="bold" fill="#A78BFA">📱 Compatibilidad</text>

    <text x="24" y="75" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">Versión Android Mínima:</text>
    <text x="24" y="95" font-family="monospace" font-size="11" fill="#38BDF8">Android 7.0 (API 24+)</text>

    <text x="24" y="130" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">Target SDK:</text>
    <text x="24" y="150" font-family="monospace" font-size="11" fill="#38BDF8">Android 14 (API 34)</text>

    <text x="24" y="185" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">Motor de Interfaz:</text>
    <text x="24" y="205" font-family="sans-serif" font-size="11" fill="#94A3B8">Jetpack Compose Material 3</text>

    <text x="24" y="240" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">Base de Datos Local:</text>
    <text x="24" y="260" font-family="sans-serif" font-size="11" fill="#94A3B8">Room SQLite Cifrado</text>

    <text x="24" y="295" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">Cliente HTTP:</text>
    <text x="24" y="315" font-family="sans-serif" font-size="11" fill="#94A3B8">OkHttp 4 con TLS 1.3</text>

    <rect x="20" y="360" width="230" height="90" rx="10" fill="#0F172A" stroke="#334155" />
    <text x="32" y="388" font-family="sans-serif" font-size="11" font-weight="bold" fill="#10B981">100% Offline-Resilient</text>
    <text x="32" y="408" font-family="sans-serif" font-size="10" fill="#64748B">Sube audios en segundo</text>
    <text x="32" y="424" font-family="sans-serif" font-size="10" fill="#64748B">plano al recuperar WiFi/4G</text>
  </g>
</svg>`;

// 8. Showcase Móvil PWA vs Android Nativo
const movilShowcaseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 550" width="100%" height="100%">
  <defs>
    <linearGradient id="movilBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="100%" stop-color="#1E1B4B" />
    </linearGradient>
  </defs>

  <rect width="1200" height="550" fill="url(#movilBg)" />
  <circle cx="250" cy="220" r="180" fill="#4F46E5" opacity="0.18" filter="blur(70px)" />
  <circle cx="950" cy="300" r="220" fill="#10B981" opacity="0.15" filter="blur(80px)" />

  <text x="600" y="65" font-family="sans-serif" font-size="26" font-weight="900" fill="#FFFFFF" text-anchor="middle">
    Actas Digitales en Movilidad · PWA &amp; App Nativa Android
  </text>
  <text x="600" y="98" font-family="sans-serif" font-size="14" fill="#A5B4FC" text-anchor="middle">
    Máxima versatilidad: Acceso web instantáneo o aplicación nativa de alto rendimiento con APK firmado en RSA-4096
  </text>

  <!-- Left: Web PWA -->
  <g transform="translate(240, 130)">
    <rect width="260" height="380" rx="28" fill="#020617" stroke="#475569" stroke-width="4" />
    <rect x="12" y="24" width="236" height="342" rx="18" fill="#FFFFFF" />
    <rect x="12" y="24" width="236" height="42" rx="2" fill="#4F46E5" />
    <text x="24" y="50" font-family="sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">PWA Responsive</text>
    
    <circle cx="130" cy="140" r="36" fill="#4F46E5" />
    <text x="119" y="150" font-size="26" fill="#FFFFFF">🎙️</text>
    <text x="130" y="205" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B" text-anchor="middle">Navegador Web</text>
    <text x="130" y="222" font-family="sans-serif" font-size="9.5" fill="#64748B" text-anchor="middle">Chrome, Safari, Firefox</text>

    <rect x="25" y="245" width="210" height="70" rx="10" fill="#ECFDF5" />
    <text x="130" y="272" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#059669" text-anchor="middle">✓ Sin Instalación Previa</text>
    <text x="130" y="292" font-family="sans-serif" font-size="9.5" fill="#047857" text-anchor="middle">100% Funcional en iOS y Android</text>
  </g>

  <!-- Right: Android Native App -->
  <g transform="translate(700, 130)">
    <rect width="260" height="380" rx="28" fill="#020617" stroke="#10B981" stroke-width="4" />
    <rect x="12" y="24" width="236" height="342" rx="18" fill="#FFFFFF" />
    <rect x="12" y="24" width="236" height="42" rx="2" fill="#10B981" />
    <text x="24" y="50" font-family="sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">Android Nativo (Kotlin)</text>
    
    <circle cx="130" cy="140" r="36" fill="#10B981" />
    <text x="119" y="150" font-size="26" fill="#FFFFFF">📱</text>
    <text x="130" y="205" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B" text-anchor="middle">Jetpack Compose</text>
    <text x="130" y="222" font-family="sans-serif" font-size="9.5" fill="#64748B" text-anchor="middle">WorkManager + Room SQLite</text>

    <rect x="25" y="245" width="210" height="70" rx="10" fill="#EEF2FF" />
    <text x="130" y="272" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#4338CA" text-anchor="middle">✓ Descarga Directa APK</text>
    <text x="130" y="292" font-family="sans-serif" font-size="9.5" fill="#3730A3" text-anchor="middle">Firma RSA-4096 &amp; TLS 1.3</text>
  </g>
</svg>`;

async function main() {
  console.log("Iniciando renderizado de capturas fotorealistas en alta resolución...");
  await savePng(galeriaSvg, path.join(CAPTURAS_DIR, 'galeria-actas-digitales.png'), 1600);
  await savePng(grabacionSvg, path.join(CAPTURAS_DIR, 'grabacion-audio.png'), 1000);
  await savePng(pipelineSvg, path.join(CAPTURAS_DIR, 'pipeline-progreso.png'), 1000);
  await savePng(comparativaSvg, path.join(CAPTURAS_DIR, 'comparativa-antes-despues.png'), 1000);
  await savePng(actaOficialSvg, path.join(CAPTURAS_DIR, 'acta-oficial-rae.png'), 1000);
  await savePng(auditoriaSvg, path.join(CAPTURAS_DIR, 'auditoria-correcciones.png'), 1000);
  await savePng(androidMovilSvg, path.join(CAPTURAS_DIR, 'app-android-movil.png'), 1000);
  await savePng(movilShowcaseSvg, path.join(ASSETS_DIR, 'actas-digitales-movil.png'), 1200);
  console.log("Todas las capturas han sido generadas y sincronizadas exitosamente.");
}

main().catch(console.error);
