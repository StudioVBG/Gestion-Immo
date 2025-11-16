"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile, OwnerProfile, TenantProfile, ProviderProfile } from "@/lib/types";
import { useAuth } from "./use-auth";

export function useProfile() {
  const { user, profile: authProfile } = useAuth();
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!authProfile) {
      setLoading(false);
      return;
    }

    fetchSpecializedProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authProfile]);

  async function fetchSpecializedProfile() {
    if (!authProfile) return;

    try {
      switch (authProfile.role) {
        case "owner": {
          const { data, error } = await supabase
            .from("owner_profiles")
            .select("*")
            .eq("profile_id", authProfile.id)
            .single();

          // Ignorer les erreurs si le profil n'existe pas encore ou si accès refusé
          if (error) {
            // PGRST116 = no rows returned (normal si pas encore créé)
            // 42501 = permission denied (RLS)
            // 406 = Not Acceptable (peut arriver avec certains formats)
            if (error.code !== "PGRST116" && error.code !== "42501" && !error.message?.includes("permission denied")) {
              console.warn("Error fetching owner profile:", error);
            }
            setOwnerProfile(null);
          } else {
            setOwnerProfile(data as OwnerProfile | null);
          }
          break;
        }
        case "tenant": {
          const { data, error } = await supabase
            .from("tenant_profiles")
            .select("*")
            .eq("profile_id", authProfile.id)
            .single();

          if (error) {
            if (error.code !== "PGRST116" && error.code !== "42501" && !error.message?.includes("permission denied")) {
              console.warn("Error fetching tenant profile:", error);
            }
            setTenantProfile(null);
          } else {
            setTenantProfile(data as TenantProfile | null);
          }
          break;
        }
        case "provider": {
          const { data, error } = await supabase
            .from("provider_profiles")
            .select("*")
            .eq("profile_id", authProfile.id)
            .single();

          if (error) {
            if (error.code !== "PGRST116" && error.code !== "42501" && !error.message?.includes("permission denied")) {
              console.warn("Error fetching provider profile:", error);
            }
            setProviderProfile(null);
          } else {
            setProviderProfile(data as ProviderProfile | null);
          }
          break;
        }
      }
    } catch (error) {
      // Ignorer silencieusement les erreurs de profil spécialisé
      // C'est normal si le profil n'a pas encore été complété
      console.debug("Specialized profile not available yet:", error);
    } finally {
      setLoading(false);
    }
  }

  return {
    profile: authProfile,
    ownerProfile,
    tenantProfile,
    providerProfile,
    loading,
  };
}

