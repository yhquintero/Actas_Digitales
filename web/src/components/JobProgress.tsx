import React from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { JobResponse, JobStatus } from '../types';

interface JobProgressProps {
  job: JobResponse;
}

export const JobProgress: React.FC<JobProgressProps> = ({ job }) => {
  const steps = [
    { key: 'QUEUED', label: '1. Ingesta y Subida', desc: 'Validación del binario y encolado seguro' },
    { key: 'PREPROCESSING', label: '2. Preproceso & VAD', desc: 'Normalización de audio y corte por silencios' },
    { key: 'TRANSCRIBING', label: '3. Transcripción STT', desc: 'Extracción fonética de texto en español' },
    { key: 'CONSOLIDATING', label: '4. Consolidación', desc: 'Unión de fragmentos y eliminación de muletillas' },
    { key: 'CORRECTING', label: '5. Corrección Ortotipográfica', desc: 'Reglas de ortografía, tildes y signos ¿ ¡' },
  ];

  const getStepStatus = (stepKey: string, currentStatus: JobStatus) => {
    const order = ['QUEUED', 'PREPROCESSING', 'TRANSCRIBING', 'CONSOLIDATING', 'CORRECTING', 'COMPLETED'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (currentStatus === 'FAILED') return 'error';
    if (currentIndex > stepIndex || currentStatus === 'COMPLETED') return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase text-indigo-600 tracking-wider">
            Pipeline de Procesamiento en Curso
          </span>
          <h3 className="text-base font-bold text-slate-800">
            {job.filename} ({(job.file_size_bytes / 1024).toFixed(1)} KB)
          </h3>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold font-mono text-indigo-600">{job.progress_percent}%</span>
          <p className="text-xs text-slate-500">ID: {job.job_id.slice(0, 8)}...</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
            job.status === 'FAILED' ? 'bg-rose-500' : 'bg-indigo-600'
          }`}
          style={{ width: `${job.progress_percent}%` }}
        ></div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {steps.map((s) => {
          const status = getStepStatus(s.key, job.status);
          return (
            <div
              key={s.key}
              className={`p-3 rounded-xl border transition-all ${
                status === 'completed'
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                  : status === 'current'
                  ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-sm'
                  : status === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50/50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                {status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : status === 'current' ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" />
                ) : status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
                <span className="text-xs font-bold leading-tight">{s.label}</span>
              </div>
              <p className="text-[11px] leading-snug opacity-80 pl-6">{s.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>{job.current_step}</span>
        </span>
        {job.error_message && (
          <span className="text-rose-600 font-medium">{job.error_message}</span>
        )}
      </div>
    </div>
  );
};
