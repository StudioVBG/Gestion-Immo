#!/usr/bin/env ts-node
/**
 * Script de migration pour chiffrer les IBAN existants
 * 
 * USAGE:
 *   ENCRYPTION_KEY=<your-key> npx ts-node scripts/migrate-iban-encryption.ts
 * 
 * OPTIONS:
 *   --dry-run     Simuler sans modifier la base
 *   --batch-size  Nombre d'IBAN à traiter par lot (défaut: 100)
 *   --verbose     Afficher les détails
 * 
 * IMPORTANT:
 *   1. Sauvegarder la base avant exécution
 *   2. Tester en staging d'abord
 *   3. Garder l'ancienne colonne 'iban' jusqu'à validation
 */

import { createClient } from "@supabase/supabase-js";
import { encryptIBAN, isEncrypted } from "../lib/security/encryption.service";

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Options CLI
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");
const BATCH_SIZE = parseInt(
  args.find((a) => a.startsWith("--batch-size="))?.split("=")[1] || "100"
);

// Couleurs console
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log("\n🔐 Migration IBAN Encryption", "cyan");
  log("━".repeat(50), "cyan");

  // Vérifications préalables
  if (!process.env.ENCRYPTION_KEY) {
    log("❌ ENCRYPTION_KEY non définie", "red");
    log("   Générez une clé avec: openssl rand -base64 32", "yellow");
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log("❌ Variables Supabase manquantes", "red");
    process.exit(1);
  }

  if (DRY_RUN) {
    log("⚠️  Mode DRY-RUN activé (aucune modification)", "yellow");
  }

  // Connexion Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Compter les IBAN à migrer
  const { count: totalCount, error: countError } = await supabase
    .from("owner_profiles")
    .select("*", { count: "exact", head: true })
    .not("iban", "is", null)
    .is("iban_encrypted", null);

  if (countError) {
    log(`❌ Erreur comptage: ${countError.message}`, "red");
    process.exit(1);
  }

  log(`\n📊 IBAN à migrer: ${totalCount}`, "blue");
  log(`   Taille des lots: ${BATCH_SIZE}`, "blue");

  if (!totalCount || totalCount === 0) {
    log("✅ Aucun IBAN à migrer!", "green");
    return;
  }

  // Statistiques
  let processed = 0;
  let success = 0;
  let errors = 0;
  let skipped = 0;

  // Traitement par lots
  const totalBatches = Math.ceil(totalCount / BATCH_SIZE);

  for (let batch = 0; batch < totalBatches; batch++) {
    const offset = batch * BATCH_SIZE;

    log(`\n📦 Lot ${batch + 1}/${totalBatches} (offset: ${offset})`, "cyan");

    // Récupérer le lot
    const { data: profiles, error: fetchError } = await supabase
      .from("owner_profiles")
      .select("profile_id, iban")
      .not("iban", "is", null)
      .is("iban_encrypted", null)
      .range(offset, offset + BATCH_SIZE - 1);

    if (fetchError) {
      log(`❌ Erreur récupération: ${fetchError.message}`, "red");
      continue;
    }

    if (!profiles || profiles.length === 0) {
      log("   Aucun profil dans ce lot", "yellow");
      continue;
    }

    // Traiter chaque profil
    for (const profile of profiles) {
      processed++;

      if (!profile.iban) {
        skipped++;
        continue;
      }

      // Vérifier si déjà chiffré
      if (isEncrypted(profile.iban)) {
        if (VERBOSE) log(`   ⏭️  ${profile.profile_id} - déjà chiffré`, "yellow");
        skipped++;
        continue;
      }

      try {
        // Chiffrer l'IBAN
        const { encrypted, hash, last4 } = encryptIBAN(profile.iban);

        if (VERBOSE) {
          log(`   🔑 ${profile.profile_id}`, "blue");
          log(`      IBAN: ${profile.iban.slice(0, 4)}****${last4}`, "blue");
          log(`      Hash: ${hash.slice(0, 16)}...`, "blue");
        }

        // Mettre à jour si pas en dry-run
        if (!DRY_RUN) {
          const { error: updateError } = await supabase
            .from("owner_profiles")
            .update({
              iban_encrypted: encrypted,
              iban_hash: hash,
              iban_last4: last4,
            })
            .eq("profile_id", profile.profile_id);

          if (updateError) {
            throw updateError;
          }
        }

        success++;
      } catch (err: any) {
        errors++;
        log(`   ❌ ${profile.profile_id}: ${err.message}`, "red");
      }
    }

    // Progression
    const progress = Math.round((processed / totalCount) * 100);
    log(`   ✓ Progression: ${progress}% (${processed}/${totalCount})`, "green");
  }

  // Résumé final
  log("\n" + "━".repeat(50), "cyan");
  log("📈 RÉSUMÉ DE LA MIGRATION", "cyan");
  log("━".repeat(50), "cyan");
  log(`   Total traité:  ${processed}`, "blue");
  log(`   ✅ Succès:      ${success}`, "green");
  log(`   ⏭️  Ignorés:     ${skipped}`, "yellow");
  log(`   ❌ Erreurs:     ${errors}`, errors > 0 ? "red" : "green");

  if (DRY_RUN) {
    log("\n⚠️  Mode DRY-RUN - Aucune modification effectuée", "yellow");
    log("   Relancez sans --dry-run pour appliquer les changements", "yellow");
  } else if (success > 0) {
    log("\n✅ Migration terminée avec succès!", "green");
    log("\n⚠️  Prochaines étapes:", "yellow");
    log("   1. Vérifier les données chiffrées en base", "yellow");
    log("   2. Tester le déchiffrement dans l'application", "yellow");
    log("   3. Après validation, supprimer l'ancienne colonne 'iban':", "yellow");
    log("      ALTER TABLE owner_profiles DROP COLUMN iban;", "yellow");
  }
}

// Exécution
main().catch((err) => {
  log(`\n❌ Erreur fatale: ${err.message}`, "red");
  process.exit(1);
});

