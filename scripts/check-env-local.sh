#!/bin/bash

# Script pour vérifier les variables d'environnement locales
# Usage: ./scripts/check-env-local.sh

echo "🔍 Vérification des variables d'environnement LOCALES (.env.local)"
echo ""

if [ ! -f .env.local ]; then
  echo "❌ Fichier .env.local introuvable"
  echo "   Créez-le avec: cp env.example .env.local"
  exit 1
fi

# Charger les variables
export $(cat .env.local | grep -v '^#' | xargs)

REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

echo "📋 Variables dans .env.local:"
echo ""

has_errors=false

for var in "${REQUIRED_VARS[@]}"; do
  value="${!var}"
  
  if [ -z "$value" ]; then
    echo "  ❌ $var: MANQUANTE"
    has_errors=true
  else
    # Masquer la valeur
    if [ ${#value} -gt 20 ]; then
      masked="${value:0:15}...${value: -10}"
    else
      masked="$value"
    fi
    
    # Vérification spéciale pour NEXT_PUBLIC_SUPABASE_URL
    if [ "$var" = "NEXT_PUBLIC_SUPABASE_URL" ]; then
      if [[ "$value" == *"supabase.com/dashboard"* ]]; then
        echo "  ❌ $var: ERREUR - L'URL pointe vers le dashboard Supabase"
        echo "     Utilisez: https://xxxxx.supabase.co"
        has_errors=true
      elif [[ "$value" != *".supabase.co"* ]]; then
        echo "  ❌ $var: Format invalide (doit se terminer par .supabase.co)"
        has_errors=true
      else
        echo "  ✅ $var: $masked"
      fi
    else
      echo "  ✅ $var: $masked"
    fi
  fi
done

echo ""
echo "============================================================"

if [ "$has_errors" = true ]; then
  echo "❌ ERREURS DÉTECTÉES"
  echo ""
  echo "Corrigez les erreurs ci-dessus avant de continuer."
  exit 1
else
  echo "✅ Toutes les variables locales sont correctement configurées !"
  echo ""
  echo "💡 Pour synchroniser avec Vercel, utilisez: ./scripts/sync-env-to-vercel.sh"
  echo "💡 Pour comparer avec Vercel, utilisez: ./scripts/compare-env.sh"
  exit 0
fi

