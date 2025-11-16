#!/bin/bash

# Script pour ouvrir le téléchargement de Node.js

echo "🌐 Ouverture du navigateur pour télécharger Node.js..."
echo ""

# Détecter le système
OS="$(uname -s)"
case "${OS}" in
    Darwin*)
        # macOS
        open "https://nodejs.org/"
        echo "✅ Page de téléchargement ouverte dans votre navigateur"
        echo ""
        echo "📥 Instructions :"
        echo "   1. Cliquez sur le bouton vert 'Download Node.js (LTS)'"
        echo "   2. Ouvrez le fichier .pkg téléchargé"
        echo "   3. Suivez l'assistant d'installation"
        echo "   4. Fermez et rouvrez votre terminal"
        echo "   5. Revenez ici et exécutez : npm run start-app"
        ;;
    Linux*)
        # Linux
        if command -v xdg-open &> /dev/null; then
            xdg-open "https://nodejs.org/"
        elif command -v gnome-open &> /dev/null; then
            gnome-open "https://nodejs.org/"
        else
            echo "Veuillez ouvrir manuellement : https://nodejs.org/"
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        # Windows
        start "https://nodejs.org/"
        ;;
    *)
        echo "Veuillez ouvrir manuellement : https://nodejs.org/"
        ;;
esac

echo ""
echo "⏳ Après l'installation, exécutez :"
echo "   npm run start-app"

