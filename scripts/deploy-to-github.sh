#!/bin/bash

# Script pour déployer le projet sur GitHub
# Usage: ./scripts/deploy-to-github.sh VOTRE_USERNAME

set -e

USERNAME=$1

if [ -z "$USERNAME" ]; then
    echo "❌ Erreur: Veuillez fournir votre nom d'utilisateur GitHub"
    echo "Usage: ./scripts/deploy-to-github.sh VOTRE_USERNAME"
    exit 1
fi

REPO_NAME="gestion-locative"
GITHUB_URL="https://github.com/${USERNAME}/${REPO_NAME}.git"

echo "🚀 Préparation du déploiement sur GitHub..."
echo ""

# Vérifier si Git est initialisé
if [ ! -d ".git" ]; then
    echo "❌ Erreur: Git n'est pas initialisé"
    exit 1
fi

# Vérifier si un remote existe déjà
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  Un remote 'origin' existe déjà:"
    git remote get-url origin
    read -p "Voulez-vous le remplacer? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote remove origin
    else
        echo "❌ Opération annulée"
        exit 1
    fi
fi

# Ajouter le remote GitHub
echo "📦 Ajout du remote GitHub..."
git remote add origin "$GITHUB_URL"

# Vérifier la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🔄 Renommage de la branche '$CURRENT_BRANCH' en 'main'..."
    git branch -M main
fi

# Vérifier s'il y a des changements non commités
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Il y a des changements non commités"
    git status --short
    read -p "Voulez-vous les commiter maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Changements avant déploiement"
    fi
fi

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Créez le dépôt sur GitHub:"
echo "   https://github.com/new"
echo "   Nom: $REPO_NAME"
echo "   ⚠️  Ne PAS initialiser avec README, .gitignore ou licence"
echo ""
echo "2. Une fois le dépôt créé, exécutez:"
echo "   git push -u origin main"
echo ""
echo "3. Ensuite, importez le projet dans Vercel:"
echo "   https://vercel.com/new"
echo "   Sélectionnez le dépôt $REPO_NAME"
echo ""
echo "📖 Consultez GITHUB_DEPLOYMENT.md pour les instructions complètes"

