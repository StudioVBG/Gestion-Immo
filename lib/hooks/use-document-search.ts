"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";

interface SearchResult {
  id: string;
  type: string;
  title: string | null;
  created_at: string;
  tenant_name?: string | null;
  property_address?: string | null;
  rank: number;
}

interface UseDocumentSearchOptions {
  initialQuery?: string;
  debounceMs?: number;
  minQueryLength?: number;
}

/**
 * Hook pour la recherche full-text de documents
 * Utilise l'index GIN PostgreSQL pour des recherches rapides
 */
export function useDocumentSearch(options: UseDocumentSearchOptions = {}) {
  const {
    initialQuery = "",
    debounceMs = 300,
    minQueryLength = 2,
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce la query
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    const timer = setTimeout(() => {
      setDebouncedQuery(newQuery);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [debounceMs]);

  // Requête de recherche
  const searchQuery = useQuery<{ results: SearchResult[] }>({
    queryKey: ["document-search", debouncedQuery, category],
    queryFn: async () => {
      if (debouncedQuery.length < minQueryLength) {
        return { results: [] };
      }

      const params = new URLSearchParams();
      params.set("q", debouncedQuery);
      if (category) {
        params.set("category", category);
      }

      const response = await fetch(`/api/documents/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la recherche");
      }

      return response.json();
    },
    enabled: debouncedQuery.length >= minQueryLength,
    staleTime: 30000, // 30 secondes
  });

  return {
    // État
    query,
    category,
    
    // Actions
    setQuery: updateQuery,
    setCategory,
    
    // Résultats
    results: searchQuery.data?.results || [],
    isSearching: searchQuery.isLoading,
    error: searchQuery.error,
    
    // État de recherche
    hasQuery: query.length >= minQueryLength,
    isEmpty: searchQuery.data?.results.length === 0 && !searchQuery.isLoading,
  };
}

export default useDocumentSearch;

