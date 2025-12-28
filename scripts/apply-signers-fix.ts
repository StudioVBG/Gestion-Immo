#!/usr/bin/env npx ts-node
/**
 * Script pour appliquer la correction de lease_signers
 * Permet les invitations sans compte existant
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables manquantes:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyFix() {
  console.log('\n🔧 Application de la correction lease_signers...\n');

  const migrations = [
    {
      name: 'Rendre profile_id nullable',
      sql: `ALTER TABLE lease_signers ALTER COLUMN profile_id DROP NOT NULL;`,
    },
    {
      name: 'Ajouter invited_email',
      sql: `ALTER TABLE lease_signers ADD COLUMN IF NOT EXISTS invited_email VARCHAR(255);`,
    },
    {
      name: 'Ajouter invited_at',
      sql: `ALTER TABLE lease_signers ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NOW();`,
    },
    {
      name: 'Ajouter invited_name',
      sql: `ALTER TABLE lease_signers ADD COLUMN IF NOT EXISTS invited_name VARCHAR(255);`,
    },
    {
      name: 'Créer index sur invited_email',
      sql: `CREATE INDEX IF NOT EXISTS idx_lease_signers_invited_email ON lease_signers(invited_email) WHERE invited_email IS NOT NULL;`,
    },
  ];

  let success = 0;
  let failed = 0;

  for (const migration of migrations) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: migration.sql });
      
      if (error) {
        // Essayer via une requête directe
        console.log(`⚠️  ${migration.name} - Tentative alternative...`);
        
        // Pour les ALTER, on ne peut pas les faire via l'API REST standard
        // Il faut utiliser la fonction exec_sql ou le dashboard
        console.log(`   SQL: ${migration.sql.substring(0, 60)}...`);
        failed++;
      } else {
        console.log(`✅ ${migration.name}`);
        success++;
      }
    } catch (err: any) {
      console.log(`❌ ${migration.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Résultat: ${success} réussis, ${failed} échoués`);

  if (failed > 0) {
    console.log('\n💡 Pour les migrations échouées, exécutez manuellement:');
    console.log('   1. Allez sur https://supabase.com/dashboard');
    console.log('   2. SQL Editor > New Query');
    console.log('   3. Collez le contenu de APPLY_NOW_SIGNERS.sql');
    console.log('   4. Cliquez sur Run\n');
  }

  // Vérification
  console.log('\n🔍 Vérification de la structure...\n');
  
  const { data, error } = await supabase
    .from('lease_signers')
    .select('id, profile_id, invited_email, invited_name')
    .limit(1);

  if (error) {
    if (error.message.includes('invited_email')) {
      console.log('❌ La colonne invited_email n\'existe pas encore');
    } else {
      console.log(`❌ Erreur: ${error.message}`);
    }
  } else {
    console.log('✅ Structure vérifiée - les colonnes existent');
  }
}

applyFix().catch(console.error);

