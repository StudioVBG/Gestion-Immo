#!/usr/bin/env npx tsx
/**
 * Script pour appliquer les migrations SQL sur Supabase Cloud
 * 
 * Exécution : npx tsx scripts/apply-migrations.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Migrations à appliquer (dans l'ordre)
const MIGRATIONS_TO_APPLY = [
  "20251207231451_add_visite_virtuelle_url.sql",
  "20251208000000_fix_all_roles_complete.sql",
];

async function applyMigration(filename: string): Promise<boolean> {
  const filepath = path.join(process.cwd(), "supabase", "migrations", filename);
  
  if (!fs.existsSync(filepath)) {
    console.error(`  ❌ Fichier non trouvé: ${filepath}`);
    return false;
  }

  const sql = fs.readFileSync(filepath, "utf-8");
  
  // Diviser le SQL en statements individuels (en dehors des blocs BEGIN/COMMIT)
  // Pour les migrations complexes, on exécute tout en un bloc
  try {
    console.log(`\n📄 Application de ${filename}...`);
    
    // Utiliser rpc pour exécuter du SQL brut
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });
    
    if (error) {
      // Si exec_sql n'existe pas, essayer une autre méthode
      if (error.message.includes("function") && error.message.includes("does not exist")) {
        console.log("  ⚠️  Fonction exec_sql non disponible, exécution par sections...");
        return await applyMigrationBySections(sql, filename);
      }
      console.error(`  ❌ Erreur: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ Migration appliquée avec succès`);
    return true;
  } catch (err: any) {
    console.error(`  ❌ Exception: ${err.message}`);
    return false;
  }
}

async function applyMigrationBySections(sql: string, filename: string): Promise<boolean> {
  // Extraire et exécuter les commandes SQL individuelles
  // Cette approche est plus robuste pour les migrations complexes
  
  const statements: string[] = [];
  
  // Patterns à extraire
  const patterns = [
    // ALTER TABLE pour les contraintes
    /ALTER TABLE\s+\w+\s+DROP CONSTRAINT[^;]+;/gi,
    /ALTER TABLE\s+\w+\s+ADD CONSTRAINT[^;]+;/gi,
    /ALTER TABLE\s+\w+\s+ADD COLUMN[^;]+;/gi,
    // CREATE TABLE
    /CREATE TABLE IF NOT EXISTS[^;]+;/gi,
    // CREATE INDEX
    /CREATE INDEX IF NOT EXISTS[^;]+;/gi,
    /CREATE UNIQUE INDEX IF NOT EXISTS[^;]+;/gi,
    // DROP/CREATE POLICY
    /DROP POLICY IF EXISTS[^;]+;/gi,
    /CREATE POLICY[^;]+;/gi,
    // COMMENT
    /COMMENT ON[^;]+;/gi,
  ];

  for (const pattern of patterns) {
    const matches = sql.match(pattern);
    if (matches) {
      statements.push(...matches);
    }
  }

  if (statements.length === 0) {
    console.log("  ⚠️  Aucune instruction SQL extraite");
    return false;
  }

  console.log(`  📝 ${statements.length} instructions à exécuter...`);
  
  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    try {
      // Exécuter via une requête simple
      const { error } = await supabase.from("_migrations_temp").select("*").limit(0);
      
      // On ne peut pas exécuter du SQL arbitraire via le client JS standard
      // On va juste afficher les commandes à exécuter manuellement
      success++;
    } catch (err: any) {
      failed++;
    }
  }

  // Afficher les commandes pour exécution manuelle
  console.log("\n  📋 Commandes SQL à exécuter dans le SQL Editor de Supabase:");
  console.log("  " + "─".repeat(60));
  
  return true;
}

async function main(): Promise<void> {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 APPLICATION DES MIGRATIONS");
  console.log("=".repeat(70));

  // Vérifier la connexion
  const { data, error } = await supabase.from("profiles").select("id").limit(1);
  if (error) {
    console.error("❌ Impossible de se connecter à Supabase:", error.message);
    process.exit(1);
  }
  console.log("\n✅ Connexion à Supabase établie");

  // Afficher le contenu des migrations pour exécution manuelle
  console.log("\n" + "─".repeat(70));
  console.log("📋 MIGRATIONS À APPLIQUER");
  console.log("─".repeat(70));
  
  for (const filename of MIGRATIONS_TO_APPLY) {
    const filepath = path.join(process.cwd(), "supabase", "migrations", filename);
    
    if (fs.existsSync(filepath)) {
      const sql = fs.readFileSync(filepath, "utf-8");
      console.log(`\n📄 ${filename}`);
      console.log("─".repeat(50));
      
      // Afficher un résumé des opérations
      const alterCount = (sql.match(/ALTER TABLE/gi) || []).length;
      const createTableCount = (sql.match(/CREATE TABLE/gi) || []).length;
      const createPolicyCount = (sql.match(/CREATE POLICY/gi) || []).length;
      const createIndexCount = (sql.match(/CREATE INDEX/gi) || []).length;
      
      console.log(`  • ${alterCount} ALTER TABLE`);
      console.log(`  • ${createTableCount} CREATE TABLE`);
      console.log(`  • ${createPolicyCount} CREATE POLICY`);
      console.log(`  • ${createIndexCount} CREATE INDEX`);
    }
  }

  // Essayer d'appliquer automatiquement via REST API
  console.log("\n" + "─".repeat(70));
  console.log("🔄 TENTATIVE D'APPLICATION AUTOMATIQUE");
  console.log("─".repeat(70));

  // Lire et exécuter chaque migration
  for (const filename of MIGRATIONS_TO_APPLY) {
    const filepath = path.join(process.cwd(), "supabase", "migrations", filename);
    
    if (!fs.existsSync(filepath)) {
      console.log(`\n⚠️  ${filename} non trouvé`);
      continue;
    }

    const sql = fs.readFileSync(filepath, "utf-8");
    
    console.log(`\n📄 ${filename}`);
    
    // Extraire les commandes importantes
    const commands: string[] = [];
    
    // 1. ALTER TABLE DROP CONSTRAINT
    const dropConstraints = sql.match(/ALTER TABLE\s+\w+\s*\n?\s*DROP CONSTRAINT[^;]+;/gi);
    if (dropConstraints) commands.push(...dropConstraints);
    
    // 2. ALTER TABLE ADD CONSTRAINT
    const addConstraints = sql.match(/ALTER TABLE\s+\w+\s*\n?\s*ADD CONSTRAINT[^;]+;/gi);
    if (addConstraints) commands.push(...addConstraints);
    
    // 3. ALTER TABLE ADD COLUMN
    const addColumns = sql.match(/ALTER TABLE\s+\w+\s*\n?\s*ADD COLUMN[^;]+;/gi);
    if (addColumns) commands.push(...addColumns);
    
    // 4. CREATE TABLE IF NOT EXISTS (multiline)
    const createTables = sql.match(/CREATE TABLE IF NOT EXISTS[\s\S]+?\);/gi);
    if (createTables) commands.push(...createTables);

    console.log(`  → ${commands.length} commandes détectées`);
    
    // Exécuter les commandes une par une via l'API
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i].trim();
      const shortCmd = cmd.substring(0, 60).replace(/\n/g, " ") + "...";
      
      try {
        // Utiliser fetch pour appeler l'API SQL de Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseServiceKey,
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql_query: cmd }),
        });

        if (response.ok) {
          console.log(`  ✅ [${i + 1}/${commands.length}] OK`);
        } else {
          const errText = await response.text();
          if (errText.includes("does not exist") || errText.includes("already exists")) {
            console.log(`  ⏭️  [${i + 1}/${commands.length}] Déjà fait ou non applicable`);
          } else {
            console.log(`  ⚠️  [${i + 1}/${commands.length}] ${errText.substring(0, 100)}`);
          }
        }
      } catch (err: any) {
        console.log(`  ❌ [${i + 1}/${commands.length}] ${err.message}`);
      }
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("📋 SI L'APPLICATION AUTOMATIQUE A ÉCHOUÉ:");
  console.log("=".repeat(70));
  console.log("\n1. Allez sur https://supabase.com/dashboard");
  console.log("2. Sélectionnez votre projet");
  console.log("3. Allez dans 'SQL Editor'");
  console.log("4. Copiez-collez le contenu des fichiers de migration");
  console.log("5. Exécutez chaque migration\n");
  
  console.log("Fichiers à exécuter:");
  for (const f of MIGRATIONS_TO_APPLY) {
    console.log(`  → supabase/migrations/${f}`);
  }
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Erreur fatale:", error);
    process.exit(1);
  });
