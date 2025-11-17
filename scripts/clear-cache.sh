#!/bin/bash

# Script pour vider tous les caches du projet
# Usage: ./scripts/clear-cache.sh

echo "🗑️  Nettoyage des caches Next.js et dépendances..."

# Vider le cache Next.js
if [ -d ".next" ]; then
  rm -rf .next
  echo "✓ Cache .next supprimé"
else
  echo "⚠ Cache .next introuvable (déjà supprimé ?)"
fi

# Vider le cache node_modules
if [ -d "node_modules/.cache" ]; then
  rm -rf node_modules/.cache
  echo "✓ Cache node_modules supprimé"
else
  echo "⚠ Cache node_modules introuvable"
fi

# Vider le cache Turbo
if [ -d ".turbo" ]; then
  rm -rf .turbo
  echo "✓ Cache Turbo supprimé"
else
  echo "⚠ Cache Turbo introuvable"
fi

# Vider le cache npm (optionnel)
if command -v npm &> /dev/null; then
  echo "📦 Nettoyage du cache npm..."
  npm cache clean --force 2>/dev/null || true
  echo "✓ Cache npm nettoyé"
fi

echo ""
echo "✅ Tous les caches ont été vidés !"
echo ""
echo "💡 Pour vider le cache du navigateur :"
echo "   - Chrome/Edge: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)"
echo "   - Firefox: Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)"
echo "   - Safari: Cmd+Option+R"
echo ""
echo "🚀 Vous pouvez maintenant relancer le serveur avec: npm run dev"

