/**
 * Provider React Query pour toute l'application
 *
 * Fournit QueryClient et QueryClientProvider pour tous les hooks
 * Initialise également les messages d'erreur Zod en français
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { initZodErrorMessages } from "@/lib/validations/zod-error-map";

// Initialiser Zod une seule fois au chargement du module
let zodInitialized = false;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (anciennement cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Initialiser les messages d'erreur Zod en français
  useEffect(() => {
    if (!zodInitialized) {
      initZodErrorMessages();
      zodInitialized = true;
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

