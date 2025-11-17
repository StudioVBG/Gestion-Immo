/**
 * Hook React Query pour les baux
 * 
 * Utilise les types Database générés depuis Supabase
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LeaseRow, LeaseInsert, LeaseUpdate } from "@/lib/supabase/typed-client";
import { useAuth } from "@/lib/hooks/use-auth";
import { leasesService } from "@/features/leases/services/leases.service";

/**
 * Hook pour récupérer tous les baux de l'utilisateur
 */
export function useLeases(propertyId?: string | null) {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ["leases", profile?.id, propertyId],
    queryFn: async () => {
      if (!profile) throw new Error("Non authentifié");
      
      try {
        if (propertyId) {
          return await leasesService.getLeasesByProperty(propertyId);
        }
        
        // Filtrer selon le rôle
        if (profile.role === "owner") {
          return await leasesService.getLeasesByOwner(profile.id);
        } else if (profile.role === "tenant") {
          return await leasesService.getLeasesByTenant(profile.id);
        }
        
        // Par défaut, récupérer tous les baux (admin)
        return await leasesService.getLeases();
      } catch (error: any) {
        // Gérer les erreurs silencieusement pour éviter les erreurs 500 dans la console
        console.error("[useLeases] Error fetching leases:", error);
        return [];
      }
    },
    enabled: !!profile,
    retry: 1, // Ne réessayer qu'une fois en cas d'erreur
  });
}

/**
 * Hook pour récupérer un bail par ID
 */
export function useLease(leaseId: string | null) {
  return useQuery({
    queryKey: ["lease", leaseId],
    queryFn: async () => {
      if (!leaseId) throw new Error("Lease ID requis");
      return await leasesService.getLeaseById(leaseId);
    },
    enabled: !!leaseId,
  });
}

/**
 * Hook pour créer un bail
 */
export function useCreateLease() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LeaseInsert) => {
      return await leasesService.createLease(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
    },
  });
}

/**
 * Hook pour mettre à jour un bail
 */
export function useUpdateLease() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LeaseUpdate }) => {
      return await leasesService.updateLease(id, data as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["lease", variables.id] });
    },
  });
}

