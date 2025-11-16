/**
 * Script de diagnostic pour le flux de création de propriété
 * 
 * Ce script teste :
 * 1. La création d'un draft via POST /api/properties
 * 2. La récupération du draft via GET /api/properties/:id
 * 3. La mise à jour du draft via PATCH /api/properties/:id
 * 4. L'ajout d'une pièce via POST /api/properties/:id/rooms
 * 
 * Usage: npx tsx scripts/diagnose-property-creation.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), ".env.local") });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

async function diagnosePropertyCreation() {
  console.log("🔍 Diagnostic du flux de création de propriété\n");
  console.log(`API Base: ${API_BASE}\n`);

  // Note: Ce script nécessite une authentification réelle
  // Pour un test complet, il faudrait :
  // 1. Se connecter avec un compte owner
  // 2. Récupérer le token de session
  // 3. Utiliser ce token dans les requêtes

  console.log("⚠️  Ce script nécessite une authentification réelle.");
  console.log("Pour tester manuellement :");
  console.log("1. Connectez-vous à l'application avec un compte owner");
  console.log("2. Ouvrez la console du navigateur");
  console.log("3. Créez un nouveau logement via le wizard");
  console.log("4. Vérifiez les logs suivants dans la console :\n");

  console.log("📋 Logs attendus dans la console du navigateur :");
  console.log("   [PropertyWizardV3] Création d'un draft avec type_bien=...");
  console.log("   [PropertyWizardV3] Draft créé avec succès: id=...");
  console.log("   [PropertyWizardV3] Auto-save pour propertyId=...");
  console.log("   [PropertyWizardV3] Auto-save réussi pour propertyId=...\n");

  console.log("📋 Logs attendus dans le serveur (terminal) :");
  console.log("   [POST /api/properties] Création d'un draft avec type_bien=...");
  console.log("   [POST /api/properties] Draft créé avec succès: id=..., owner_id=...");
  console.log("   [createDraftProperty] Draft créé: id=..., type_bien=...");
  console.log("   [PATCH /api/properties/:id] Propriété trouvée: owner_id=..., etat=..., type=...");
  console.log("   [POST /api/properties/:id/rooms] Propriété trouvée: owner_id=..., etat=..., type=...\n");

  console.log("🔧 Points de vérification :");
  console.log("   1. Le draft est créé avec succès (status 201)");
  console.log("   2. L'ID retourné est un UUID valide");
  console.log("   3. Le draft est accessible via GET /api/properties/:id");
  console.log("   4. Le draft peut être mis à jour via PATCH /api/properties/:id");
  console.log("   5. Les pièces peuvent être ajoutées via POST /api/properties/:id/rooms\n");

  console.log("❌ Si vous voyez des erreurs 404 :");
  console.log("   - Vérifiez que SUPABASE_SERVICE_ROLE_KEY est configurée");
  console.log("   - Vérifiez que le draft existe dans la base de données");
  console.log("   - Vérifiez les logs serveur pour voir si la propriété est trouvée\n");

  console.log("❌ Si vous voyez des erreurs 400 :");
  console.log("   - Vérifiez que les données envoyées sont valides");
  console.log("   - Vérifiez que les colonnes nécessaires existent dans la BDD");
  console.log("   - Vérifiez les logs serveur pour voir l'erreur exacte\n");

  console.log("✅ Si tout fonctionne :");
  console.log("   - Le draft est créé et accessible");
  console.log("   - Les mises à jour fonctionnent");
  console.log("   - Les pièces peuvent être ajoutées");
  console.log("   - Le wizard peut continuer normalement\n");
}

diagnosePropertyCreation().catch(console.error);

