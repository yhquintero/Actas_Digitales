import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Send, AlertCircle } from 'lucide-react';

interface AudioRecorderProps {
  onAudioRecorded: (file: File) => void;
  isLoading: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioRecorded, isLoading }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordDuration(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('No se pudo acceder al micrófono. Por favor verifica los permisos del navegador.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleReset = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordDuration(0);
  };

  const handleSend = () => {
    if (audioBlob) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File([audioBlob], `grabacion_${timestamp}.webm`, { type: 'audio/webm' });
      onAudioRecorded(file);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="text-center py-6">
        {/* Pulsing visualizer / mic icon */}
        <div className="relative inline-block mb-4">
          {isRecording && (
            <span className="absolute inset-0 rounded-full bg-rose-400 opacity-75 animate-ping"></span>
          )}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition shadow-lg ${
              isRecording
                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        <div className="mb-2">
          <span className="text-2xl font-mono font-bold text-slate-800">
            {formatTime(recordDuration)}
          </span>
        </div>

        <p className="text-sm font-medium text-slate-700">
          {isRecording ? 'Grabando audio... Habla claramente en español' : 'Pulsa el micrófono para comenzar a grabar'}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Captura directa de voz desde tu navegador con codificación WebM optimizada
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-sm mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {audioUrl && !isRecording && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase">Preescucha de grabación</span>
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Descartar y regrabar</span>
            </button>
          </div>

          <audio src={audioUrl} controls className="w-full h-10" />

          <button
            onClick={handleSend}
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-xl transition shadow-md shadow-indigo-100 flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? 'Iniciando proceso...' : 'Procesar esta Grabación'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
