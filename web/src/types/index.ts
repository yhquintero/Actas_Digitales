export type JobStatus = 
  | 'QUEUED' 
  | 'PREPROCESSING' 
  | 'TRANSCRIBING' 
  | 'CONSOLIDATING' 
  | 'CORRECTING' 
  | 'COMPLETED' 
  | 'FAILED';

export interface AudioSegment {
  id: number;
  start_time: number;
  end_time: number;
  text: string;
}

export interface CorrectionItem {
  original: string;
  corrected: string;
  type: string;
  explanation?: string;
}

export interface JobStats {
  original_words: number;
  final_words: number;
  removed_fillers: number;
  orthographic_corrections: number;
  processing_time_sec: number;
  audio_duration_sec: number;
  audio_duration_formatted?: string;
  reading_duration_sec?: number;
  reading_duration_formatted?: string;
  words_per_minute?: number;
  duration_coverage_percent?: number;
  acoustic_verification_status?: string;
  audio_sha256?: string;
}

export interface JobResponse {
  job_id: string;
  filename: string;
  file_size_bytes: number;
  status: JobStatus;
  progress_percent: number;
  current_step: string;
  language: string;
  created_at: string;
  updated_at: string;
  raw_transcription?: string;
  cleaned_transcription?: string;
  final_corrected_text?: string;
  segments: AudioSegment[];
  corrections_applied: CorrectionItem[];
  stats?: JobStats;
  error_message?: string;
}

export type PillarId = 'captura' | 'transcribe' | 'consolida' | 'formaliza';

export interface PillarStep {
  id: PillarId;
  order: number;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  highlights: string[];
  metrics: string;
  color: string;
  iconName: string;
}

export interface SecurityFeature {
  id: string;
  category: 'Cifrado & Transporte' | 'Integridad & Custodia' | 'Privacidad & Soberanía' | 'Defensa en Profundidad';
  title: string;
  status: 'Activo' | 'Recomendado' | 'Configurable';
  description: string;
  impact: string;
  technicalDetails: string;
}

export interface AudioFormatInfo {
  extension: string;
  codec: string;
  container: string;
  recommendedUse: string;
  decoder: string;
}

export interface AndroidAppInfo {
  available: boolean;
  name: string;
  package: string;
  version_name: string;
  version_code: number;
  min_sdk: number;
  target_sdk: number;
  requires_android: string;
  abi: string;
  signature: string;
  signature_schemes: string[];
  installable: boolean;
  artifact_kind: string;
  description: string;
  permissions: string[];
  filename: string;
  size_bytes: number;
  size_formatted: string;
  sha256: string;
  signed: boolean;
  source: string;
  download_url: string;
  release_url?: string;
  updated_at: string;
}

/** Acta generada en la app móvil (Room) y sincronizada con el servidor. */
export interface SyncedActa {
  audio_sha256: string;
  job_id: string | null;
  filename: string;
  final_text: string;
  raw_text: string | null;
  words_count: number;
  removed_fillers: number;
  orthographic_corrections: number;
  timestamp: number;
  synced_at?: string;
  source?: string;
}

export interface SyncedActasResponse {
  total: number;
  acts: SyncedActa[];
}
