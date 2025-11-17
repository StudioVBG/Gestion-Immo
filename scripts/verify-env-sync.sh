#!/bin/bash

# Script pour vérifier que les variables sont synchronisées entre localhost et Vercel
# Usage: ./scripts/verify-env-sync.sh

echo "🔍 Vérification de la synchronisation des variables d'environnement"
echo "============================================================"
echo ""

# Vérifier les variables locales
echo "📋 Variables LOCALES (.env.local):"
echo ""

if [ ! -f .env.local ]; then
  echo "  ❌ Fichier .env.local introuvable"
  echo "     Créez-le avec: cp env.example .env.local"
  exit 1
fi

# Stocker les valeurs locales dans des variables temporaires
LOCAL_SUPABASE_URL=""
LOCAL_SUPABASE_ANON_KEY=""
LOCAL_SERVICE_ROLE_KEY=""

while IFS='=' read -r key value; do
  # Ignorer les commentaires et lignes vides
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  
  # Vérifier si c'est une variable Supabase
  if [[ "$key" == "NEXT_PUBLIC_SUPABASE_URL" ]]; then
    LOCAL_SUPABASE_URL=$(echo "$value" | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
    if [ ${#LOCAL_SUPABASE_URL} -gt 20 ]; then
      masked="${LOCAL_SUPABASE_URL:0:15}...${LOCAL_SUPABASE_URL: -10}"
    else
      masked="$LOCAL_SUPABASE_URL"
    fi
    echo "  ✅ $key"
    echo "     Valeur: $masked"
    echo ""
  elif [[ "$key" == "NEXT_PUBLIC_SUPABASE_ANON_KEY" ]]; then
    LOCAL_SUPABASE_ANON_KEY=$(echo "$value" | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
    if [ ${#LOCAL_SUPABASE_ANON_KEY} -gt 20 ]; then
      masked="${LOCAL_SUPABASE_ANON_KEY:0:15}...${LOCAL_SUPABASE_ANON_KEY: -10}"
    else
      masked="$LOCAL_SUPABASE_ANON_KEY"
    fi
    echo "  ✅ $key"
    echo "     Valeur: $masked"
    echo ""
  elif [[ "$key" == "SUPABASE_SERVICE_ROLE_KEY" ]]; then
    LOCAL_SERVICE_ROLE_KEY=$(echo "$value" | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
    if [ ${#LOCAL_SERVICE_ROLE_KEY} -gt 20 ]; then
      masked="${LOCAL_SERVICE_ROLE_KEY:0:15}...${LOCAL_SERVICE_ROLE_KEY: -10}"
    else
      masked="$LOCAL_SERVICE_ROLE_KEY"
    fi
    echo "  ✅ $key"
    echo "     Valeur: $masked"
    echo ""
  fi
done < .env.local

echo "============================================================"
echo ""
echo "📋 Variables VERCEL:"
echo ""

if ! command -v vercel &> /dev/null; then
  echo "  ⚠️  Vercel CLI non installé"
  echo ""
  echo "  💡 Vérifiez manuellement sur:"
  echo "     https://vercel.com/dashboard > Votre projet > Settings > Environment Variables"
  echo ""
  echo "  📝 Assurez-vous que ces valeurs sont IDENTIQUES à celles ci-dessus:"
  for key in "${!local_vars[@]}"; do
    echo "     - $key"
  done
else
  echo "  🔍 Vérification via Vercel CLI..."
  echo ""
  
  # Vérifier chaque variable
  all_synced=true
  
  if vercel env ls 2>/dev/null | grep -q "^NEXT_PUBLIC_SUPABASE_URL"; then
    echo "  ✅ NEXT_PUBLIC_SUPABASE_URL: Présente dans Vercel"
  else
    echo "  ⚠️  NEXT_PUBLIC_SUPABASE_URL: Non trouvée dans Vercel"
    all_synced=false
  fi
  
  if vercel env ls 2>/dev/null | grep -q "^NEXT_PUBLIC_SUPABASE_ANON_KEY"; then
    echo "  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Présente dans Vercel"
  else
    echo "  ⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY: Non trouvée dans Vercel"
    all_synced=false
  fi
  
  if vercel env ls 2>/dev/null | grep -q "^SUPABASE_SERVICE_ROLE_KEY"; then
    echo "  ✅ SUPABASE_SERVICE_ROLE_KEY: Présente dans Vercel"
  else
    echo "  ⚠️  SUPABASE_SERVICE_ROLE_KEY: Non trouvée dans Vercel"
    all_synced=false
  fi
  
  echo ""
  if [ "$all_synced" = true ]; then
    echo "  ✅ Toutes les variables sont présentes dans Vercel"
    echo ""
    echo "  ⚠️  IMPORTANT: Vérifiez manuellement que les VALEURS sont identiques"
    echo "     Les valeurs dans Vercel sont chiffrées et ne peuvent pas être comparées automatiquement"
  else
    echo "  ⚠️  Certaines variables manquent dans Vercel"
    echo "     Utilisez: npm run sync-env pour les instructions"
  fi
fi

echo ""
echo "============================================================"
echo ""
echo "✅ Pour utiliser la même base de données Supabase:"
echo "   Les valeurs dans .env.local et Vercel doivent être IDENTIQUES"
echo ""
echo "📝 Vérification manuelle recommandée:"
echo "   1. Ouvrez .env.local"
echo "   2. Allez sur Vercel Dashboard > Settings > Environment Variables"
echo "   3. Comparez chaque valeur - elles doivent être exactement identiques"

