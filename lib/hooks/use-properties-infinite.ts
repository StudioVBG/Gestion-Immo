/**
 * Hook React Query avec pagination infinie pour les propriétés
 * 
 * Utilise useInfiniteQuery pour charger les propriétés par pages
 * Optimisé pour de grandes listes
 */

"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { typedSupabaseClient } from "@/lib/supabase/typed-client";
import type { PropertyRow } from "@/lib/supabase/typed-client";
import { useAuth } from "@/lib/hooks/use-auth";

const ITEMS_PER_PAGE = 12;

export function usePropertiesInfinite() {
  const { profile } = useAuth();
  
  return useInfiniteQuery({
    queryKey: ["properties", "infinite", profile?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!profile) throw new Error("Non authentifié");
      
      let query = typedSupabaseClient
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + ITEMS_PER_PAGE - 1);
      
      // Filtrer selon le rôle
      if (profile.role === "owner") {
        query = query.eq("owner_id", profile.id);
      } else if (profile.role !== "admin") {
        // Les locataires voient les propriétés via leurs baux
        const { data: leases } = await typedSupabaseClient
          .from("lease_signers")
          .select("lease_id")
          .eq("profile_id", profile.id)
          .in("role", ["locataire_principal", "colocataire"]);
        
        if (!leases || leases.length === 0) {
          return { data: [], nextPage: null };
        }
        
        const leaseIds = leases.map((l) => l.lease_id);
        const { data: leasesData } = await typedSupabaseClient
          .from("leases")
          .select("property_id")
          .in("id", leaseIds)
          .eq("statut", "active");
        
        if (!leasesData || leasesData.length === 0) {
          return { data: [], nextPage: null };
        }
        
        const propertyIds = [...new Set(leasesData.map((l) => l.property_id).filter(Boolean))];
        query = query.in("id", propertyIds);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const properties = (data as PropertyRow[]) || [];
      const hasMore = properties.length === ITEMS_PER_PAGE;
      
      return {
        data: properties,
        nextPage: hasMore ? pageParam + ITEMS_PER_PAGE : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!profile,
    staleTime: 60 * 1000, // 1 minute
  });
}

