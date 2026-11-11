import { useState, useEffect, useCallback, useRef } from 'react';
import { JobResponse } from '../types';
import { ApiService } from '../services/api';

export function useAudioJob() {
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobResponse[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('actas_api_key') || '');

  const pollingIntervalRef = useRef<number | null>(null);
  const unsubscribeSseRef = useRef<(() => void) | null>(null);

  const updateApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('actas_api_key', newKey);
  };

  const loadRecentJobs = useCallback(async () => {
    const list = await ApiService.listRecentJobs(20);
    setRecentJobs(list);
  }, []);

  useEffect(() => {
    loadRecentJobs();
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (unsubscribeSseRef.current) unsubscribeSseRef.current();
    };
  }, [loadRecentJobs]);

  const pollJobStatus = useCallback((jobId: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = window.setInterval(async () => {
      try {
        const job = await ApiService.getJobStatus(jobId);
        setCurrentJob(job);
        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          loadRecentJobs();
        }
      } catch (err) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      }
    }, 1500);
  }, [loadRecentJobs]);

  const listenToJob = useCallback((jobId: string) => {
    if (unsubscribeSseRef.current) {
      unsubscribeSseRef.current();
    }

    const unsub = ApiService.subscribeToJobStream(
      jobId,
      (job) => {
        setCurrentJob(job);
      },
      () => {
        loadRecentJobs();
      },
      () => {
        // Fallback a polling si SSE falla
        pollJobStatus(jobId);
      }
    );

    unsubscribeSseRef.current = unsub;
  }, [loadRecentJobs, pollJobStatus]);

  const submitAudioFile = async (file: File, clientTranscript?: string) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const initialJob = await ApiService.uploadAudio(file, 'es', clientTranscript, apiKey);
      setCurrentJob(initialJob);
      listenToJob(initialJob.job_id);
      loadRecentJobs();
      return initialJob;
    } catch (err: any) {
      const msg = err.message || 'Error durante la subida y procesamiento del archivo';
      setUploadError(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const submitMultipleAudios = async (files: File[]) => {
    if (files.length === 0) return;
    for (const f of files) {
      await submitAudioFile(f);
    }
  };

  return {
    currentJob,
    setCurrentJob,
    recentJobs,
    isUploading,
    uploadError,
    apiKey,
    updateApiKey,
    submitAudioFile,
    submitMultipleAudios,
    loadRecentJobs,
  };
}
