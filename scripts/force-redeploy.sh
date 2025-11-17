#!/bin/bash

echo "🚀 Redéploiement forcé sur Vercel"
echo "=================================="
echo ""

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "   Installez-le avec: npm i -g vercel"
    exit 1
fi

# Vérifier si l'utilisateur est connecté
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Vous n'êtes pas connecté à Vercel"
    echo "   Connectez-vous avec: vercel login"
    exit 1
fi

echo "✅ Vercel CLI détecté"
echo ""

# Nettoyer le cache local
echo "🧹 Nettoyage du cache local..."
rm -rf .next
rm -rf node_modules/.cache
echo "✅ Cache local nettoyé"
echo ""

# Rebuild local pour vérifier qu'il n'y a pas d'erreurs
echo "🔨 Build local..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build local"
    exit 1
fi

echo "✅ Build local réussi"
echo ""

# Déployer sur Vercel avec --force pour ignorer le cache
echo "🚀 Déploiement sur Vercel (production)..."
vercel --prod --force --yes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Redéploiement réussi !"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "   1. Attendez 1-2 minutes que Vercel termine le déploiement"
    echo "   2. Videz le cache du navigateur (Cmd+Shift+R)"
    echo "   3. Rechargez la page /app/tenant"
    echo "   4. Vous devriez voir le dashboard V2"
else
    echo "❌ Échec du déploiement"
    exit 1
fi

