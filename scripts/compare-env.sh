#!/bin/bash

# Script pour comparer les variables locales et Vercel
# Usage: ./scripts/compare-env.sh

echo "🔍 Comparaison des variables d'environnement"
echo "============================================================"
echo ""

# Vérifier les variables locales
echo "📋 Variables LOCALES (.env.local):"
echo ""

if [ ! -f .env.local ]; then
  echo "  ❌ Fichier .env.local introuvable"
  echo "     Créez-le avec: cp env.example .env.local"
else
  has_local_vars=false
  
  while IFS='=' read -r key value; do
    # Ignorer les commentaires et lignes vides
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Vérifier si c'est une variable Supabase
    if [[ "$key" == "NEXT_PUBLIC_SUPABASE_URL" ]] || \
       [[ "$key" == "NEXT_PUBLIC_SUPABASE_ANON_KEY" ]] || \
       [[ "$key" == "SUPABASE_SERVICE_ROLE_KEY" ]]; then
      
      has_local_vars=true
      # Nettoyer la valeur
      value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
      
      # Masquer la valeur
      if [ ${#value} -gt 20 ]; then
        masked="${value:0:15}...${value: -10}"
      else
        masked="$value"
      fi
      
      echo "  ✅ $key"
      echo "     Valeur: $masked"
      echo ""
    fi
  done < .env.local
  
  if [ "$has_local_vars" = false ]; then
    echo "  ⚠️  Aucune variable Supabase trouvée dans .env.local"
  fi
fi

echo "============================================================"
echo ""
echo "📋 Variables VERCEL:"
echo ""

if ! command -v vercel &> /dev/null; then
  echo "  ⚠️  Vercel CLI non installé - impossible de vérifier automatiquement"
  echo ""
  echo "  💡 Vérifiez manuellement sur:"
  echo "     https://vercel.com/dashboard > Votre projet > Settings > Environment Variables"
  echo ""
  echo "  📝 Variables à vérifier:"
  echo "     - NEXT_PUBLIC_SUPABASE_URL"
  echo "     - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "     - SUPABASE_SERVICE_ROLE_KEY"
else
  echo "  💡 Utilisez 'vercel env ls' pour voir les variables Vercel"
  echo "  💡 Ou vérifiez manuellement dans le Dashboard Vercel"
  echo ""
  
  # Essayer de lister les variables Vercel
  if vercel env ls &>/dev/null; then
    echo "  Variables Vercel trouvées:"
    vercel env ls 2>/dev/null | grep -E "(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)" || echo "    Aucune variable Supabase trouvée"
  else
    echo "  ⚠️  Impossible de se connecter à Vercel"
    echo "     Connectez-vous avec: vercel login"
  fi
fi

echo ""
echo "============================================================"
echo ""
echo "✅ Les deux environnements doivent avoir les MÊMES valeurs"
echo "   pour utiliser la même base de données Supabase"
echo ""
echo "📝 Pour synchroniser:"
echo "   - Local → Vercel: ./scripts/sync-env-to-vercel.sh"
echo "   - Vérifier local: ./scripts/check-env-local.sh"

