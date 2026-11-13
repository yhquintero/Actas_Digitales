import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/layout/Footer';
import { PillarsWorkflow } from './components/pillars/PillarsWorkflow';
import { SecurityCenterModal } from './components/security/SecurityCenterModal';
import { AudioUploader } from './components/AudioUploader';
import { AudioRecorder } from './components/AudioRecorder';
import { JobProgress } from './components/JobProgress';
import { ResultViewer } from './components/ResultViewer';
import { RecentJobs } from './components/RecentJobs';
import { PromoVideoModal } from './components/PromoVideoModal';
import { FuturisticControlPanel } from './components/FuturisticControlPanel';
import { DownloadApp } from './components/DownloadApp';
import { useAudioJob } from './hooks/useAudioJob';
import { ApiService } from './services/api';
import { JobResponse, PillarId } from './types';
import { UploadCloud, Mic, Sparkles, Shield, ArrowRight, AlertCircle, Smartphone } from 'lucide-react';

export const App: React.FC = () => {
  const {
    currentJob,
    setCurrentJob,
    recentJobs,
    isUploading,
    uploadError,
    apiKey,
    updateApiKey,
    submitAudioFile,
    submitMultipleAudios,
  } = useAudioJob();

  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'record'>('upload');
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  const [testText, setTestText] = useState(
    'bueno pues este... yo-yo creo que vamos a a a revisar la sesion del dia de hoy. ¿habra alguna duda sobre el acta?'
  );
  const [isTestingText, setIsTestingText] = useState(false);

  const getCurrentStage = (): PillarId | undefined => {
    if (!currentJob) return undefined;
    switch (currentJob.status) {
      case 'QUEUED':
      case 'PREPROCESSING':
        return 'captura';
      case 'TRANSCRIBING':
        return 'transcribe';
      case 'CONSOLIDATING':
        return 'consolida';
      case 'CORRECTING':
      case 'COMPLETED':
        return 'formaliza';
      default:
        return undefined;
    }
  };

  const handleTestTextPipeline = async () => {
    if (!testText.trim()) return;
    setIsTestingText(true);
    try {
      const data = await ApiService.testTextPipeline(testText, apiKey);
      const fakeJob: JobResponse = {
        job_id: 'test-' + Date.now(),
        filename: 'Prueba_Consolidacion_Directa.txt',
        file_size_bytes: testText.length,
        status: 'COMPLETED',
        progress_percent: 100,
        current_step: 'Texto consolidado y formalizado con ortotipografía oficial',
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
          audio_duration_formatted: '00:12',
          reading_duration_sec: 8.5,
          reading_duration_formatted: '00:08',
          words_per_minute: 120.0,
          duration_coverage_percent: 100.0,
          acoustic_verification_status: 'Verificación Inmediata RAE',
          audio_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        },
      };
      setCurrentJob(fakeJob);
    } catch (e) {
      console.error('[TestPipeline Error]', e);
    } finally {
      setIsTestingText(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar with Security Pill & Telemetry */}
      <Navbar
        apiKey={apiKey}
        onApiKeyChange={updateApiKey}
        onOpenPromoVideo={() => setIsPromoOpen(true)}
        onOpenControlPanel={() => setIsControlPanelOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
      />

      {/* Security Center Modal */}
      <SecurityCenterModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />

      {/* Promo Video Modal */}
      <PromoVideoModal
        isOpen={isPromoOpen}
        onClose={() => setIsPromoOpen(false)}
      />

      {/* Futuristic Telemetry Control Panel */}
      <FuturisticControlPanel
        isOpen={isControlPanelOpen}
        onClose={() => setIsControlPanelOpen(false)}
        onOpenPromoVideo={() => setIsPromoOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interactive 4 Pillars Architecture Component */}
        <PillarsWorkflow currentStage={getCurrentStage()} />

        {/* Current Job Progress Banner */}
        {uploadError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {currentJob && currentJob.status !== 'COMPLETED' && (
          <div className="mb-8 animate-fade-slide-up">
            <JobProgress job={currentJob} />
          </div>
        )}

        {/* Completed Job Result Viewer */}
        {currentJob && currentJob.status === 'COMPLETED' && (
          <div className="mb-8 animate-fade-zoom-in">
            <ResultViewer job={currentJob} />
          </div>
        )}

        {/* Ingestion & Workstation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Work Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Mode Selector (Upload vs Live Record) */}
            <div className="flex bg-slate-200/80 p-1.5 rounded-2xl shadow-inner border border-slate-300/50">
              <button
                onClick={() => setActiveInputTab('upload')}
                className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all duration-150 ${
                  activeInputTab === 'upload'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Ingesta de Archivos (1 GB máx)</span>
              </button>

              <button
                onClick={() => setActiveInputTab('record')}
                className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all duration-150 ${
                  activeInputTab === 'record'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Dictado / Grabación en Vivo</span>
              </button>
            </div>

            {/* Selected Input Tool */}
            {activeInputTab === 'upload' ? (
              <AudioUploader
                onFileSelected={submitAudioFile}
                onFilesSelected={submitMultipleAudios}
                isLoading={isUploading}
              />
            ) : (
              <AudioRecorder
                onAudioRecorded={submitAudioFile}
                isLoading={isUploading}
              />
            )}

            {/* Quick Text Pipeline Tester */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Consola de Verificación Lingüística Inmediata
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  Ortotipografía RAE
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Comprueba al instante cómo el motor suprime vacilaciones orales, tartamudeos e inyecta signos ¿ y ¡ reglamentarios sin requerir archivo de audio:
              </p>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={3}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none mb-3 transition"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {testText.length} caracteres
                </span>
                <button
                  onClick={handleTestTextPipeline}
                  disabled={isTestingText}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold rounded-xl transition flex items-center space-x-2 shadow-sm"
                >
                  <span>{isTestingText ? 'Consolidando...' : 'Ejecutar Consolidación y Corrección'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Recent Jobs History */}
            <RecentJobs
              jobs={recentJobs}
              onSelectJob={(j) => setCurrentJob(j)}
              selectedJobId={currentJob?.job_id}
            />

            {/* Download Android App Banner Card */}
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-emerald-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> App Móvil
                </span>
                <span className="text-[10px] font-mono text-emerald-300">APK · Android 7+</span>
              </div>

              <h4 className="font-extrabold text-base text-white">
                Descarga Actas Digitales para Android
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                Instala el APK firmado directamente desde este servidor. Subida en segundo plano, reanudación automática y custodia SHA-256.
              </p>

              <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between">
                <a
                  href="#descarga-app"
                  className="text-xs text-emerald-300 hover:text-white font-medium flex items-center gap-1 transition"
                >
                  <span>Descargar o escanear QR</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Security Banner Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-950 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Blindaje Activo
                </span>
                <span className="text-[10px] font-mono text-cyan-300">TLS 1.3 SAN</span>
              </div>

              <h4 className="font-extrabold text-base text-white">
                Cadena de Custodia & Soberanía de Datos
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                Toda deliberación se procesa localmente con aislamiento de memoria. Cada acta genera un hash inmutable SHA-256 para auditoría y fe pública.
              </p>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setIsSecurityOpen(true)}
                  className="text-xs text-cyan-300 hover:text-white font-medium flex items-center gap-1 transition"
                >
                  <span>Ver Especificación de Seguridad</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Descarga de la App Android directamente desde la Web */}
        <DownloadApp />
      </main>

      {/* Formal Footer */}
      <Footer
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenControlPanel={() => setIsControlPanelOpen(true)}
      />
    </div>
  );
};
