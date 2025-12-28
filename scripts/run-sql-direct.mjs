#!/usr/bin/env node
/**
 * Script pour exécuter SQL via la Management API Supabase
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env.local
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const MANAGEMENT_TOKEN = process.env.SUPABASE_MANAGEMENT_API_TOKEN;

if (!SUPABASE_URL || !MANAGEMENT_TOKEN) {
  console.error('❌ Variables manquantes');
  process.exit(1);
}

// Extraire le project ref de l'URL
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
console.log(`📦 Project: ${projectRef}\n`);

const SQL = `
-- 1. Rendre profile_id nullable
ALTER TABLE lease_signers ALTER COLUMN profile_id DROP NOT NULL;

-- 2. Ajouter invited_email
ALTER TABLE lease_signers ADD COLUMN IF NOT EXISTS invited_email VARCHAR(255);

-- 3. Ajouter invited_at  
ALTER TABLE lease_signers ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Ajouter invited_name
ALTER TABLE lease_signers ADD COLUMN IF NOT EXISTS invited_name VARCHAR(255);

-- 5. Index
CREATE INDEX IF NOT EXISTS idx_lease_signers_invited_email ON lease_signers(invited_email) WHERE invited_email IS NOT NULL;
`;

async function runSQL() {
  console.log('🔧 Exécution du SQL via Management API...\n');

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MANAGEMENT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: SQL }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur API: ${response.status}`);
      console.error(errorText);
      
      console.log('\n💡 Alternative: Exécutez manuellement dans Supabase Dashboard:');
      console.log('   1. https://supabase.com/dashboard/project/' + projectRef + '/sql');
      console.log('   2. Collez le SQL ci-dessous:');
      console.log('\n---SQL---');
      console.log(SQL);
      console.log('---END---\n');
      return;
    }

    const result = await response.json();
    console.log('✅ SQL exécuté avec succès!');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

runSQL();

