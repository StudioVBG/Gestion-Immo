import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/supabase/database.types";

// Singleton pour éviter plusieurs instances GoTrueClient
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  // Réutiliser l'instance existante si elle existe
  if (supabaseClient) {
    return supabaseClient;
  }

  // Créer une nouvelle instance uniquement si elle n'existe pas
  supabaseClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseClient;
}

