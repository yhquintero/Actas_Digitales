import React, { useState } from 'react';
import { History, CheckCircle2, Clock, AlertCircle, ChevronRight, Search } from 'lucide-react';
import { JobResponse } from '../types';

interface RecentJobsProps {
  jobs: JobResponse[];
  onSelectJob: (job: JobResponse) => void;
  selectedJobId?: string;
}

export const RecentJobs: React.FC<RecentJobsProps> = ({ jobs, onSelectJob, selectedJobId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (jobs.length === 0) {
    // Estado vacío útil en lugar de ocultar el panel por completo
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-6 shadow-sm text-center">
        <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Historial de Actas</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Aún no has procesado ninguna acta. Sube tu primer audio y aparecerá aquí.
        </p>
      </div>
    );
  }

  const filteredJobs = jobs.filter((j) =>
    j.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Historial de Actas</h3>
        </div>
        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono px-2 py-0.5 rounded-full">
          {jobs.length}
        </span>
      </div>

      {jobs.length > 3 && (
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredJobs.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-2">Sin coincidencias</p>
        ) : (
          filteredJobs.map((job) => {
            const isSelected = job.job_id === selectedJobId;
            return (
              <button
                key={job.job_id}
                onClick={() => onSelectJob(job)}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/70'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:dark:border-slate-600 hover:bg-slate-50 hover:dark:bg-slate-950'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  {job.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : job.status === 'FAILED' ? (
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{job.filename}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {new Date(job.created_at).toLocaleTimeString('es-ES')} · {(job.file_size_bytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    job.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 dark:text-emerald-300'
                      : job.status === 'FAILED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800 dark:text-amber-300'
                  }`}>
                    {job.status}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
