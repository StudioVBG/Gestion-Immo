/**
 * Hook React Query pour les baux
 * 
 * Utilise les types Database générés depuis Supabase
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { typedSupabaseClient } from "@/lib/supabase/typed-client";
import type { LeaseRow, LeaseInsert, LeaseUpdate } from "@/lib/supabase/typed-client";
import { useAuth } from "@/lib/hooks/use-auth";

/**
 * Hook pour récupérer tous les baux de l'utilisateur
 */
export function useLeases(propertyId?: string | null) {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ["leases", profile?.id, propertyId],
    queryFn: async () => {
      if (!profile) throw new Error("Non authentifié");
      
      let query = typedSupabaseClient
        .from("leases")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (propertyId) {
        query = query.eq("property_id", propertyId);
      }
      
      // Filtrer selon le rôle
      if (profile.role === "owner") {
        // Les propriétaires voient les baux de leurs propriétés
        const { data: properties } = await typedSupabaseClient
          .from("properties")
          .select("id")
          .eq("owner_id", profile.id);
        
        if (!properties || properties.length === 0) {
          return [];
        }
        
        const propertyIds = properties.map((p) => p.id);
        query = query.in("property_id", propertyIds);
      } else if (profile.role === "tenant") {
        // Les locataires voient leurs baux via lease_signers
        const { data: signers } = await typedSupabaseClient
          .from("lease_signers")
          .select("lease_id")
          .eq("profile_id", profile.id);
        
        if (!signers || signers.length === 0) {
          return [];
        }
        
        const leaseIds = signers.map((s) => s.lease_id);
        query = query.in("id", leaseIds);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as LeaseRow[];
    },
    enabled: !!profile,
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
      
      const { data, error } = await typedSupabaseClient
        .from("leases")
        .select("*")
        .eq("id", leaseId)
        .single();
      
      if (error) throw error;
      return data as LeaseRow;
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
      const { data: lease, error } = await typedSupabaseClient
        .from("leases")
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return lease as LeaseRow;
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
      const { data: lease, error } = await typedSupabaseClient
        .from("leases")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return lease as LeaseRow;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["lease", variables.id] });
    },
  });
}

