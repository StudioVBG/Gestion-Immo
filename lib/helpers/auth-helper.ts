import { createClient, createClientFromRequest } from "@/lib/supabase/server";

/**
 * Helper pour récupérer l'utilisateur authentifié depuis les cookies ou le token Bearer
 */
export async function getAuthenticatedUser(request: Request) {
  // Utiliser createClientFromRequest pour les routes API afin d'avoir accès aux cookies de la requête
  const supabase = createClientFromRequest(request);
  
  const cookieHeader = request.headers.get("cookie");
  console.log("getAuthenticatedUser: Cookies header:", cookieHeader ? "présent" : "absent");
  if (cookieHeader) {
    // Extraire les noms des cookies pour le debug
    const cookieNames = cookieHeader.split(";").map(c => c.trim().split("=")[0]).filter(Boolean);
    console.log("getAuthenticatedUser: Cookie names:", cookieNames.join(", "));
  }
  
  // Essayer d'abord avec les cookies
  let { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error("getAuthenticatedUser: Error from getUser():", authError.message);
  }
  
  if (user) {
    console.log("getAuthenticatedUser: User found from cookies:", user.email, user.id);
  } else {
    console.log("getAuthenticatedUser: No user from cookies, trying Authorization header");
  }
  
  // Si pas d'utilisateur, essayer avec le token dans les headers
  if (!user) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log("getAuthenticatedUser: Trying with Bearer token");
      
      // Créer un nouveau client avec le token dans les headers
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const tokenClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      
      const { data: { user: userFromToken }, error: tokenError } = await tokenClient.auth.getUser();
      if (!tokenError && userFromToken) {
        console.log("getAuthenticatedUser: User found from Bearer token:", userFromToken.email);
        user = userFromToken;
        authError = null;
        // Utiliser le client avec token pour les requêtes suivantes
        return { user, error: null, supabase: tokenClient };
      } else if (tokenError) {
        console.error("getAuthenticatedUser: Error from getUser(token):", tokenError.message);
      }
    } else {
      console.log("getAuthenticatedUser: No Authorization header found");
    }
  }

  return { user, error: authError, supabase };
}

/**
 * Helper pour vérifier que l'utilisateur est admin
 */
export async function requireAdmin(request: Request) {
  const { user, error, supabase } = await getAuthenticatedUser(request);

  if (error) {
    console.error("requireAdmin: Auth error:", error);
    return {
      error: { message: "Erreur d'authentification", details: error.message, status: 401 },
      user: null,
      profile: null,
      supabase: null,
    };
  }

  if (!user) {
    console.warn("requireAdmin: No user found");
    const cookieHeader = request.headers.get("cookie");
    console.log("requireAdmin: Cookies present:", cookieHeader ? "yes" : "no");
    return {
      error: { message: "Non authentifié", status: 401 },
      user: null,
      profile: null,
      supabase: null,
    };
  }

  console.log("requireAdmin: User found:", user.id, user.email);

  // Vérifier que l'utilisateur est admin
  // Utiliser le service role pour éviter les problèmes RLS dans les routes API admin
  const { createClient } = await import("@supabase/supabase-js");
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Déclarer profileData en dehors du try pour qu'elle soit accessible après
  let profileData: any = null;

  try {
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("role, id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("requireAdmin: Error fetching profile:", profileError);
      console.error("requireAdmin: Profile error details:", JSON.stringify(profileError, null, 2));
      return {
        error: { message: "Erreur lors de la vérification du profil", status: 500 },
        user: null,
        profile: null,
        supabase: null,
      };
    }

    profileData = profile as any;
    console.log("requireAdmin: Profile role:", profileData?.role);

    if (!profileData || profileData?.role !== "admin") {
      console.warn(`requireAdmin: User ${user.email} is not admin (role: ${profileData?.role || "undefined"})`);
      return {
        error: { message: "Accès non autorisé", status: 403 },
        user: null,
        profile: null,
        supabase: null,
      };
    }
  } catch (error: any) {
    console.error("requireAdmin: Unexpected error:", error);
    console.error("requireAdmin: Error stack:", error.stack);
    return {
      error: { message: error.message || "Erreur inattendue lors de la vérification", status: 500 },
      user: null,
      profile: null,
      supabase: null,
    };
  }

  // Vérifier que profileData est bien défini avant de l'utiliser
  if (!profileData) {
    console.error("requireAdmin: profileData is null after try block");
    return {
      error: { message: "Erreur lors de la vérification du profil", status: 500 },
      user: null,
      profile: null,
      supabase: null,
    };
  }

  console.log("requireAdmin: Admin access granted for:", user.email);
  // Retourner le service client pour les requêtes suivantes (contourne RLS)
  return {
    error: null,
    user,
    profile: profileData,
    supabase: serviceClient as any,
  };
}

