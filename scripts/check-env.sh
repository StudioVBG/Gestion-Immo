#!/bin/bash

# Script de vérification des variables d'environnement

echo "🔍 Vérification de la configuration..."
echo ""

ERRORS=0

# Vérifier .env.local
if [ ! -f .env.local ]; then
    echo "❌ Fichier .env.local manquant"
    echo "   → Copiez env.example vers .env.local"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Fichier .env.local existe"
    
    # Vérifier les variables obligatoires
    source .env.local 2>/dev/null
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        echo "❌ NEXT_PUBLIC_SUPABASE_URL manquant dans .env.local"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ NEXT_PUBLIC_SUPABASE_URL configuré"
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY manquant dans .env.local"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configuré"
    fi
fi

# Vérifier node_modules
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules manquant"
    echo "   → Exécutez : npm install"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Dépendances installées"
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ Configuration OK ! Vous pouvez lancer : npm run dev"
    exit 0
else
    echo "❌ $ERRORS erreur(s) détectée(s). Veuillez les corriger."
    exit 1
fi

