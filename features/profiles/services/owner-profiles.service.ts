import { createClient } from "@/lib/supabase/client";
import { ownerProfileSchema } from "@/lib/validations";
import type { OwnerProfile, OwnerType } from "@/lib/types";

export interface CreateOwnerProfileData {
  type: OwnerType;
  siret?: string | null;
  tva?: string | null;
  iban?: string | null;
  adresse_facturation?: string | null;
}

export interface UpdateOwnerProfileData extends Partial<CreateOwnerProfileData> {}

export class OwnerProfilesService {
  private supabase = createClient();

  async getOwnerProfile(profileId: string) {
    const { data, error } = await this.supabase
      .from("owner_profiles")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    // Ignorer les erreurs courantes (profil non trouvé, RLS, format)
    if (error) {
      const ignorableErrors = ["PGRST116", "42501", "406"];
      const ignorableMessages = ["permission denied", "not acceptable", "row-level security"];
      
      const shouldIgnore = ignorableErrors.includes(error.code || "") || 
        ignorableMessages.some(msg => error.message?.toLowerCase().includes(msg));
      
      if (!shouldIgnore) {
        console.warn("[OwnerProfilesService] Error fetching owner profile:", error);
        throw error;
      }
    }
    return data as OwnerProfile | null;
  }

  async createOrUpdateOwnerProfile(profileId: string, data: CreateOwnerProfileData) {
    const validatedData = ownerProfileSchema.parse(data);

    // Vérifier si le profil existe déjà
    const existing = await this.getOwnerProfile(profileId);

    if (existing) {
      // Mettre à jour
      const { data: profile, error } = await this.supabase
        .from("owner_profiles")
        .update(validatedData)
        .eq("profile_id", profileId)
        .select()
        .single();

      if (error) throw error;
      return profile as OwnerProfile;
    } else {
      // Créer
      const { data: profile, error } = await this.supabase
        .from("owner_profiles")
        .insert({
          profile_id: profileId,
          ...validatedData,
        })
        .select()
        .single();

      if (error) throw error;
      return profile as OwnerProfile;
    }
  }
}

export const ownerProfilesService = new OwnerProfilesService();

