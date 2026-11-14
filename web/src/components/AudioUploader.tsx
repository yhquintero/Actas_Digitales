import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, Files, Trash2, CheckCircle2, ShieldCheck, Zap, Film, Loader2, Download, Mic2 } from 'lucide-react';
import { SUPPORTED_AUDIO_FORMATS, ALLOWED_EXTENSIONS_LIST } from '../constants/formats';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.avi', '.m4v', '.ts', '.flv', '.wmv', '.webm'];
const isVideoFile = (file: File) =>
  VIDEO_EXTENSIONS.includes('.' + (file.name.split('.').pop() || '').toLowerCase());

interface ExtractedTrack {
  track_index: number;
  codec?: string | null;
  channels?: number | null;
  sample_rate?: number | null;
  language?: string | null;
  title?: string | null;
  duration_seconds?: number | null;
  ok?: boolean;
  error?: string | null;
  sha256?: string | null;
  size_bytes?: number;
  output_format?: string | null;
  download_url?: string | null;
}

interface ExtractionResult {
  extraction_id: string;
  source_filename: string;
  source_sha256: string;
  source_duration_seconds?: number | null;
  num_tracks: number;
  tracks: ExtractedTrack[];
}

interface AudioUploaderProps {
  onFileSelected: (file: File) => void;
  onFilesSelected?: (files: File[]) => void;
  isLoading: boolean;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onFileSelected,
  onFilesSelected,
  isLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extracción inteligente de pistas (contenedores de vídeo multipista)
  const [extractingIdx, setExtractingIdx] = useState<number | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [sendingTrack, setSendingTrack] = useState<number | null>(null);

