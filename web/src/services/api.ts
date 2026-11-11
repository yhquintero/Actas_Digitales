import { JobResponse } from '../types';

export class ApiService {
  private static getHeaders(apiKey?: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const key = apiKey || localStorage.getItem('actas_api_key') || '';
    if (key) {
      headers['X-API-Key'] = key;
    }
    return headers;
  }

  static async uploadAudio(
    file: File,
    language: string = 'es',
    clientTranscript?: string,
    apiKey?: string
  ): Promise<JobResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    if (clientTranscript && clientTranscript.trim()) {
      formData.append('client_transcription', clientTranscript.trim());
    }

    const headers = this.getHeaders(apiKey);

    const res = await fetch('/api/audio/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error en la subida del archivo' }));
      throw new Error(err.detail || 'Fallo al procesar el archivo en el servidor');
    }

    return await res.json();
  }

  static async listRecentJobs(limit: number = 25): Promise<JobResponse[]> {
    try {
      const res = await fetch(`/api/audio/jobs?limit=${limit}`);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      console.error('[ApiService] Error al listar trabajos recientes:', err);
      return [];
    }
  }

  static async getJobStatus(jobId: string): Promise<JobResponse> {
    const res = await fetch(`/api/audio/jobs/${jobId}`);
    if (!res.ok) {
      throw new Error(`Trabajo ${jobId} no encontrado o error en servidor`);
    }
    return await res.json();
  }

  static subscribeToJobStream(
    jobId: string,
    onUpdate: (job: JobResponse) => void,
    onComplete: (job: JobResponse) => void,
    onError: (err: any) => void
  ): () => void {
    const eventSource = new EventSource(`/api/audio/jobs/${jobId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const job: JobResponse = JSON.parse(event.data);
        onUpdate(job);
        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          eventSource.close();
          onComplete(job);
        }
      } catch (e) {
        console.error('[ApiService] Error deserializando evento SSE:', e);
      }
    };

    eventSource.onerror = (e) => {
      console.warn('[ApiService] Conexión SSE cerrada o con aviso, iniciando fallback polling...');
      eventSource.close();
      onError(e);
    };

    return () => {
      eventSource.close();
    };
  }

  static async testTextPipeline(rawText: string, apiKey?: string): Promise<any> {
    const formData = new FormData();
    formData.append('raw_text', rawText);
    const headers = this.getHeaders(apiKey);

    const res = await fetch('/api/audio/test-text-pipeline', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Error al ejecutar consolidación y corrección directa');
    }

    return await res.json();
  }

  static async checkHealth(): Promise<{ status: string; service: string; version: string }> {
    const res = await fetch('/api/health');
    return await res.json();
  }
}
