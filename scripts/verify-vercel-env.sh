#!/bin/bash

# Script pour vérifier que les variables d'environnement sont correctement configurées sur Vercel

echo "🔍 Vérification des variables d'environnement sur Vercel..."
echo ""

# Vérifier si Vercel CLI est installé (globalement ou localement)
if ! command -v vercel &> /dev/null && ! command -v npx &> /dev/null; then
  echo "❌ Vercel CLI n'est pas installé"
  echo "   Installez-le avec: npm install --save-dev vercel"
  exit 1
fi

# Utiliser npx vercel si vercel n'est pas disponible globalement
VERCEL_CMD="vercel"
if ! command -v vercel &> /dev/null; then
  VERCEL_CMD="npx vercel"
fi

# Vérifier les variables critiques
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

echo "📋 Variables requises:"
for var in "${REQUIRED_VARS[@]}"; do
  echo "   - $var"
done
echo ""

# Lister les variables sur Vercel
echo "🔐 Variables configurées sur Vercel:"
$VERCEL_CMD env ls 2>/dev/null | grep -E "(NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE)" || echo "   Aucune variable Supabase trouvée"
echo ""

# Vérifier NEXT_PUBLIC_APP_URL (optionnelle mais recommandée)
echo "🌐 Variable optionnelle (recommandée):"
echo "   - NEXT_PUBLIC_APP_URL (devrait être: https://gestion-immo-nine.vercel.app)"
if $VERCEL_CMD env ls 2>/dev/null | grep -q "NEXT_PUBLIC_APP_URL"; then
  echo "   ✅ NEXT_PUBLIC_APP_URL configurée"
  $VERCEL_CMD env ls 2>/dev/null | grep "NEXT_PUBLIC_APP_URL"
else
  echo "   ⚠️  NEXT_PUBLIC_APP_URL non configurée"
  echo "   Pour la configurer: $VERCEL_CMD env add NEXT_PUBLIC_APP_URL production"
fi
echo ""

echo "✅ Pour configurer une variable:"
echo "   $VERCEL_CMD env add NEXT_PUBLIC_APP_URL production"
echo ""
echo "✅ Pour voir toutes les variables:"
echo "   $VERCEL_CMD env ls"

