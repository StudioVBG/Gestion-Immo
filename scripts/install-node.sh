#!/bin/bash

# Script d'installation automatique de Node.js

echo "🔍 Vérification de Node.js..."
echo ""

# Vérifier si Node.js est déjà installé
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js est déjà installé : $NODE_VERSION"
    echo ""
    echo "Vous pouvez maintenant lancer :"
    echo "  npm install"
    echo "  npm run dev"
    exit 0
fi

echo "❌ Node.js n'est pas installé"
echo ""

# Détecter le système d'exploitation
OS="$(uname -s)"
case "${OS}" in
    Linux*)
        echo "🐧 Système détecté : Linux"
        echo ""
        echo "Options d'installation :"
        echo ""
        echo "1. Via le gestionnaire de paquets (recommandé) :"
        echo "   Ubuntu/Debian :"
        echo "     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "     sudo apt-get install -y nodejs"
        echo ""
        echo "   Fedora/RHEL :"
        echo "     curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -"
        echo "     sudo dnf install -y nodejs"
        echo ""
        echo "2. Via nvm (Node Version Manager) :"
        echo "     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        echo "     source ~/.bashrc"
        echo "     nvm install 18"
        echo "     nvm use 18"
        ;;
    Darwin*)
        echo "🍎 Système détecté : macOS"
        echo ""
        
        # Vérifier si Homebrew est disponible
        if command -v brew &> /dev/null; then
            echo "✅ Homebrew est installé"
            echo ""
            read -p "Voulez-vous installer Node.js via Homebrew ? (o/n) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[OoYy]$ ]]; then
                echo "📦 Installation de Node.js via Homebrew..."
                brew install node@18
                echo ""
                echo "✅ Node.js installé !"
                echo ""
                echo "Ajoutez au PATH si nécessaire :"
                echo "  echo 'export PATH=\"/opt/homebrew/opt/node@18/bin:\$PATH\"' >> ~/.zshrc"
                echo "  source ~/.zshrc"
                exit 0
            fi
        else
            echo "ℹ️  Homebrew n'est pas installé"
            echo ""
            echo "Options d'installation :"
            echo ""
            echo "1. Installer Homebrew puis Node.js :"
            echo "     /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            echo "     brew install node@18"
            echo ""
            echo "2. Télécharger depuis nodejs.org :"
            echo "     Ouvrez https://nodejs.org/ dans votre navigateur"
            echo "     Téléchargez la version LTS pour macOS"
            echo "     Installez le fichier .pkg téléchargé"
            echo ""
            echo "3. Via nvm (Node Version Manager) :"
            echo "     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
            echo "     source ~/.zshrc"
            echo "     nvm install 18"
            echo "     nvm use 18"
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        echo "🪟 Système détecté : Windows"
        echo ""
        echo "Options d'installation :"
        echo ""
        echo "1. Télécharger depuis nodejs.org :"
        echo "     Ouvrez https://nodejs.org/ dans votre navigateur"
        echo "     Téléchargez la version LTS pour Windows"
        echo "     Installez le fichier .msi téléchargé"
        echo ""
        echo "2. Via Chocolatey (si installé) :"
        echo "     choco install nodejs-lts"
        echo ""
        echo "3. Via winget (Windows Package Manager) :"
        echo "     winget install OpenJS.NodeJS.LTS"
        ;;
    *)
        echo "❓ Système non reconnu : $OS"
        echo ""
        echo "Veuillez installer Node.js manuellement depuis :"
        echo "  https://nodejs.org/"
        ;;
esac

echo ""
echo "📖 Après l'installation, exécutez :"
echo "   npm install"
echo "   npm run dev"
echo ""

