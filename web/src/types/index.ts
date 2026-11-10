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
