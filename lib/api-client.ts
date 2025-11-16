/**
 * Client API unifié pour les appels aux routes API Next.js
 */

import { createClient } from "@/lib/supabase/client";

const API_BASE = '/api';

export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

export class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...options.headers,
    });

    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    const url = `${API_BASE}${endpoint}`;
    console.log(`[api-client] Request: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
      console.error(`[api-client] Error ${response.status}:`, error);
      if (response.status === 404) {
        const notFoundError = new ResourceNotFoundError(error.error || "Ressource introuvable");
        (notFoundError as any).statusCode = 404;
        throw notFoundError;
      }
      if (response.status === 400) {
        const badRequestError = new Error(error.error || "Données invalides");
        (badRequestError as any).statusCode = 400;
        throw badRequestError;
      }
      throw new Error(error.error || `Erreur ${response.status}`);
    }

    const data = await response.json();
    console.log(`[api-client] Response:`, { endpoint, status: response.status, dataCount: Array.isArray(data) ? data.length : data.properties?.length || 'N/A' });
    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Upload de fichier avec FormData
   */
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
      throw new Error(error.error || `Erreur ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();

