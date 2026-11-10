import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderAsync } from '/tmp/node_modules/@resvg/resvg-js/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAPTURAS_DIR = path.join(__dirname, '..', 'docs', 'assets', 'capturas');
const ASSETS_DIR = path.join(__dirname, '..', 'docs', 'assets');

fs.mkdirSync(CAPTURAS_DIR, { recursive: true });

async function savePng(svgString, outputPath, width = 1200) {
  const res = await renderAsync(svgString, { fitTo: { mode: 'width', value: width } });
  fs.writeFileSync(outputPath, res.asPng());
  console.log(`✓ Generada captura: ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
}

// 1. Galería Panorámica
const galeriaSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 700" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#1E1B4B" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <rect width="1600" height="700" fill="url(#bgGrad)" />

  <!-- Header Banner -->
  <text x="800" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto" font-size="28" font-weight="900" fill="#FFFFFF" text-anchor="middle">Actas Digitales · Ecosistema Integral de Voz a Texto Oficial</text>
  <text x="800" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto" font-size="16" fill="#A5B4FC" text-anchor="middle">Grabación en Vivo · Detección VAD · Consolidación Lingüística · Corrección RAE · Acta Formal</text>

  <!-- Left: Web Screen Mockup -->
  <g transform="translate(60, 150)" filter="url(#shadow)">
    <rect width="900" height="500" rx="16" fill="#FFFFFF" />
    <rect width="900" height="42" rx="16" fill="#F8FAFC" />
    <circle cx="24" cy="21" r="6" fill="#EF4444" />
    <circle cx="42" cy="21" r="6" fill="#F59E0B" />
    <circle cx="60" cy="21" r="6" fill="#10B981" />
    <rect x="90" y="10" width="460" height="22" rx="6" fill="#FFFFFF" stroke="#E2E8F0" />
    <text x="110" y="25" font-family="sans-serif" font-size="11" fill="#4F46E5" font-weight="600">🔒 https://actasdigitales.local/app</text>

    <!-- App Header -->
    <rect x="25" y="60" width="850" height="50" rx="10" fill="#4F46E5" />
    <text x="50" y="92" font-family="sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF">🎙️ Actas Digitales · Panel de Control</text>
    <rect x="740" y="72" width="115" height="26" rx="6" fill="#3730A3" />
    <text x="752" y="89" font-family="sans-serif" font-size="11" font-weight="bold" fill="#A5B4FC">TLS 1.3 SEGURO</text>

    <!-- Side-by-Side Content Inside Mockup -->
    <rect x="25" y="125" width="415" height="200" rx="12" fill="#FFF1F2" stroke="#FECDD3" />
    <text x="45" y="155" font-family="sans-serif" font-size="13" font-weight="bold" fill="#9F1239">Transcripción Cruda (STT)</text>
    <text x="45" y="185" font-family="monospace" font-size="12" fill="#881337">
      <tspan x="45" dy="0">"bueno pues este... yo-yo creo que</tspan>
      <tspan x="45" dy="20">vamos a a a revisar la sesion del</tspan>
      <tspan x="45" dy="20">dia de hoy. ¿habra alguna duda?"</tspan>
    </text>

    <rect x="460" y="125" width="415" height="200" rx="12" fill="#ECFDF5" stroke="#A7F3D0" />
    <text x="480" y="155" font-family="sans-serif" font-size="13" font-weight="bold" fill="#065F46">Acta Oficial Consolidada</text>
    <text x="480" y="185" font-family="sans-serif" font-size="12" font-weight="500" fill="#047857">
      <tspan x="480" dy="0">"Damos inicio a la sesión del día de</tspan>
      <tspan x="480" dy="20">hoy. Yo creo que vamos a revisar el</tspan>
      <tspan x="480" dy="20">presupuesto técnico. ¿Habrá alguna duda?"</tspan>
    </text>

    <!-- Pipeline Bar Bottom -->
    <rect x="25" y="340" width="850" height="130" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
    <text x="45" y="370" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1E293B">Pipeline de Inteligencia Lingüística · 100% Completado</text>
    <rect x="45" y="385" width="810" height="10" rx="5" fill="#E2E8F0" />
    <rect x="45" y="385" width="810" height="10" rx="5" fill="#10B981" />
    <text x="45" y="420" font-family="sans-serif" font-size="11" fill="#059669" font-weight="bold">✓ Ingesta  |  ✓ VAD Silencios  |  ✓ STT Fonético Español  |  ✓ Fusión y Muletillas  |  ✓ Corrección RAE</text>
    <text x="45" y="445" font-family="sans-serif" font-size="11" fill="#64748B">Tiempo: 3.4s · Palabras: 45 · 3 muletillas suprimidas · 7 correcciones ortotipográficas aplicadas</text>
  </g>

  <!-- Right: Mobile Screen Mockup -->
  <g transform="translate(1030, 130)" filter="url(#shadow)">
    <rect width="280" height="540" rx="36" fill="#020617" stroke="#475569" stroke-width="5" />
    <rect x="100" y="15" width="80" height="14" rx="7" fill="#1E293B" />
    <!-- Screen Area -->
    <rect x="12" y="38" width="256" height="490" rx="24" fill="#F8FAFC" />
    <rect x="12" y="38" width="256" height="50" rx="4" fill="#4F46E5" />
    <text x="30" y="70" font-family="sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Actas Digitales</text>
    <text x="220" y="70" font-family="sans-serif" font-size="14" fill="#FFFFFF">🔒</text>

    <!-- Mic Button -->
    <rect x="28" y="110" width="224" height="170" rx="16" fill="#FFFFFF" stroke="#E2E8F0" />
    <circle cx="140" cy="175" r="38" fill="#4F46E5" />
    <text x="128" y="185" font-size="28" fill="#FFFFFF">🎙️</text>
    <text x="140" y="240" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1E293B" text-anchor="middle">Grabar Reunión</text>
    <text x="140" y="260" font-family="sans-serif" font-size="10" fill="#64748B" text-anchor="middle">AAC 16 kHz · WorkManager Activo</text>

    <!-- Mobile Result Card -->
    <rect x="28" y="300" width="224" height="200" rx="16" fill="#FFFFFF" stroke="#E2E8F0" />
    <text x="42" y="325" font-family="sans-serif" font-size="12" font-weight="bold" fill="#059669">✓ Acta Final Lista</text>
    <rect x="42" y="335" width="196" height="95" rx="8" fill="#F1F5F9" />
    <text x="50" y="355" font-family="sans-serif" font-size="10" fill="#1E293B">
      <tspan x="50" dy="0">Damos inicio a la sesión del día</tspan>
      <tspan x="50" dy="16">de hoy. Se aprueban los acuerdos</tspan>
      <tspan x="50" dy="16">y presupuestos por unanimidad.</tspan>
    </text>
    <rect x="42" y="445" width="196" height="36" rx="10" fill="#4F46E5" />
    <text x="140" y="468" font-family="sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Copiar y Compartir</text>
  </g>

  <!-- Right Floating Quality Badge -->
  <g transform="translate(1360, 200)" filter="url(#shadow)">
    <rect width="180" height="220" rx="16" fill="#1E1B4B" stroke="#4338CA" stroke-width="2" />
    <text x="90" y="45" font-family="sans-serif" font-size="28" text-anchor="middle">🔒</text>
    <text x="90" y="75" font-family="sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF" text-anchor="middle">SEGURIDAD TOP 1</text>
    <text x="90" y="105" font-family="sans-serif" font-size="11" fill="#10B981" text-anchor="middle">✓ TLS 1.3 / HSTS</text>
    <text x="90" y="130" font-family="sans-serif" font-size="11" fill="#10B981" text-anchor="middle">✓ Certificados SAN</text>
    <text x="90" y="155" font-family="sans-serif" font-size="11" fill="#10B981" text-anchor="middle">✓ OWASP Top 10</text>
    <text x="90" y="180" font-family="sans-serif" font-size="11" fill="#10B981" text-anchor="middle">✓ Privacidad 100%</text>
  </g>
</svg>`;

// 2. Grabación de Audio
const grabacionSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
  <rect width="800" height="42" rx="16" fill="#F8FAFC" />
  <circle cx="20" cy="21" r="5" fill="#EF4444" /><circle cx="35" cy="21" r="5" fill="#F59E0B" /><circle cx="50" cy="21" r="5" fill="#10B981" />
  <text x="80" y="26" font-family="sans-serif" font-size="11" fill="#4F46E5" font-weight="bold">🔒 Grabación de Audio en Directo · Web Audio API</text>

  <circle cx="400" cy="180" r="60" fill="#E11D48" />
  <circle cx="400" cy="180" r="75" fill="none" stroke="#E11D48" stroke-width="3" opacity="0.4" />
  <rect x="382" y="162" width="36" height="36" rx="6" fill="#FFFFFF" />

  <text x="400" y="285" font-family="monospace" font-size="32" font-weight="bold" fill="#1E293B" text-anchor="middle">02:45</text>
  <text x="400" y="320" font-family="sans-serif" font-size="14" font-weight="bold" fill="#E11D48" text-anchor="middle">● Grabando sesión en directo... Habla claramente en español</text>
  <text x="400" y="345" font-family="sans-serif" font-size="12" fill="#64748B" text-anchor="middle">Muestreo nativo 16 kHz · Micrófono activo con cancelación de eco</text>

  <g transform="translate(150, 390)">
    <rect width="500" height="50" rx="10" fill="#F1F5F9" stroke="#CBD5E1" />
    <text x="250" y="31" font-family="sans-serif" font-size="13" font-weight="bold" fill="#475569" text-anchor="middle">Detener grabación para iniciar consolidación automática</text>
  </g>
</svg>`;

// 3. Pipeline Progreso
const pipelineSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
  <rect width="800" height="42" rx="16" fill="#F8FAFC" />
  <circle cx="20" cy="21" r="5" fill="#EF4444" /><circle cx="35" cy="21" r="5" fill="#F59E0B" /><circle cx="50" cy="21" r="5" fill="#10B981" />
  <text x="80" y="26" font-family="sans-serif" font-size="11" fill="#4F46E5" font-weight="bold">🔒 Pipeline de Procesamiento Asíncrono en Tiempo Real</text>

  <text x="40" y="80" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0F172A">Junta_Directiva_Trimestral.m4a (14.2 MB)</text>
  <text x="730" y="80" font-family="monospace" font-size="24" font-weight="bold" fill="#4F46E5" text-anchor="end">88%</text>

  <!-- Progress Bar -->
  <rect x="40" y="100" width="720" height="12" rx="6" fill="#E2E8F0" />
  <rect x="40" y="100" width="633" height="12" rx="6" fill="#4F46E5" />

  <!-- 5 Cards Horizontal -->
  <g transform="translate(40, 140)">
    <!-- Step 1 -->
    <rect width="135" height="180" rx="10" fill="#ECFDF5" stroke="#A7F3D0" />
    <text x="67" y="35" font-size="22" text-anchor="middle">✓</text>
    <text x="67" y="65" font-family="sans-serif" font-size="11" font-weight="bold" fill="#065F46" text-anchor="middle">1. Ingesta</text>
    <text x="67" y="90" font-family="sans-serif" font-size="9" fill="#047857" text-anchor="middle">Validación MIME y</text>
    <text x="67" y="105" font-family="sans-serif" font-size="9" fill="#047857" text-anchor="middle">encolado seguro</text>

    <!-- Step 2 -->
    <rect x="146" width="135" height="180" rx="10" fill="#ECFDF5" stroke="#A7F3D0" />
    <text x="213" y="35" font-size="22" text-anchor="middle">✓</text>
    <text x="213" y="65" font-family="sans-serif" font-size="11" font-weight="bold" fill="#065F46" text-anchor="middle">2. VAD Silencios</text>
    <text x="213" y="90" font-family="sans-serif" font-size="9" fill="#047857" text-anchor="middle">Normalización y</text>
    <text x="213" y="105" font-family="sans-serif" font-size="9" fill="#047857" text-anchor="middle">corte acústico</text>

    <!-- Step 3 -->
    <rect x="292" width="135" height="180" rx="10" fill="#ECFDF5" stroke="#A7F3D0" />
    <text x="359" y="35" font-size="22" text-anchor="middle">✓</text>
    <text x="359" y="65" font-family="sans-serif" font-size="11" font-weight="bold" fill="#065F46" text-anchor="middle">3. STT Español</text>
    <text x="359" y="90" font-family="sans-serif" font-size="9" fill="#047857" text-anchor="middle">Modelo forzado</text>
    <text x="359" y="105" font-family="sans-serif" font-size="9" fill="#047857" text-anchor="middle">en idioma español</text>

    <!-- Step 4 -->
    <rect x="438" width="135" height="180" rx="10" fill="#ECFDF5" stroke="#A7F3D0" />
    <text x="505" y="35" font-size="22" text-anchor="middle">✓</text>
    <text x="505" y="65" font-family="sans-serif" font-size="11" font-weight="bold" fill="#065F46" text-anchor="middle">4. Consolidación</text>
    <text x="505" y="90" font-family="sans-serif" font-size="9" fill="#047857" text-anchor="middle">Desduplicación y</text>
    <text x="505" y="105" font-family="sans-serif" font-size="9" fill="#047857" text-anchor="middle">sin muletillas</text>

    <!-- Step 5 -->
    <rect x="584" width="135" height="180" rx="10" fill="#EEF2FF" stroke="#818CF8" />
    <text x="651" y="35" font-size="22" text-anchor="middle">⚙️</text>
    <text x="651" y="65" font-family="sans-serif" font-size="11" font-weight="bold" fill="#312E81" text-anchor="middle">5. Corrección RAE</text>
    <text x="651" y="90" font-family="sans-serif" font-size="9" fill="#4338CA" text-anchor="middle">Tildes, signos ¿ ¡</text>
    <text x="651" y="105" font-family="sans-serif" font-size="9" fill="#4338CA" text-anchor="middle">y concordancia</text>
  </g>

  <rect x="40" y="360" width="720" height="90" rx="10" fill="#F8FAFC" stroke="#E2E8F0" />
  <text x="60" y="395" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B">Paso actual: Aplicando reglas de concordancia gramatical y puntuación oficial...</text>
  <text x="60" y="420" font-family="sans-serif" font-size="11" fill="#64748B">Conexión activa vía Server-Sent Events (SSE) con el servidor seguro FastAPI</text>
</svg>`;

// 4. Comparativa Antes / Después
const comparativaSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
  <rect width="800" height="42" rx="16" fill="#F8FAFC" />
  <circle cx="20" cy="21" r="5" fill="#EF4444" /><circle cx="35" cy="21" r="5" fill="#F59E0B" /><circle cx="50" cy="21" r="5" fill="#10B981" />
  <text x="80" y="26" font-family="sans-serif" font-size="11" fill="#4F46E5" font-weight="bold">🔒 Comparativa de Calidad: Antes (Crudo) vs Después (Consolidado)</text>

  <g transform="translate(30, 70)">
    <!-- Left Box: Raw Transcript -->
    <rect width="355" height="380" rx="12" fill="#FFF1F2" stroke="#FECDD3" />
    <rect x="15" y="15" width="220" height="26" rx="6" fill="#FFE4E6" />
    <text x="25" y="32" font-family="sans-serif" font-size="11" font-weight="bold" fill="#9F1239">ANTES · TRANSCRIPCIÓN CRUDA</text>
    
    <text x="15" y="70" font-family="monospace" font-size="11" fill="#881337" line-height="1.6">
      <tspan x="15" dy="0">"bueno pues este... damos inicio</tspan>
      <tspan x="15" dy="22">a la sesion del dia de hoy.</tspan>
      <tspan x="15" dy="22">yo-yo creo que el presupuesto</tspan>
      <tspan x="15" dy="22">tendra que ser revisado por la</tspan>
      <tspan x="15" dy="22">comision tecnica.</tspan>
      <tspan x="15" dy="30">¿habra alguna duda o pregunta?</tspan>
      <tspan x="15" dy="30">ehhh tipo que todos estamos de</tspan>
      <tspan x="15" dy="22">acuerdo con el parrafo ultimo."</tspan>
    </text>

    <!-- Right Box: Consolidated Minutes -->
    <rect x="385" width="355" height="380" rx="12" fill="#ECFDF5" stroke="#A7F3D0" />
    <rect x="400" y="15" width="230" height="26" rx="6" fill="#D1FAE5" />
    <text x="410" y="32" font-family="sans-serif" font-size="11" font-weight="bold" fill="#065F46">DESPUÉS · ACTA CONSOLIDADA</text>
    
    <text x="400" y="70" font-family="sans-serif" font-size="11" font-weight="500" fill="#047857" line-height="1.6">
      <tspan x="400" dy="0">"Damos inicio a la sesión del día</tspan>
      <tspan x="400" dy="22">de hoy. Yo creo que el presupuesto</tspan>
      <tspan x="400" dy="22">tendrá que ser revisado por la</tspan>
      <tspan x="400" dy="22">comisión técnica.</tspan>
      <tspan x="400" dy="30">¿Habrá alguna duda o pregunta?</tspan>
      <tspan x="400" dy="30">Todos estamos de acuerdo con</tspan>
      <tspan x="400" dy="22">el párrafo último."</tspan>
    </text>

    <rect x="400" y="290" width="325" height="60" rx="8" fill="#FFFFFF" stroke="#A7F3D0" />
    <text x="412" y="312" font-family="sans-serif" font-size="10" font-weight="bold" fill="#059669">✓ 4 muletillas y cortes suprimidos</text>
    <text x="412" y="332" font-family="sans-serif" font-size="10" font-weight="bold" fill="#059669">✓ 5 tildes RAE y signos ¿ ¡ corregidos</text>
  </g>
</svg>`;

// 5. Acta Oficial RAE
const actaOficialSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
  <rect width="800" height="42" rx="16" fill="#F8FAFC" />
  <circle cx="20" cy="21" r="5" fill="#EF4444" /><circle cx="35" cy="21" r="5" fill="#F59E0B" /><circle cx="50" cy="21" r="5" fill="#10B981" />
  <text x="80" y="26" font-family="sans-serif" font-size="11" fill="#4F46E5" font-weight="bold">🔒 Estructuración Automática de Acta Oficial con Acuerdos y Firmas</text>

  <g transform="translate(50, 70)">
    <rect width="700" height="390" rx="10" fill="#FFFFFF" stroke="#CBD5E1" />
    <text x="350" y="35" font-family="serif" font-size="16" font-weight="bold" fill="#0F172A" text-anchor="middle">ACTA DE SESIÓN ORDINARIA DE CONSEJO</text>
    <text x="350" y="55" font-family="sans-serif" font-size="10" fill="#64748B" text-anchor="middle">Fecha: 10 de Noviembre de 2026 · Sala de Juntas Principal · Cifrado TLS 1.3</text>
    <line x1="30" y1="70" x2="670" y2="70" stroke="#E2E8F0" />

    <text x="30" y="95" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1E293B">1. Asistentes y Quórum:</text>
    <text x="30" y="115" font-family="sans-serif" font-size="10" fill="#475569">Presidente de Consejo, Directora Ejecutiva, Secretario General, Vocales Técnicos.</text>

    <text x="30" y="145" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1E293B">2. Resumen de Deliberaciones:</text>
    <text x="30" y="165" font-family="sans-serif" font-size="10" fill="#475569">Damos inicio a la sesión del día de hoy. El consejo revisa las metas estratégicas y presupuestos.</text>

    <text x="30" y="195" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1E293B">3. Acuerdos Adoptados:</text>
    <rect x="30" y="205" width="640" height="26" rx="6" fill="#F1F5F9" />
    <text x="40" y="222" font-family="sans-serif" font-size="10" fill="#1E293B"><strong>ACUERDO-01:</strong> Aprobación por unanimidad del dictamen presupuestario del ejercicio.</text>
    <rect x="30" y="235" width="640" height="26" rx="6" fill="#F1F5F9" />
    <text x="40" y="252" font-family="sans-serif" font-size="10" fill="#1E293B"><strong>ACUERDO-02:</strong> Publicación inmediata del acta oficial en el repositorio institucional seguro.</text>

    <line x1="30" y1="280" x2="670" y2="280" stroke="#E2E8F0" />
    <text x="150" y="330" font-family="sans-serif" font-size="10" fill="#1E293B" text-anchor="middle">__________________________________</text>
    <text x="150" y="348" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1E293B" text-anchor="middle">Presidente del Consejo</text>
    <text x="550" y="330" font-family="sans-serif" font-size="10" fill="#1E293B" text-anchor="middle">__________________________________</text>
    <text x="550" y="348" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1E293B" text-anchor="middle">Secretario de Actas</text>
  </g>
</svg>`;

// 6. Auditoría de Correcciones
const auditoriaSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
  <rect width="800" height="42" rx="16" fill="#F8FAFC" />
  <circle cx="20" cy="21" r="5" fill="#EF4444" /><circle cx="35" cy="21" r="5" fill="#F59E0B" /><circle cx="50" cy="21" r="5" fill="#10B981" />
  <text x="80" y="26" font-family="sans-serif" font-size="11" fill="#4F46E5" font-weight="bold">🔒 Auditoría Detallada de Correcciones Lingüísticas Aplicadas</text>

  <g transform="translate(40, 70)">
    <text x="0" y="20" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0F172A">Registro de Modificaciones (7 Correcciones)</text>

    <!-- Row 1 -->
    <rect y="35" width="720" height="50" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
    <rect x="15" y="47" width="80" height="24" rx="12" fill="#FEF3C7" />
    <text x="55" y="63" font-family="sans-serif" font-size="10" font-weight="bold" fill="#92400E" text-anchor="middle">MULETILLA</text>
    <text x="110" y="65" font-family="monospace" font-size="11" fill="#94A3B8" text-decoration="line-through">bueno pues este...</text>
    <text x="270" y="65" font-family="sans-serif" font-size="11" fill="#64748B">→</text>
    <text x="290" y="65" font-family="monospace" font-size="11" font-weight="bold" fill="#059669">(suprimido)</text>
    <text x="450" y="65" font-family="sans-serif" font-size="11" fill="#475569">Vacilación oral eliminada para dar fluidez</text>

    <!-- Row 2 -->
    <rect y="95" width="720" height="50" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
    <rect x="15" y="107" width="80" height="24" rx="12" fill="#F3E8FF" />
    <text x="55" y="123" font-family="sans-serif" font-size="10" font-weight="bold" fill="#6B21A8" text-anchor="middle">REPETICIÓN</text>
    <text x="110" y="125" font-family="monospace" font-size="11" fill="#94A3B8" text-decoration="line-through">yo-yo</text>
    <text x="270" y="125" font-family="sans-serif" font-size="11" fill="#64748B">→</text>
    <text x="290" y="125" font-family="monospace" font-size="11" font-weight="bold" fill="#059669">yo</text>
    <text x="450" y="125" font-family="sans-serif" font-size="11" fill="#475569">Eliminación de tartamudeo o corte fonético</text>

    <!-- Row 3 -->
    <rect y="155" width="720" height="50" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
    <rect x="15" y="167" width="80" height="24" rx="12" fill="#D1FAE5" />
    <text x="55" y="183" font-family="sans-serif" font-size="10" font-weight="bold" fill="#065F46" text-anchor="middle">ORTOGRAFÍA</text>
    <text x="110" y="185" font-family="monospace" font-size="11" fill="#94A3B8" text-decoration="line-through">sesion</text>
    <text x="270" y="185" font-family="sans-serif" font-size="11" fill="#64748B">→</text>
    <text x="290" y="185" font-family="monospace" font-size="11" font-weight="bold" fill="#059669">sesión</text>
    <text x="450" y="185" font-family="sans-serif" font-size="11" fill="#475569">Acentuación ortográfica reglamentaria RAE</text>

    <!-- Row 4 -->
    <rect y="215" width="720" height="50" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
    <rect x="15" y="227" width="80" height="24" rx="12" fill="#DBEAFE" />
    <text x="55" y="243" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1E40AF" text-anchor="middle">PUNTUACIÓN</text>
    <text x="110" y="245" font-family="monospace" font-size="11" fill="#94A3B8" text-decoration="line-through">habra alguna duda?</text>
    <text x="270" y="245" font-family="sans-serif" font-size="11" fill="#64748B">→</text>
    <text x="290" y="245" font-family="monospace" font-size="11" font-weight="bold" fill="#059669">¿Habrá alguna duda?</text>
    <text x="450" y="245" font-family="sans-serif" font-size="11" fill="#475569">Inyección de signo de apertura obligatorio '¿'</text>
  </g>
</svg>`;

// 7. App Android Móvil
const androidMovilSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" rx="16" fill="#F1F5F9" />
  
  <g transform="translate(280, 20)">
    <rect width="240" height="460" rx="32" fill="#020617" stroke="#334155" stroke-width="4" />
    <rect x="90" y="12" width="60" height="10" rx="5" fill="#1E293B" />
    
    <rect x="10" y="30" width="220" height="420" rx="22" fill="#FFFFFF" />
    <rect x="10" y="30" width="220" height="44" rx="2" fill="#4F46E5" />
    <text x="25" y="58" font-family="sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF">Actas Digitales Móvil</text>
    <text x="200" y="58" font-family="sans-serif" font-size="12" fill="#FFFFFF">🔒</text>

    <!-- Native Recorder Card -->
    <rect x="22" y="90" width="196" height="140" rx="12" fill="#F8FAFC" stroke="#E2E8F0" />
    <circle cx="120" cy="140" r="32" fill="#4F46E5" />
    <text x="110" y="148" font-size="22" fill="#FFFFFF">🎙️</text>
    <text x="120" y="195" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1E293B" text-anchor="middle">Grabar Sesión Oficial</text>
    <text x="120" y="212" font-family="sans-serif" font-size="9" fill="#64748B" text-anchor="middle">AAC 16 kHz · WorkManager Activo</text>

    <!-- WorkManager Status -->
    <rect x="22" y="245" width="196" height="85" rx="12" fill="#ECFDF5" stroke="#A7F3D0" />
    <text x="32" y="268" font-family="sans-serif" font-size="11" font-weight="bold" fill="#065F46">✓ Subida Resiliente Completada</text>
    <text x="32" y="285" font-family="sans-serif" font-size="9" fill="#047857">Reanudación automática ante cortes</text>
    <rect x="32" y="295" width="176" height="22" rx="6" fill="#10B981" />
    <text x="120" y="310" font-family="sans-serif" font-size="10" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Acta Sincronizada con Éxito</text>

    <!-- Buttons -->
    <rect x="22" y="345" width="196" height="34" rx="8" fill="#4F46E5" />
    <text x="120" y="367" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Copiar al Portapapeles</text>
    <rect x="22" y="390" width="196" height="34" rx="8" fill="#F1F5F9" stroke="#CBD5E1" />
    <text x="120" y="412" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">Compartir vía Intent</text>
  </g>
</svg>`;

// 8. Showcase Móvil Banner
const movilShowcaseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 480" width="100%" height="100%">
  <rect width="1200" height="480" fill="#0F172A" />
  <circle cx="200" cy="200" r="160" fill="#4F46E5" opacity="0.2" filter="blur(60px)" />
  <circle cx="1000" cy="300" r="200" fill="#10B981" opacity="0.15" filter="blur(70px)" />

  <text x="600" y="60" font-family="sans-serif" font-size="24" font-weight="900" fill="#FFFFFF" text-anchor="middle">Actas Digitales en Dispositivos Móviles</text>
  <text x="600" y="90" font-family="sans-serif" font-size="14" fill="#94A3B8" text-anchor="middle">Aplicación Web Progresiva (PWA) e Instalación Nativa en Android con Jetpack Compose</text>

  <!-- Left: Mobile Web PWA -->
  <g transform="translate(250, 110)">
    <rect width="200" height="340" rx="24" fill="#020617" stroke="#475569" stroke-width="4" />
    <rect x="10" y="24" width="180" height="302" rx="16" fill="#FFFFFF" />
    <rect x="10" y="24" width="180" height="36" rx="2" fill="#4F46E5" />
    <text x="20" y="46" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">PWA Instalable</text>
    <circle cx="100" cy="150" r="30" fill="#4F46E5" />
    <text x="92" y="158" font-size="20" fill="#FFFFFF">🎙️</text>
    <text x="100" y="200" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1E293B" text-anchor="middle">Navegador Instalado</text>
    <rect x="25" y="230" width="150" height="60" rx="8" fill="#ECFDF5" />
    <text x="100" y="260" font-family="sans-serif" font-size="9" font-weight="bold" fill="#059669" text-anchor="middle">✓ Compatible Chrome/Safari</text>
  </g>

  <!-- Right: Android Native App -->
  <g transform="translate(750, 110)">
    <rect width="200" height="340" rx="24" fill="#020617" stroke="#475569" stroke-width="4" />
    <rect x="10" y="24" width="180" height="302" rx="16" fill="#FFFFFF" />
    <rect x="10" y="24" width="180" height="36" rx="2" fill="#10B981" />
    <text x="20" y="46" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF">Android Nativo (Kotlin)</text>
    <circle cx="100" cy="150" r="30" fill="#10B981" />
    <text x="92" y="158" font-size="20" fill="#FFFFFF">📱</text>
    <text x="100" y="200" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1E293B" text-anchor="middle">Jetpack Compose + Room</text>
    <rect x="25" y="230" width="150" height="60" rx="8" fill="#EEF2FF" />
    <text x="100" y="260" font-family="sans-serif" font-size="9" font-weight="bold" fill="#4338CA" text-anchor="middle">✓ WorkManager Background</text>
  </g>
</svg>`;

async function main() {
  await savePng(galeriaSvg, path.join(CAPTURAS_DIR, 'galeria-actas-digitales.png'), 1600);
  await savePng(grabacionSvg, path.join(CAPTURAS_DIR, 'grabacion-audio.png'), 800);
  await savePng(pipelineSvg, path.join(CAPTURAS_DIR, 'pipeline-progreso.png'), 800);
  await savePng(comparativaSvg, path.join(CAPTURAS_DIR, 'comparativa-antes-despues.png'), 800);
  await savePng(actaOficialSvg, path.join(CAPTURAS_DIR, 'acta-oficial-rae.png'), 800);
  await savePng(auditoriaSvg, path.join(CAPTURAS_DIR, 'auditoria-correcciones.png'), 800);
  await savePng(androidMovilSvg, path.join(CAPTURAS_DIR, 'app-android-movil.png'), 800);
  await savePng(movilShowcaseSvg, path.join(ASSETS_DIR, 'actas-digitales-movil.png'), 1200);
}

main().catch(console.error);
