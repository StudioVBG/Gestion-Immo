#!/bin/bash
# scripts/migration/pr1-cleanup-isolated.sh
# PR 1: Nettoyage Services Isolés
# - Supprimer notification-service.ts (non utilisé)
# - Renommer ocr.service.ts → meter-ocr.service.ts

set -e

echo "=== MIGRATION PR 1: Nettoyage Services Isolés ==="
echo "Date: $(date)"
echo ""

cd "$(dirname "$0")/../.."

# Étape 1: Backup
echo "1. Création backup..."
mkdir -p .migration-backup/pr1
cp lib/services/notification-service.ts .migration-backup/pr1/ 2>/dev/null || echo "   notification-service.ts non trouvé"
cp lib/services/ocr.service.ts .migration-backup/pr1/ 2>/dev/null || echo "   ocr.service.ts non trouvé"

# Étape 2: Vérifier que notification-service n'est pas utilisé
echo ""
echo "2. Vérification notification-service..."
IMPORTS=$(grep -r "from.*notification-service" --include="*.ts" --include="*.tsx" . 2>/dev/null | wc -l || echo "0")
if [ "$IMPORTS" -gt 0 ]; then
    echo "❌ STOP: notification-service est encore utilisé!"
    grep -r "from.*notification-service" --include="*.ts" --include="*.tsx" .
    echo ""
    echo "Corrigez ces imports avant de continuer."
    exit 1
fi
echo "✅ Aucun import trouvé"

# Étape 3: Supprimer notification-service.ts
echo ""
echo "3. Suppression notification-service.ts..."
if [ -f lib/services/notification-service.ts ]; then
    rm -f lib/services/notification-service.ts
    echo "✅ Supprimé: lib/services/notification-service.ts"
else
    echo "⚠️  Fichier déjà supprimé ou non trouvé"
fi

# Étape 4: Vérifier les imports de ocr.service.ts
echo ""
echo "4. Vérification imports ocr.service.ts..."
OCR_IMPORTS=$(grep -r "from.*ocr\.service" --include="*.ts" --include="*.tsx" . 2>/dev/null || true)
if [ -n "$OCR_IMPORTS" ]; then
    echo "   Imports trouvés:"
    echo "$OCR_IMPORTS"
fi

# Étape 5: Renommer ocr.service.ts
echo ""
echo "5. Renommage ocr.service.ts → meter-ocr.service.ts..."
if [ -f lib/services/ocr.service.ts ]; then
    mv lib/services/ocr.service.ts lib/services/meter-ocr.service.ts
    echo "✅ Renommé"

    # Mettre à jour les imports
    echo ""
    echo "6. Mise à jour des imports..."
    # macOS compatible
    if [[ "$OSTYPE" == "darwin"* ]]; then
        find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" ! -path "./.migration-backup/*" -exec sed -i '' 's/from ["\x27]@\/lib\/services\/ocr\.service["\x27]/from "@\/lib\/services\/meter-ocr.service"/g' {} \;
        find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" ! -path "./.migration-backup/*" -exec sed -i '' 's/from ["\x27]\.\.\/ocr\.service["\x27]/from "..\/meter-ocr.service"/g' {} \;
        find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" ! -path "./.migration-backup/*" -exec sed -i '' 's/from ["\x27]\.\/ocr\.service["\x27]/from ".\/meter-ocr.service"/g' {} \;
    else
        find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" ! -path "./.migration-backup/*" -exec sed -i 's/from ["'"'"']@\/lib\/services\/ocr\.service["'"'"']/from "@\/lib\/services\/meter-ocr.service"/g' {} \;
        find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" ! -path "./.migration-backup/*" -exec sed -i 's/from ["'"'"']\.\.\/ocr\.service["'"'"']/from "..\/meter-ocr.service"/g' {} \;
        find . -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" ! -path "./.migration-backup/*" -exec sed -i 's/from ["'"'"']\.\/ocr\.service["'"'"']/from ".\/meter-ocr.service"/g' {} \;
    fi
    echo "✅ Imports mis à jour"
else
    echo "⚠️  ocr.service.ts non trouvé"
fi

# Étape 7: Vérifier le build
echo ""
echo "7. Vérification build..."
if npm run type-check; then
    echo "✅ Build OK"
else
    echo "❌ Build échoué"
    echo ""
    echo "Pour restaurer:"
    echo "  cp .migration-backup/pr1/* lib/services/"
    exit 1
fi

echo ""
echo "=== MIGRATION PR 1 TERMINÉE ==="
echo ""
echo "Prochaines étapes:"
echo "  git add -A"
echo "  git commit -m 'chore: cleanup isolated services (PR 1)'"
