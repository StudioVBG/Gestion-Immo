#!/usr/bin/env npx ts-node
/**
 * Script pour compter le nombre de comptes créés dans la base de données
 * Exécution : npx ts-node scripts/count-accounts.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes :");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function countAccounts() {
  console.log("\n📊 Statistiques des comptes\n");
  console.log("=".repeat(50));

  // Compter le total des profils
  const { count: totalProfiles, error: totalError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (totalError) {
    console.error("❌ Erreur lors du comptage:", totalError.message);
    return;
  }

  console.log(`\n📈 Total des comptes : ${totalProfiles || 0}\n`);

  // Compter par rôle
  const roles = ["admin", "owner", "tenant", "provider"];
  
  console.log("Répartition par rôle :");
  console.log("-".repeat(30));

  for (const role of roles) {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", role);

    if (!error) {
      const emoji = role === "admin" ? "👑" : role === "owner" ? "🏠" : role === "tenant" ? "👤" : "🔧";
      const label = role === "admin" ? "Administrateurs" : role === "owner" ? "Propriétaires" : role === "tenant" ? "Locataires" : "Prestataires";
      console.log(`  ${emoji} ${label}: ${count || 0}`);
    }
  }

  // Compter les utilisateurs auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (!authError && authUsers) {
    console.log(`\n🔐 Utilisateurs auth.users : ${authUsers.users.length}`);
    
    // Compter les emails confirmés
    const confirmedCount = authUsers.users.filter(u => u.email_confirmed_at).length;
    console.log(`   ✅ Emails confirmés : ${confirmedCount}`);
    console.log(`   ⏳ En attente : ${authUsers.users.length - confirmedCount}`);
  }

  // Nouveaux comptes ce mois
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: newThisMonth, error: newError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());

  if (!newError) {
    console.log(`\n📅 Nouveaux ce mois-ci : ${newThisMonth || 0}`);
  }

  console.log("\n" + "=".repeat(50));
}

countAccounts()
  .then(() => {
    console.log("\n✅ Terminé\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  });

