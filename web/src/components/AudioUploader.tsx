import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, AlertCircle, Files, Trash2, CheckCircle2 } from 'lucide-react';

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

  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.flac', '.aac'];
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
        setError(`El archivo "${file.name}" tiene un formato no soportado (${ext}). Formatos admitidos: ${allowedExtensions.join(', ')}`);
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setError(`El archivo "${file.name}" (${formatFileSize(file.size)}) supera el límite máximo permitido de 1 GB (1024 MB).`);
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

  const handleSubmit = () => {
    if (selectedFiles.length === 0) return;

    if (onFilesSelected) {
      onFilesSelected(selectedFiles);
    } else if (onFileSelected) {
      onFileSelected(selectedFiles[0]);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".mp3,.wav,.m4a,.ogg,.webm,.flac,.aac"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="font-semibold text-slate-800 text-base mb-1">
          Arrastra uno o varios archivos de audio aquí o haz clic para examinar
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Admite MP3, WAV, M4A, OGG, WebM, AAC, FLAC en español · <span className="font-semibold text-indigo-600">Límite ampliado: hasta 1 GB por archivo</span>
        </p>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Subida múltiple o individual (hasta 1 GB)
          </span>
          <span className="inline-block text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Cifrado TLS 1.3 de extremo a extremo
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedFiles.length > 0 && !error && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
            <span className="flex items-center gap-1.5">
              <Files className="w-4 h-4 text-indigo-600" />
              <span>{selectedFiles.length} {selectedFiles.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'} (Total: {formatFileSize(totalBytes)})</span>
            </span>
            <span className="text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Límite 1 GB verificado
            </span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-100/70 transition"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <FileAudio className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleRemoveFile(idx, e)}
                  title="Quitar archivo"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition hover:bg-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-xl transition shadow-md shadow-indigo-100 flex items-center space-x-2"
            >
              <span>{isLoading ? 'Procesando subida...' : selectedFiles.length > 1 ? `Transcribir ${selectedFiles.length} Archivos (1 GB máx)` : 'Transcribir y Corregir (1 GB máx)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
