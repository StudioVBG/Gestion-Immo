/**
 * Hook CSRF SOTA 2026
 *
 * Gère automatiquement les tokens CSRF côté client.
 * À utiliser avec le CsrfProvider dans le layout principal.
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface CsrfContextType {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
}

const CsrfContext = createContext<CsrfContextType>({
  token: null,
  isLoading: true,
  error: null,
  refreshToken: async () => {},
});

/**
 * Provider CSRF - À placer dans le layout principal
 */
export function CsrfProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/csrf", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Impossible d'obtenir le token CSRF");
      }

      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur CSRF");
      console.error("[CSRF] Erreur:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();

    // Rafraîchir le token toutes les 12 heures
    const interval = setInterval(fetchToken, 12 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchToken]);

  return (
    <CsrfContext.Provider
      value={{
        token,
        isLoading,
        error,
        refreshToken: fetchToken,
      }}
    >
      {children}
    </CsrfContext.Provider>
  );
}

/**
 * Hook pour obtenir le token CSRF
 */
export function useCsrf() {
  return useContext(CsrfContext);
}

/**
 * Hook pour créer un fetch sécurisé avec CSRF
 */
export function useSecureFetch() {
  const { token, isLoading } = useCsrf();

  const secureFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (isLoading) {
        // Attendre que le token soit chargé
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const headers = new Headers(options.headers);

      // Ajouter le token CSRF pour les requêtes non-GET
      if (token && !["GET", "HEAD", "OPTIONS"].includes(options.method?.toUpperCase() || "GET")) {
        headers.set("x-csrf-token", token);
      }

      return fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    },
    [token, isLoading]
  );

  return { secureFetch, isReady: !isLoading && !!token };
}

/**
 * Wrapper fetch global avec CSRF automatique
 * Utiliser pour remplacer fetch() dans toute l'application
 */
let globalCsrfToken: string | null = null;

export function setGlobalCsrfToken(token: string) {
  globalCsrfToken = token;
}

export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  // Ajouter le token CSRF pour les requêtes non-GET
  if (globalCsrfToken && !["GET", "HEAD", "OPTIONS"].includes(options.method?.toUpperCase() || "GET")) {
    headers.set("x-csrf-token", globalCsrfToken);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

/**
 * Initialise le token CSRF global au démarrage de l'app
 */
export async function initializeCsrf(): Promise<string | null> {
  try {
    const response = await fetch("/api/csrf", {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      globalCsrfToken = data.token;
      return data.token;
    }
  } catch (error) {
    console.error("[CSRF] Erreur initialisation:", error);
  }
  return null;
}
