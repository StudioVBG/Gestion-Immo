#!/usr/bin/env npx tsx
/**
 * Script pour appliquer la migration des champs du bail
 * Exécution : npx tsx scripts/apply-lease-fields-migration.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const statements = [
  `ALTER TABLE leases ADD COLUMN IF NOT EXISTS charges_type TEXT DEFAULT 'forfait' CHECK (charges_type IN ('forfait', 'provisions'))`,
  `ALTER TABLE leases ADD COLUMN IF NOT EXISTS mode_paiement TEXT DEFAULT 'virement' CHECK (mode_paiement IN ('virement', 'prelevement', 'cheque', 'especes'))`,
  `ALTER TABLE leases ADD COLUMN IF NOT EXISTS jour_paiement INTEGER DEFAULT 5 CHECK (jour_paiement >= 1 AND jour_paiement <= 28)`,
  `ALTER TABLE leases ADD COLUMN IF NOT EXISTS revision_autorisee BOOLEAN DEFAULT true`,
  `ALTER TABLE leases ADD COLUMN IF NOT EXISTS clauses_particulieres TEXT`,
];

async function executeSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Utiliser l'API REST de Supabase pour exécuter du SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey!,
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (response.ok) {
      return { success: true };
    }

    const errorText = await response.text();
    
    // Si la fonction exec_sql n'existe pas, utiliser une autre méthode
    if (errorText.includes("function") && errorText.includes("does not exist")) {
      // Essayer via l'API de gestion Supabase
      return await executeSQLViaManagement(sql);
    }
    
    // Si la colonne existe déjà, c'est OK
    if (errorText.includes("already exists")) {
      return { success: true };
    }

    return { success: false, error: errorText };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function executeSQLViaManagement(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extraire le project ref de l'URL
    const projectRef = supabaseUrl!.match(/https:\/\/([^.]+)/)?.[1];
    if (!projectRef) {
      return { success: false, error: "Impossible d'extraire le project ref" };
    }

    // Utiliser l'API de management
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (response.ok) {
      return { success: true };
    }

    const errorText = await response.text();
    if (errorText.includes("already exists")) {
      return { success: true };
    }

    return { success: false, error: errorText };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 APPLICATION DE LA MIGRATION: Champs du bail");
  console.log("=".repeat(60) + "\n");

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    const columnName = sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1] || "unknown";
    
    process.stdout.write(`[${i + 1}/${statements.length}] Ajout de '${columnName}'... `);
    
    const result = await executeSQL(sql);
    
    if (result.success) {
      console.log("✅");
      success++;
    } else {
      console.log("❌");
      console.log(`   Erreur: ${result.error?.substring(0, 100)}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`📊 Résultat: ${success} succès, ${failed} échecs`);
  console.log("=".repeat(60));

  if (failed > 0) {
    console.log("\n⚠️  Certaines colonnes n'ont pas pu être créées.");
    console.log("   Exécutez le SQL manuellement dans Supabase Dashboard:");
    console.log("   https://supabase.com/dashboard → SQL Editor\n");
    console.log("   SQL à exécuter:");
    console.log("   " + "-".repeat(50));
    statements.forEach(s => console.log(`   ${s};`));
  } else {
    console.log("\n✅ Toutes les colonnes ont été créées avec succès!\n");
  }
}

main().catch(console.error);
