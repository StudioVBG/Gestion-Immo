import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(new URL("/auth/signin?error=invalid_code", requestUrl.origin));
    }

    // Vérifier si l'email est confirmé
    if (data.user && !data.user.email_confirmed_at) {
      return NextResponse.redirect(new URL("/auth/verify-email", requestUrl.origin));
    }

    // Si l'email est confirmé, rediriger directement vers le dashboard
    // Le dashboard gérera l'affichage de la checklist si nécessaire
    if (data.user && data.user.email_confirmed_at) {
      // Récupérer le profil pour obtenir le rôle
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", data.user.id as any)
        .maybeSingle();

      // Pour les admins, rediriger directement vers le dashboard admin
      const profileData = profile as any;
      if (profileData?.role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", requestUrl.origin));
      }

      // Pour les autres, rediriger vers le dashboard qui gérera la checklist
      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    }
  }

  // Redirige vers le dashboard après authentification
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}

