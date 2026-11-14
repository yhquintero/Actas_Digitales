import { JobResponse, AndroidAppInfo, SyncedActasResponse, SyncedActaSearchResponse } from '../types';

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

  /**
   * Token de sincronización del servidor (ACTAS_SYNC_TOKEN). Se guarda SOLO en
   * sessionStorage (muere con la pestaña); nunca en localStorage ni en la build.
   * Sin token, el servidor responde 401/503 y la UI ofrece un campo para introducirlo.
   */
  static getSyncToken(): string {
    return sessionStorage.getItem('actas_sync_token') || '';
  }

  static setSyncToken(token: string): void {
    if (token.trim()) sessionStorage.setItem('actas_sync_token', token.trim());
    else sessionStorage.removeItem('actas_sync_token');
  }

  private static syncHeaders(): Record<string, string> {
    const token = this.getSyncToken();
    return token ? { 'X-Sync-Token': token } : {};
  }

  /** Código HTTP crudo para distinguir 401/503 del resto de fallos. */
  static async listSyncedActasRaw(limit: number = 10): Promise<{ status: number; data: SyncedActasResponse | null }> {
    try {
      const res = await fetch(`/api/acts?limit=${limit}`, { headers: this.syncHeaders() });
      if (res.ok) return { status: res.status, data: (await res.json()) as SyncedActasResponse };
      return { status: res.status, data: null };
    } catch (err) {
      console.error('[ApiService] Error al listar actas sincronizadas:', err);
      return { status: 0, data: null };
    }
  }

  static async listSyncedActas(limit: number = 10): Promise<SyncedActasResponse> {
    const { data } = await this.listSyncedActasRaw(limit);
    return data ?? { total: 0, acts: [] };
  }

  static async searchSyncedActas(query: string, limit: number = 20): Promise<SyncedActaSearchResponse> {
    const res = await fetch(`/api/acts/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: this.syncHeaders(),
    });
    if (!res.ok) {
      throw new Error(res.status === 401 ? 'Token de sincronización inválido.' : 'No se pudo buscar en el servidor.');
    }
    return (await res.json()) as SyncedActaSearchResponse;
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

  static async getAppInfo(): Promise<AndroidAppInfo> {
    const res = await fetch('/api/app/info');
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'La App no está disponible en el servidor' }));
      throw new Error(err.detail || 'La App no está disponible en el servidor');
    }
    return await res.json();
  }
}
