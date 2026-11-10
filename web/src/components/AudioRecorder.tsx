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

  // Web Audio Analyser para visualizador de ondas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const drawVisualizer = (analyser: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight: number;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, '#4f46e5');
        grad.addColorStop(1, '#06b6d4');

        ctx.fillStyle = grad;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 2;
      }
    };

    draw();
  };

  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordDuration(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Configurar Analizador de Onda
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      drawVisualizer(analyser);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('No se pudo acceder al micrófono. Por favor verifica que estás accediendo mediante HTTPS y concede los permisos de audio.');
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

  const resetRecording = () => {
    setIsRecording(false);
    setRecordDuration(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setError(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSubmit = () => {
    if (!audioBlob) return;
    const file = new File([audioBlob], `grabacion_acta_${Date.now()}.webm`, {
      type: audioBlob.type || 'audio/webm',
    });
    onAudioRecorded(file);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50/70 border border-slate-200 rounded-2xl">
        <div className="relative mb-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            }`}
          >
            <Mic className="w-10 h-10" />
          </div>

          {isRecording && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
            </span>
          )}
        </div>

        {/* Timer display */}
        <div className="text-3xl font-mono font-bold text-slate-800 mb-2">
          {formatDuration(recordDuration)}
        </div>

        <p className="text-xs text-slate-500 mb-4 text-center font-medium">
          {isRecording
            ? 'Grabando audio en directo con cancelación de eco y 16 kHz...'
            : audioUrl
            ? 'Grabación capturada lista para transcribir y consolidar'
            : 'Haz clic en el botón para iniciar la grabación de la sesión'}
        </p>

        {/* Live Audio Visualizer Canvas */}
        {isRecording && (
          <div className="w-full max-w-xs mb-4">
            <canvas ref={canvasRef} width={280} height={40} className="w-full h-10 rounded-lg bg-slate-900 shadow-inner" />
          </div>
        )}

        {/* Control buttons */}
        <div className="flex items-center space-x-3">
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition shadow-md shadow-indigo-100 flex items-center space-x-2"
            >
              <Mic className="w-4 h-4" />
              <span>Comenzar Grabación</span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-xl transition shadow-md shadow-rose-100 flex items-center space-x-2"
            >
              <Square className="w-4 h-4" />
              <span>Detener Grabación</span>
            </button>
          )}

          {audioUrl && !isRecording && (
            <>
              <button
                onClick={resetRecording}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm rounded-xl transition flex items-center space-x-1.5"
                title="Descartar y volver a grabar"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Descartar</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium text-sm rounded-xl transition shadow-md shadow-emerald-100 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{isLoading ? 'Iniciando...' : 'Transcribir y Corregir'}</span>
              </button>
            </>
          )}
        </div>

        {audioUrl && !isRecording && (
          <div className="w-full max-w-md mt-6 pt-4 border-t border-slate-200">
            <audio src={audioUrl} controls className="w-full h-10" />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
