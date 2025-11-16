"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import type { ProfileRow } from "@/lib/supabase/typed-client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<(Profile | ProfileRow) | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Récupère l'utilisateur actuel
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchProfile(user.id);
      } else {
        setLoading(false);
      }
    });

    // Écoute les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // Si erreur de récursion RLS, utiliser la route API en fallback
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.warn("RLS recursion detected, using API fallback");
          try {
            const response = await fetch("/api/me/profile", {
              credentials: "include",
            });
            if (response.ok) {
              const profile = await response.json();
              setProfile(profile as Profile);
              setLoading(false);
              return;
            }
          } catch (apiError) {
            console.error("Error fetching profile from API:", apiError);
          }
        }
        throw error;
      }
      setProfile(data as Profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
    refreshProfile,
  };
}

