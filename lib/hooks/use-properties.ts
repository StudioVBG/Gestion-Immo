/**
 * Hook React Query pour les propriétés
 * 
 * Utilise les types Database générés depuis Supabase
 * pour une connexion type-safe BDD → Frontend
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PropertyRow, PropertyInsert, PropertyUpdate } from "@/lib/supabase/typed-client";
import { useAuth } from "@/lib/hooks/use-auth";
import { apiClient } from "@/lib/api-client";

/**
 * Hook pour récupérer toutes les propriétés de l'utilisateur
 */
export function useProperties() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ["properties", profile?.id],
    queryFn: async () => {
      if (!profile) throw new Error("Non authentifié");
      
      console.log("[useProperties] Fetching properties for profile:", profile.id);
      
      try {
        // Utiliser l'API route au lieu d'appeler directement Supabase
        const response = await apiClient.get<{ properties: PropertyRow[] }>("/properties");
        
        console.log("[useProperties] API response:", {
          responseType: typeof response,
          isArray: Array.isArray(response),
          hasProperties: !!(response as any).properties,
          responseKeys: Object.keys(response || {}),
          count: Array.isArray(response) ? response.length : (response as any).properties?.length || 0,
          fullResponse: response,
        });
        
        // Gérer différents formats de réponse
        if (Array.isArray(response)) {
          // Si la réponse est directement un tableau
          return response;
        } else if ((response as any).properties) {
          // Si la réponse contient une propriété properties
          return (response as any).properties || [];
        } else {
          // Format inattendu, logger et retourner un tableau vide
          console.warn("[useProperties] Unexpected response format:", response);
          return [];
        }
      } catch (error: any) {
        console.error("[useProperties] Error fetching properties:", error);
        console.error("[useProperties] Error details:", {
          message: error.message,
          status: error.status,
          response: error.response,
        });
        throw error;
      }
    },
    enabled: !!profile,
    retry: 1,
  });
}

/**
 * Hook pour récupérer une propriété par ID
 */
export function useProperty(propertyId: string | null) {
  return useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      if (!propertyId) throw new Error("Property ID requis");
      
      // Utiliser l'API route au lieu d'appeler directement Supabase
      const response = await apiClient.get<PropertyRow>(`/properties/${propertyId}`);
      return response;
    },
    enabled: !!propertyId,
  });
}

/**
 * Hook pour créer une propriété
 */
export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return useMutation({
    mutationFn: async (data: PropertyInsert) => {
      if (!profile) throw new Error("Non authentifié");
      
      // Utiliser l'API route au lieu d'appeler directement Supabase
      const response = await apiClient.post<PropertyRow>("/properties", {
        ...data,
        owner_id: profile.id,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

/**
 * Hook pour mettre à jour une propriété
 */
export function useUpdateProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PropertyUpdate }) => {
      // Utiliser l'API route au lieu d'appeler directement Supabase
      const response = await apiClient.patch<PropertyRow>(`/properties/${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property", variables.id] });
    },
  });
}

/**
 * Hook pour supprimer une propriété
 */
export function useDeleteProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Utiliser l'API route au lieu d'appeler directement Supabase
      await apiClient.delete(`/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

