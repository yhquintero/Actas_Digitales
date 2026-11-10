import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AudioUploader } from './components/AudioUploader';
import { AudioRecorder } from './components/AudioRecorder';
import { JobProgress } from './components/JobProgress';
import { ResultViewer } from './components/ResultViewer';
import { RecentJobs } from './components/RecentJobs';
import { PromoVideoModal } from './components/PromoVideoModal';
import { FuturisticControlPanel } from './components/FuturisticControlPanel';
import { JobResponse } from './types';
import { UploadCloud, Mic, Sparkles, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'record'>('upload');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('actas_api_key') || '');
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobResponse[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [testText, setTestText] = useState(
    'bueno pues este... yo-yo creo que vamos a a a revisar la sesion del dia de hoy. ¿habra alguna duda sobre el acta?'
  );
  const [isTestingText, setIsTestingText] = useState(false);

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('actas_api_key', newKey);
  };

  const loadRecentJobs = async () => {
    try {
      const res = await fetch('/api/audio/jobs');
      if (res.ok) {
        const data = await res.json();
        setRecentJobs(data);
      }
    } catch (err) {
      console.error('Error fetching recent jobs:', err);
    }
  };

  useEffect(() => {
    loadRecentJobs();
  }, []);

  const handleAudioSubmit = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', 'es');

      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const res = await fetch('/api/audio/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error en la subida del audio');
      }

      const initialJob: JobResponse = await res.json();
      setCurrentJob(initialJob);

      // Iniciar escucha SSE para seguimiento en tiempo real
      subscribeToJobStream(initialJob.job_id);
      loadRecentJobs();
    } catch (err: any) {
      alert(err.message || 'Error al procesar el audio');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultipleAudiosSubmit = async (files: File[]) => {
    if (files.length === 0) return;
    for (const f of files) {
      await handleAudioSubmit(f);
    }
  };

  const subscribeToJobStream = (jobId: string) => {
    const eventSource = new EventSource(`/api/audio/jobs/${jobId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const updatedJob: JobResponse = JSON.parse(event.data);
        setCurrentJob(updatedJob);

        if (updatedJob.status === 'COMPLETED' || updatedJob.status === 'FAILED') {
          eventSource.close();
          loadRecentJobs();
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Fallback a polling si SSE se desconecta
      pollJob(jobId);
    };
  };

  const pollJob = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/audio/jobs/${jobId}`);
        if (res.ok) {
          const job: JobResponse = await res.json();
          setCurrentJob(job);
          if (job.status === 'COMPLETED' || job.status === 'FAILED') {
            clearInterval(interval);
            loadRecentJobs();
          }
        }
      } catch (e) {
        clearInterval(interval);
      }
    }, 1500);
  };

  const handleTestTextPipeline = async () => {
    if (!testText.trim()) return;
    setIsTestingText(true);
    try {
      const formData = new FormData();
      formData.append('raw_text', testText);
      const headers: Record<string, string> = {};
      if (apiKey) headers['X-API-Key'] = apiKey;

      const res = await fetch('/api/audio/test-text-pipeline', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const fakeJob: JobResponse = {
          job_id: 'test-' + Date.now(),
          filename: 'Prueba_Texto_Directa.txt',
          file_size_bytes: testText.length,
          status: 'COMPLETED',
          progress_percent: 100,
          current_step: 'Texto corregido y consolidado con éxito',
          language: 'es',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          raw_transcription: data.raw_text,
          cleaned_transcription: data.cleaned_text,
          final_corrected_text: data.final_corrected_text,
          segments: [],
          corrections_applied: data.corrections || [],
          stats: {
            original_words: data.raw_text.split(/\s+/).length,
            final_words: data.final_corrected_text.split(/\s+/).length,
            removed_fillers: data.removed_fillers,
            orthographic_corrections: data.corrections?.length || 0,
            processing_time_sec: 0.15,
            audio_duration_sec: 12.0,
          },
        };
        setCurrentJob(fakeJob);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingText(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        onOpenPromoVideo={() => setIsPromoOpen(true)}
        onOpenControlPanel={() => setIsControlPanelOpen(true)}
      />
      <PromoVideoModal isOpen={isPromoOpen} onClose={() => setIsPromoOpen(false)} />
      <FuturisticControlPanel
        isOpen={isControlPanelOpen}
        onClose={() => setIsControlPanelOpen(false)}
        onOpenPromoVideo={() => setIsPromoOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero section */}
        <div className="mb-8 text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Transcripción y Corrección de Actas en Español
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Sube tu grabación de audio o graba desde el micrófono. El sistema transcribe fonéticamente,
            desduplica solapamientos, elimina muletillas y corrige la ortografía y puntuación oficial en español.
          </p>
        </div>

        {/* Current Job Progress */}
        {currentJob && currentJob.status !== 'COMPLETED' && (
          <JobProgress job={currentJob} />
        )}

        {/* Completed Job Result */}
        {currentJob && currentJob.status === 'COMPLETED' && (
          <ResultViewer job={currentJob} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Input Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Mode Selector */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveInputTab('upload')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition ${
                  activeInputTab === 'upload'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Subir Archivo de Audio</span>
              </button>

              <button
                onClick={() => setActiveInputTab('record')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition ${
                  activeInputTab === 'record'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Grabar desde Micrófono</span>
              </button>
            </div>

            {/* Selected Input Component */}
            {activeInputTab === 'upload' ? (
              <AudioUploader
                onFileSelected={handleAudioSubmit}
                onFilesSelected={handleMultipleAudiosSubmit}
                isLoading={isUploading}
              />
            ) : (
              <AudioRecorder onAudioRecorded={handleAudioSubmit} isLoading={isUploading} />
            )}

            {/* Quick Text Pipeline Tester */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Prueba Rápida del Algoritmo de Corrección y Limpieza
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Verifica de forma inmediata cómo el motor procesa muletillas, tartamudeos y ortografía en español sin necesidad de adjuntar audio:
              </p>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={3}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-3"
              />
              <button
                onClick={handleTestTextPipeline}
                disabled={isTestingText}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white text-xs font-medium rounded-xl transition flex items-center space-x-2 shadow-sm"
              >
                <span>{isTestingText ? 'Procesando...' : 'Ejecutar Consolidación y Corrección'}</span>
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RecentJobs
              jobs={recentJobs}
              onSelectJob={(j) => setCurrentJob(j)}
              selectedJobId={currentJob?.job_id}
            />

            {/* Architecture Highlights Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider block mb-2">
                Arquitectura de la Solución
              </span>
              <h4 className="font-bold text-base mb-3 text-white">Pipeline de Procesamiento</h4>
              <ul className="text-xs space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Web & Android:</strong> Subida directa por fragmentos con soporte para reconexión.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Servidor FastAPI:</strong> Workers en segundo plano con Redis/Celery.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>STT Forzado 'es':</strong> Whisper API o faster-whisper local.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Corrección Orotipográfica:</strong> Tildes, signos ¿ ¡ y concordancia.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>Actas Digitales · Arquitectura Full-Stack de Voz a Texto Corregido</p>
      </footer>
    </div>
  );
};
