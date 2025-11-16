#!/usr/bin/env tsx
/**
 * Script pour vérifier et corriger le profil prestataire d'un utilisateur
 * Usage: tsx scripts/check-provider-profile.ts <email>
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

async function checkProviderProfile(email: string) {
  console.log(`\n🔍 Vérification du profil prestataire pour: ${email}\n`);

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

    console.log(`✅ Profil trouvé: ${profile.id} (rôle: ${profile.role})`);

    if (profile.role !== "provider") {
      console.log(`⚠️  L'utilisateur n'a pas le rôle "provider" mais "${profile.role}"`);
    }

    // 3. Vérifier le provider_profiles
    const { data: providerProfile, error: providerError } = await supabase
      .from("provider_profiles")
      .select("*")
      .eq("profile_id", profile.id)
      .single();

    if (providerError) {
      if (providerError.code === "PGRST116") {
        console.log("⚠️  provider_profiles n'existe pas");
        console.log("💡 Création du provider_profiles avec statut 'pending'...");
        
        const { data: newProviderProfile, error: createError } = await supabase
          .from("provider_profiles")
          .insert({
            profile_id: profile.id,
            type_services: [],
            status: "pending",
          })
          .select()
          .single();

        if (createError) {
          console.error("❌ Erreur lors de la création:", createError);
          return;
        }

        console.log("✅ provider_profiles créé avec succès");
        console.log(`   Statut: ${newProviderProfile.status}`);
      } else {
        console.error("❌ Erreur:", providerError);
        return;
      }
    } else {
      console.log("✅ provider_profiles trouvé");
      console.log(`   Statut: ${providerProfile?.status || "non défini"}`);
      console.log(`   Services: ${(providerProfile?.type_services || []).length} service(s)`);
      
      // Vérifier si le statut est "pending"
      if (providerProfile?.status !== "pending") {
        console.log(`⚠️  Le statut n'est pas "pending" mais "${providerProfile?.status}"`);
        console.log("💡 Mise à jour du statut à 'pending'...");
        
        const { error: updateError } = await supabase
          .from("provider_profiles")
          .update({ status: "pending" })
          .eq("profile_id", profile.id);

        if (updateError) {
          console.error("❌ Erreur lors de la mise à jour:", updateError);
        } else {
          console.log("✅ Statut mis à jour à 'pending'");
        }
      }
    }

    console.log("\n✅ Vérification terminée\n");
  } catch (error: any) {
    console.error("❌ Erreur:", error);
  }
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx scripts/check-provider-profile.ts <email>");
  process.exit(1);
}

checkProviderProfile(email);





