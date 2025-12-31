#!/bin/bash

# Script pour appliquer les migrations Supabase

echo "🔍 Vérification de la configuration Supabase..."
echo ""

# Vérifier si .env.local existe
if [ ! -f .env.local ]; then
    echo "❌ Fichier .env.local non trouvé"
    echo "   Créez-le avec: cp env.example .env.local"
    exit 1
fi

# Charger les variables d'environnement
source .env.local 2>/dev/null

# Vérifier les variables nécessaires
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Variables Supabase non configurées dans .env.local"
    echo "   Configurez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY"
    exit 1
fi

echo "✅ Configuration Supabase trouvée"
echo "   URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI n'est pas installé"
    echo "   Installez-le avec: npm install -g supabase"
    echo ""
    echo "📝 Pour appliquer les migrations manuellement:"
    echo "   1. Allez sur https://app.supabase.com"
    echo "   2. Ouvrez votre projet"
    echo "   3. Allez dans SQL Editor"
    echo "   4. Exécutez les fichiers de migration dans l'ordre depuis supabase/migrations/"
    exit 1
fi

echo "✅ Supabase CLI détecté"
echo ""

# Vérifier si le projet est lié
if [ -d ".supabase" ]; then
    echo "✅ Projet Supabase lié localement"
    echo ""
    echo "🚀 Application des migrations..."
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migrations appliquées avec succès!"
    else
        echo ""
        echo "❌ Erreur lors de l'application des migrations"
        echo ""
        echo "💡 Si le projet n'est pas lié, utilisez:"
        echo "   supabase link --project-ref votre-project-ref"
        exit 1
    fi
else
    echo "⚠️  Projet Supabase non lié localement"
    echo ""
    echo "📝 Pour lier le projet et appliquer les migrations:"
    echo ""
    echo "   1. Récupérez votre Project Reference depuis https://app.supabase.com"
    echo "   2. Exécutez: supabase link --project-ref votre-project-ref"
    echo "   3. Relancez ce script: bash scripts/apply-migrations.sh"
    echo ""
    echo "   OU appliquez les migrations manuellement via l'interface Supabase:"
    echo "   - Allez dans SQL Editor"
    echo "   - Exécutez les fichiers de migration dans l'ordre depuis supabase/migrations/"
    echo ""
    exit 0
fi

