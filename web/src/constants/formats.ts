import { AudioFormatInfo } from '../types';

export const SUPPORTED_AUDIO_FORMATS: AudioFormatInfo[] = [
  {
    extension: '.mp3',
    codec: 'MPEG-1 Audio Layer III',
    container: 'MP3 Audio Stream',
    recommendedUse: 'Grabaciones generales, asambleas, alta compatibilidad',
    decoder: 'PyAV / Miniaudio / FFmpeg'
  },
  {
    extension: '.wav',
    codec: 'PCM Lineal 16-bit / 24-bit',
    container: 'RIFF WAVE',
    recommendedUse: 'Audio de estudio sin compresión, máxima fidelidad fonética',
    decoder: 'Nativo Python wave / PyAV'
  },
  {
    extension: '.m4a',
    codec: 'AAC-LC / ALAC Apple Lossless',
    container: 'MPEG-4 Part 14',
    recommendedUse: 'Notas de voz de iPhone, iPad y dictáfonos digitales modernos',
    decoder: 'PyAV en memoria / FFmpeg'
  },
  {
    extension: '.aac',
    codec: 'Advanced Audio Coding',
    container: 'ADTS Raw Stream',
    recommendedUse: 'Sistemas de videoconferencia, streaming de salas de juntas',
    decoder: 'PyAV / FFmpeg'
  },
  {
    extension: '.ogg',
    codec: 'Vorbis / Opus',
    container: 'Ogg Container',
    recommendedUse: 'Grabaciones abiertas, Linux y navegadores web',
    decoder: 'PyAV / Miniaudio'
  },
  {
    extension: '.webm',
    codec: 'Opus 48 kHz / Vorbis',
    container: 'WebM / Matroska',
    recommendedUse: 'Grabación directa de navegador Web y WebRTC en tiempo real',
    decoder: 'PyAV / FFmpeg'
  },
  {
    extension: '.flac',
    codec: 'Free Lossless Audio Codec',
    container: 'FLAC Stream',
    recommendedUse: 'Archivado legal sin pérdida de calidad acústica',
    decoder: 'PyAV / Miniaudio'
  },
  {
    extension: '.opus',
    codec: 'IETF Opus Interactive Audio',
    container: 'Ogg / Matroska Opus',
    recommendedUse: 'Telefonía IP, VoIP, WhatsApp audio y mensajería',
    decoder: 'PyAV / FFmpeg'
  },
  {
    extension: '.wma',
    codec: 'Windows Media Audio',
    container: 'ASF Container',
    recommendedUse: 'Grabadoras de voz de Windows y dictáfonos Olympus / Philips',
    decoder: 'PyAV / FFmpeg'
  },
  {
    extension: '.mp4',
    codec: 'AAC / PCM / AC3 Audio Track',
    container: 'MPEG-4 Part 14 Video/Audio',
    recommendedUse: 'Grabaciones de vídeo de Zoom, Teams, Meet o cámaras de sala',
    decoder: 'PyAV (extracción directa de pista de audio)'
  }
];

export const ALLOWED_EXTENSIONS_STRING = SUPPORTED_AUDIO_FORMATS.map(f => f.extension).join(',');
export const ALLOWED_EXTENSIONS_LIST = SUPPORTED_AUDIO_FORMATS.map(f => f.extension);
