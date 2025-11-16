#!/usr/bin/env tsx
/**
 * Script pour vérifier et corriger le rôle admin d'un utilisateur
 * Usage: tsx scripts/check-admin-role.ts <email>
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkAdminRole(email: string) {
  console.log(`\n🔍 Vérification du rôle admin pour: ${email}\n`);

  try {
    // 1. Trouver l'utilisateur
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("❌ Erreur:", usersError);
      return;
    }

    const user = users.users.find((u) => u.email === email);
    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return;
    }

    console.log(`✅ Utilisateur trouvé: ${user.id}`);

    // 2. Vérifier le profil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.log("❌ Profil non trouvé");
      return;
    }

    console.log(`✅ Profil trouvé: ${profile.id}`);
    console.log(`   Rôle actuel: ${profile.role}`);

    if (profile.role === "admin") {
      console.log("✅ L'utilisateur a déjà le rôle admin");
      return;
    }

    // 3. Demander confirmation pour changer le rôle
    console.log(`\n⚠️  L'utilisateur n'a pas le rôle admin (rôle actuel: ${profile.role})`);
    console.log("💡 Pour changer le rôle en admin, exécutez:");
    console.log(`\n   UPDATE profiles SET role = 'admin' WHERE user_id = '${user.id}';\n`);

    // Optionnel : changer automatiquement
    const args = process.argv;
    if (args.includes("--set-admin")) {
      console.log("🔄 Changement du rôle en admin...");
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("❌ Erreur lors de la mise à jour:", updateError);
        return;
      }

      console.log("✅ Rôle changé en admin avec succès");
    }

    console.log("\n✅ Vérification terminée\n");
  } catch (error: any) {
    console.error("❌ Erreur:", error);
  }
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx scripts/check-admin-role.ts <email> [--set-admin]");
  console.error("\nExemples:");
  console.error("  tsx scripts/check-admin-role.ts admin@example.com");
  console.error("  tsx scripts/check-admin-role.ts admin@example.com --set-admin");
  process.exit(1);
}

checkAdminRole(email);





