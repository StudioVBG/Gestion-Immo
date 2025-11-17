#!/bin/bash

# Script pour synchroniser les variables locales vers Vercel
# Usage: ./scripts/sync-env-to-vercel.sh

echo "🔄 Synchronisation des variables d'environnement vers Vercel"
echo ""

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI n'est pas installé"
  echo "   Installez-le avec: npm i -g vercel"
  echo ""
  echo "📝 Instructions manuelles:"
  echo "   1. Ouvrez https://vercel.com/dashboard"
  echo "   2. Sélectionnez votre projet > Settings > Environment Variables"
  echo "   3. Ajoutez/modifiez les variables suivantes:"
  echo ""
  
  if [ -f .env.local ]; then
    echo "   Variables depuis .env.local:"
    echo ""
    while IFS='=' read -r key value; do
      # Ignorer les commentaires et lignes vides
      [[ "$key" =~ ^#.*$ ]] && continue
      [[ -z "$key" ]] && continue
      
      if [[ "$key" == "NEXT_PUBLIC_SUPABASE_URL" ]] || \
         [[ "$key" == "NEXT_PUBLIC_SUPABASE_ANON_KEY" ]] || \
         [[ "$key" == "SUPABASE_SERVICE_ROLE_KEY" ]]; then
        masked="${value:0:15}...${value: -10}"
        echo "   - $key: $masked"
      fi
    done < .env.local
  fi
  
  echo ""
  echo "   ⚠️  IMPORTANT: Les valeurs doivent être IDENTIQUES à celles dans .env.local"
  exit 1
fi

# Vérifier si .env.local existe
if [ ! -f .env.local ]; then
  echo "❌ Fichier .env.local introuvable"
  echo "   Créez-le avec: cp env.example .env.local"
  exit 1
fi

echo "📋 Variables à synchroniser:"
echo ""

# Lire les variables depuis .env.local
while IFS='=' read -r key value; do
  # Ignorer les commentaires et lignes vides
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  
  # Nettoyer la valeur (enlever les guillemets si présents)
  value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
  
  # Vérifier si c'est une variable Supabase
  if [[ "$key" == "NEXT_PUBLIC_SUPABASE_URL" ]] || \
     [[ "$key" == "NEXT_PUBLIC_SUPABASE_ANON_KEY" ]] || \
     [[ "$key" == "SUPABASE_SERVICE_ROLE_KEY" ]]; then
    
    masked="${value:0:15}...${value: -10}"
    echo "  📤 $key: $masked"
    
    # Note: Vercel CLI nécessite une interaction manuelle pour les valeurs
    # On affiche les instructions
    echo "     → Utilisez cette commande pour ajouter:"
    echo "        echo '$value' | vercel env add $key production"
    echo "        echo '$value' | vercel env add $key preview"
    echo "        echo '$value' | vercel env add $key development"
    echo ""
  fi
done < .env.local

echo ""
echo "⚠️  IMPORTANT: Vercel CLI nécessite une interaction manuelle"
echo ""
echo "📝 Pour synchroniser manuellement:"
echo "   1. Allez sur https://vercel.com/dashboard"
echo "   2. Sélectionnez votre projet > Settings > Environment Variables"
echo "   3. Pour chaque variable ci-dessus:"
echo "      - Cliquez sur 'Add New'"
echo "      - Entrez le nom de la variable"
echo "      - Copiez la valeur depuis .env.local"
echo "      - Cochez Production, Preview, Development"
echo "      - Cliquez sur 'Save'"
echo ""
echo "✅ Après synchronisation, vérifiez avec: ./scripts/compare-env.sh"

