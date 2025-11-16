import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

export interface SignUpData {
  email: string;
  password: string;
  role: UserRole;
  prenom: string;
  nom: string;
  telephone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  private supabase = createClient();

  async signUp(data: SignUpData) {
    // Créer l'utilisateur
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed");

    // Mettre à jour le profil avec le rôle uniquement
    // Les autres champs (prenom, nom) seront complétés plus tard dans l'onboarding
    const updateData: any = {
      role: data.role,
    };

    // Ne mettre à jour prenom et nom que s'ils sont fournis et non vides
    if (data.prenom && data.prenom.trim()) {
      updateData.prenom = data.prenom;
    }
    if (data.nom && data.nom.trim()) {
      updateData.nom = data.nom;
    }
    if (data.telephone && data.telephone.trim()) {
      updateData.telephone = data.telephone;
    }

    const { error: profileError } = await (this.supabase
      .from("profiles") as any)
      .update(updateData)
      .eq("user_id", authData.user.id as any);

    if (profileError) throw profileError;

    return authData;
  }

  async signIn(data: SignInData) {
    const { data: authData, error } = await this.supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;
    return authData;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async sendMagicLink(email: string) {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  }

  async resendConfirmationEmail(email: string) {
    // Cette méthode peut fonctionner sans session active
    // On utilise directement l'email fourni
    const { error } = await this.supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      // Si erreur liée à la session, on peut quand même essayer
      // car resend peut fonctionner sans session si l'email est fourni
      if (
        error.message?.includes("session") ||
        error.message?.includes("Auth session missing")
      ) {
        // Créer un nouveau client pour forcer l'envoi sans session
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { error: retryError } = await supabase.auth.resend({
          type: "signup",
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (retryError) throw retryError;
      } else {
        throw error;
      }
    }
  }

  async getUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async getProfile() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id as any)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return profile;
  }
}

export const authService = new AuthService();

