#!/bin/bash

# Script pour normaliser les emails existants dans Supabase
# Nécessite d'être exécuté avec les privilèges admin

echo "🔧 Normalisation des emails existants dans Supabase..."
echo ""

# Vérifier que les variables d'environnement sont définies
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL n'est pas définie"
  echo "   Assurez-vous que NEXT_PUBLIC_SUPABASE_URL est définie"
  exit 1
fi

echo "📧 Pour normaliser les emails existants, vous avez deux options:"
echo ""
echo "Option 1: Via le Dashboard Supabase (recommandé)"
echo "   1. Allez sur https://supabase.com/dashboard/project/YOUR_PROJECT/sql"
echo "   2. Exécutez: SELECT * FROM public.check_non_normalized_emails();"
echo "   3. Si des emails sont trouvés, exécutez: SELECT * FROM public.normalize_auth_emails();"
echo ""
echo "Option 2: Via psql (nécessite les credentials admin)"
echo "   psql -h YOUR_PROJECT.supabase.co -U postgres -d postgres \\"
echo "     -c \"SELECT * FROM public.normalize_auth_emails();\""
echo ""
echo "⚠️  Note: Cette opération nécessite des privilèges admin sur auth.users"
echo "   La migration a créé les fonctions nécessaires, mais elles doivent être exécutées manuellement."

