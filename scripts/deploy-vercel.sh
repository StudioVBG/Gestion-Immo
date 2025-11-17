#!/bin/bash

# Script pour redéployer sur Vercel et vider le cache
# Usage: ./scripts/deploy-vercel.sh

echo "🚀 Redéploiement sur Vercel"
echo ""

# Vérifier si git est initialisé
if [ ! -d ".git" ]; then
  echo "❌ Erreur: Ce projet n'est pas un dépôt Git"
  echo "   Initialisez Git avec: git init"
  exit 1
fi

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
  echo "⚠️  Vercel CLI n'est pas installé"
  echo "   Installez-le avec: npm i -g vercel"
  echo ""
  echo "📝 Instructions manuelles:"
  echo "   1. Commitez vos changements: git add . && git commit -m 'Update tenant dashboard V2'"
  echo "   2. Poussez sur GitHub/GitLab: git push"
  echo "   3. Vercel redéploiera automatiquement"
  echo "   4. Dans Vercel Dashboard > Settings > General > Clear Build Cache"
  exit 1
fi

# Vérifier les changements non commités
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Vous avez des changements non commités:"
  git status --short
  echo ""
  read -p "Voulez-vous les committer maintenant? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    git commit -m "Update tenant dashboard V2 - Clear cache"
    echo "✅ Changements commités"
  else
    echo "⚠️  Veuillez committer vos changements avant de déployer"
    exit 1
  fi
fi

echo "📦 Déploiement sur Vercel..."
echo ""

# Option 1: Déployer avec Vercel CLI (production)
read -p "Déployer en production? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  vercel --prod
else
  vercel
fi

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "🗑️  Pour vider le cache Vercel:"
echo "   1. Allez sur https://vercel.com/dashboard"
echo "   2. Sélectionnez votre projet"
echo "   3. Allez dans Settings > General"
echo "   4. Cliquez sur 'Clear Build Cache'"
echo "   5. Redéployez manuellement ou attendez le prochain push"
echo ""
echo "💡 Alternative: Utilisez l'API Vercel pour vider le cache automatiquement"

