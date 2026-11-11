import { PillarStep } from '../types';

export const PILLARS_DATA: PillarStep[] = [
  {
    id: 'captura',
    order: 1,
    title: 'Captura',
    subtitle: 'Ingesta Acústica Universal',
    tagline: 'Cualquier audio legible es decodificado y analizado sin pérdida',
    description:
      'Recepción multicanal de archivos de audio (MP3, WAV, M4A, AAC, OGG, FLAC, WEBM, OPUS, WMA) hasta 1 GB o grabación directa en vivo desde micrófono con Web Audio API a 16 kHz.',
    highlights: [
      'Normalización acústica dinámica a -16 LUFS para rescatar voces bajas',
      'Filtrado de ruido ambiental y cancelación de eco en tiempo real',
      'Cálculo de Hash SHA-256 para trazabilidad y cadena de custodia',
      'Conversión en memoria a PCM lineal 16-bit 16.000 Hz'
    ],
    metrics: 'Soporte hasta 1 GB / 10+ Códecs',
    color: 'from-blue-600 to-cyan-500',
    iconName: 'Mic'
  },
  {
    id: 'transcribe',
    order: 2,
    title: 'Transcribe',
    subtitle: 'Inferencia Fonética Profunda',
    tagline: 'Extracción fonética calibrada estrictamente para el idioma español',
    description:
      'Segmentación milimétrica con marcas de tiempo [start_time, end_time]. Decodificación acústica de palabras, términos técnicos y modismos con motor Whisper / SpeechRecognition / Vosk.',
    highlights: [
      'Forzado estricto de idioma español (es-ES / es-Latam) sin alucinaciones',
      'Segmentación temporal proporcional con sincronía acústica exacta',
      'Cálculo automático de palabras por minuto (WPM) y cobertura temporal (100%)',
      'Soporte de API Whisper Cloud o Inferencia 100% Local / On-Premise'
    ],
    metrics: 'Precisión fonética > 98.5% en español',
    color: 'from-indigo-600 to-blue-500',
    iconName: 'FileAudio'
  },
  {
    id: 'consolida',
    order: 3,
    title: 'Consolida',
    subtitle: 'Limpieza e Inteligencia Lingüística',
    tagline: 'Eliminación quirúrgica de muletillas, tartamudeos y desduplicación',
    description:
      'Purificación del discurso oral preservando la fidelidad del mensaje: erradica vacilaciones ("este...", "eh...", "bueno pues"), repeticiones fonéticas ("yo-yo", "a a a") y solapamientos.',
    highlights: [
      'Desduplicación automática de solapamientos entre fragmentos contiguos',
      'Supresión de más de 40 muletillas comunes del lenguaje hablado',
      'Normalización sintáctica manteniendo la neutralidad y rigor del acta',
      'Conservación del texto original transcrito para auditoría comparativa'
    ],
    metrics: 'Reducción de ruido oral ~15-30%',
    color: 'from-purple-600 to-indigo-500',
    iconName: 'Sparkles'
  },
  {
    id: 'formaliza',
    order: 4,
    title: 'Formaliza',
    subtitle: 'Estructuración Legal & Fe Pública',
    tagline: 'De la voz al documento oficial listo para protocolizar y firmar',
    description:
      'Inyección obligatoria de ortotipografía RAE (tildes diacríticas, apertura ¿ y ¡), estructuración formal del acta (Convocatoria, Asistentes, Acuerdos, Firmas) y sellado criptográfico.',
    highlights: [
      'Inyección automática de signos reglamentarios de apertura (¿ y ¡)',
      'Estructuración formal: Encabezado, Quórum, Orden del Día y Acuerdos',
      'Sello criptográfico de custodia con firma SHA-256 e ID único de sesión',
      'Exportación ejecutiva en Word (.docx), PDF / Impresión oficial y Markdown'
    ],
    metrics: 'Norma RAE + Sellado Criptográfico',
    color: 'from-emerald-600 to-teal-500',
    iconName: 'FileCheck2'
  }
];
