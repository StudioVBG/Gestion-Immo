/**
 * Script de diagnostic pour vérifier l'état d'un utilisateur
 * Usage: tsx scripts/check-user.ts <email>
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Charger les variables d'environnement
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkUser(email: string) {
  console.log(`\n🔍 Vérification du compte: ${email}\n`);

  try {
    // 1. Vérifier si l'utilisateur existe dans auth.users
    console.log("1️⃣ Vérification dans auth.users...");
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("❌ Erreur lors de la récupération des utilisateurs:", usersError);
      return;
    }

    const user = users.users.find((u) => u.email === email);

    if (!user) {
      console.log("❌ Utilisateur non trouvé dans auth.users");
      console.log("\n💡 Solutions possibles:");
      console.log("   - L'email est incorrect");
      console.log("   - Le compte n'a pas été créé");
      console.log("   - L'utilisateur a été supprimé");
      return;
    }

    console.log("✅ Utilisateur trouvé dans auth.users");
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email confirmé: ${user.email_confirmed_at ? "✅ Oui" : "❌ Non"}`);
    console.log(`   Créé le: ${user.created_at}`);
    console.log(`   Dernière connexion: ${user.last_sign_in_at || "Jamais"}`);

    // 2. Vérifier le profil
    console.log("\n2️⃣ Vérification du profil...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("❌ Erreur lors de la récupération du profil:", profileError);
      if (profileError.code === "PGRST116") {
        console.log("\n💡 Le profil n'existe pas. Il faut le créer.");
      }
      return;
    }

    console.log("✅ Profil trouvé");
    console.log(`   Rôle: ${profile.role}`);
    console.log(`   Prénom: ${profile.prenom || "Non renseigné"}`);
    console.log(`   Nom: ${profile.nom || "Non renseigné"}`);

    // 3. Vérifier le profil spécialisé (owner_profiles)
    if (profile.role === "owner") {
      console.log("\n3️⃣ Vérification du profil propriétaire...");
      const { data: ownerProfile, error: ownerError } = await supabase
        .from("owner_profiles")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      if (ownerError) {
        if (ownerError.code === "PGRST116") {
          console.log("⚠️  Profil propriétaire non créé (normal si onboarding non terminé)");
        } else {
          console.error("❌ Erreur:", ownerError);
        }
      } else {
        console.log("✅ Profil propriétaire trouvé");
        console.log(`   Type: ${ownerProfile.type}`);
      }
    }

    // 4. Vérifier si l'email est confirmé
    if (!user.email_confirmed_at) {
      console.log("\n❌ EMAIL NON CONFIRMÉ - C'est probablement la cause du problème !");
      console.log("\n💡 Solutions:");
      console.log("   1. Vérifier la boîte email pour le lien de confirmation");
      console.log("   2. Utiliser le bouton 'Renvoyer le lien' sur /auth/verify-email");
      console.log("   3. Confirmer manuellement l'email (voir ci-dessous)");
      
      // Proposer de confirmer l'email
      console.log("\n🔧 Confirmation automatique de l'email...");
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (updateError) {
        console.error("❌ Erreur lors de la confirmation:", updateError);
      } else {
        console.log("✅ Email confirmé avec succès !");
      }
    } else {
      console.log("\n✅ Email confirmé");
    }

    // 5. Vérifier les consentements
    console.log("\n5️⃣ Vérification des consentements...");
    const { data: consents, error: consentsError } = await supabase
      .from("user_consents")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (consentsError && consentsError.code !== "PGRST116") {
      console.error("❌ Erreur:", consentsError);
    } else if (consents) {
      console.log("✅ Consentements trouvés");
    } else {
      console.log("⚠️  Consentements non trouvés (normal si onboarding non terminé)");
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 RÉSUMÉ");
    console.log("=".repeat(60));
    console.log(`Email: ${user.email}`);
    console.log(`Email confirmé: ${user.email_confirmed_at ? "✅" : "❌"}`);
    console.log(`Profil: ${profile ? "✅" : "❌"}`);
    console.log(`Rôle: ${profile?.role || "N/A"}`);
    console.log("=".repeat(60));

    if (!user.email_confirmed_at) {
      console.log("\n💡 Si l'email n'a pas été confirmé automatiquement, exécutez:");
      console.log(`   UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '${email}';`);
    }

  } catch (error: any) {
    console.error("❌ Erreur inattendue:", error);
  }
}

// Récupérer l'email depuis les arguments
const email = process.argv[2] || "contact.explore.mq@gmail.com";

checkUser(email).then(() => {
  process.exit(0);
});

