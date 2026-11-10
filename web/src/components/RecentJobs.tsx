import React from 'react';
import { History, CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { JobResponse } from '../types';

interface RecentJobsProps {
  jobs: JobResponse[];
  onSelectJob: (job: JobResponse) => void;
  selectedJobId?: string;
}

export const RecentJobs: React.FC<RecentJobsProps> = ({ jobs, onSelectJob, selectedJobId }) => {
  if (jobs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <History className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-800 text-sm">Historial Reciente de Actas</h3>
      </div>

      <div className="space-y-2">
        {jobs.map((job) => {
          const isSelected = job.job_id === selectedJobId;
          return (
            <button
              key={job.job_id}
              onClick={() => onSelectJob(job)}
              className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
                  <p className="text-xs font-semibold text-slate-800 truncate">{job.filename}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(job.created_at).toLocaleTimeString('es-ES')} · {(job.file_size_bytes / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  job.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : job.status === 'FAILED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {job.status}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