  const allowedExtensions = [
    ...ALLOWED_EXTENSIONS_LIST,
    '.oga', '.amr', '.3gp', '.m4p', '.caf'
  ];
  const MAX_SIZE_BYTES = 1024 * 1024 * 1024; // 1 GB exacto

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setError(null);
    const validList: File[] = [];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedExtensions.includes(ext)) {
        setError(`El archivo "${file.name}" tiene un formato no admitido (${ext}). Formatos compatibles: MP3, WAV, M4A, OGG, WEBM, FLAC, AAC, OPUS, WMA, MP4.`);
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setError(`El archivo "${file.name}" (${formatFileSize(file.size)}) supera el límite máximo permitido de 1 GB.`);
        return;
      }

      validList.push(file);
    }

    if (validList.length > 0) {
      setSelectedFiles(validList);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const handleRemoveFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
  };

  const handleExtractTracks = async (fileIdx: number) => {
    const file = selectedFiles[fileIdx];
    if (!file) return;
    setExtractingIdx(fileIdx);
    setExtractError(null);
    setExtraction(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/audio/extract', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { detail?: string }));
        throw new Error(body?.detail || `Error ${res.status} al extraer las pistas.`);
      }
      setExtraction(await res.json());
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'No se pudieron extraer las pistas.');
    } finally {
      setExtractingIdx(null);
    }
  };

  const handleTranscribeTrack = async (track: ExtractedTrack) => {
    if (!extraction || !track.download_url) return;
    setSendingTrack(track.track_index);
    try {
      const res = await fetch(track.download_url);
      if (!res.ok) throw new Error('La pista temporal expiró. Repite la extracción.');
      const blob = await res.blob();
      const base = extraction.source_filename.replace(/\.[^/.]+$/, '');
      const file = new File([blob], `${base}_pista_${track.track_index}.wav`, { type: 'audio/wav' });
      onFileSelected(file);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'No se pudo encolar la pista.');
    } finally {
      setSendingTrack(null);
    }
  };

  const handleSubmit = () => {
    if (selectedFiles.length === 0) return;

    if (onFilesSelected && selectedFiles.length > 1) {
      onFilesSelected(selectedFiles);
    } else if (onFileSelected) {
      onFileSelected(selectedFiles[0]);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 p-6 shadow-sm">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/70 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50/60 hover:dark:bg-slate-950/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".mp3,.wav,.m4a,.ogg,.webm,.flac,.aac,.opus,.wma,.mp4,.oga,.amr,.3gp,.m4p,.caf,.mov,.mkv,.avi,.m4v,.ts,.flv,.wmv"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-14 h-14 bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">
          Arrastra audios aquí o haz clic para examinar
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-lg mx-auto">
          Decodificación acústica universal para <span className="font-semibold text-slate-700 dark:text-slate-300">MP3, WAV, M4A, OGG, WebM, AAC, FLAC, OPUS, WMA, MP4, MOV, MKV, AVI…</span> en español. Los vídeos con varias pistas de audio se procesan seleccionando la pista.
        </p>

        {/* Formats Badges */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-md mx-auto mb-3">
          {SUPPORTED_AUDIO_FORMATS.map((fmt) => (
            <span
              key={fmt.extension}
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80"
              title={`${fmt.codec} (${fmt.recommendedUse})`}
            >
              {fmt.extension.toUpperCase()}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap text-[11px]">
          <span className="inline-flex items-center gap-1 font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-1 rounded-full border border-indigo-200/80 dark:border-indigo-800/80">
            <Zap className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Subidas hasta 1 GB / Archivo
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800/80">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Cifrado TLS 1.3 de extremo a extremo
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedFiles.length > 0 && !error && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium px-1">
            <span className="flex items-center gap-1.5">
              <Files className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                {selectedFiles.length} {selectedFiles.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'} (Total: {formatFileSize(totalBytes)})
              </span>
            </span>
            <span className="text-emerald-600 flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Límite 1 GB verificado
            </span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between hover:bg-slate-100/70 hover:dark:bg-slate-800/70 transition"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 font-bold text-xs font-mono">
                    {file.name.split('.').pop()?.toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleRemoveFile(idx, e)}
                  title="Quitar archivo"
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 rounded-lg transition hover:bg-white hover:dark:bg-slate-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Extracción inteligente (experimental): solo vídeos/contenedores */}
          {selectedFiles.some(isVideoFile) && (
            <div className="mt-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/50 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                    Extracción Inteligente de Pistas
                  </span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded-full font-mono font-bold">EXPERIMENTAL</span>
                </div>
                <span className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80">Vídeo con varias pistas (idioma, sala, interpretación)</span>
              </div>

              {selectedFiles.map((file, idx) => isVideoFile(file) ? (
                <div key={idx} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 rounded-xl px-3 py-2">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                  <button
                    onClick={() => handleExtractTracks(idx)}
                    disabled={extractingIdx !== null || isLoading}
                    className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white transition flex items-center gap-1.5"
                  >
                    {extractingIdx === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
                    {extractingIdx === idx ? 'Extrayendo…' : 'Inspeccionar pistas'}
                  </button>
                </div>
              ) : null)}

              {extractError && (
                <div className="flex items-start gap-2 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{extractError}</span>
                </div>
              )}

              {extraction && (
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1 px-1">
                    <span>SHA-256 origen: <span className="text-slate-700 dark:text-slate-200">{extraction.source_sha256.slice(0, 16)}…</span></span>
                    {extraction.source_duration_seconds != null && (
                      <span>Duración: <span className="text-slate-700 dark:text-slate-200">{extraction.source_duration_seconds.toFixed(1)}s</span></span>
                    )}
                    <span>Pistas: <span className="text-slate-700 dark:text-slate-200">{extraction.num_tracks}</span></span>
                  </div>
                  {extraction.tracks.map((track) => (
                    <div key={track.track_index} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[11px]">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          Pista {track.track_index} · {track.codec || 'códec desconocido'}{track.channels ? ` · ${track.channels}ch` : ''}{track.sample_rate ? ` @ ${track.sample_rate} Hz` : ''}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {track.language ? `idioma ${track.language} · ` : ''}{track.output_format || 'fallo de extracción'}{track.sha256 ? ` · sha256 ${track.sha256.slice(0, 12)}…` : ''}{track.error ? ` · ${track.error}` : ''}
                        </div>
                      </div>
                      {track.ok && track.download_url && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={track.download_url}
                            download
                            title="Descargar la pista en WAV 16 kHz mono"
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleTranscribeTrack(track)}
                            disabled={sendingTrack !== null || isLoading}
                            title="Transcribir únicamente esta pista de audio"
                            className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white font-bold text-[10px] transition"
                          >
                            {sendingTrack === track.track_index ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic2 className="w-3.5 h-3.5" />}
                            Transcribir
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-600 text-white font-medium text-sm rounded-xl transition shadow-md shadow-indigo-100 flex items-center space-x-2"
            >
              <span>
                {isLoading
                  ? 'Decodificando y subiendo...'
                  : selectedFiles.length > 1
                  ? `Transcribir ${selectedFiles.length} Archivos`
                  : 'Decodificar, Transcribir y Formalizar'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
