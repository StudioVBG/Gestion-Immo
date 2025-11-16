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

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
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

