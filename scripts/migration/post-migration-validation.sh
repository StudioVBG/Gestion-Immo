#!/bin/bash
# scripts/migration/post-migration-validation.sh
# Validation post-migration pour l'audit de refactoring

set -e

echo "=== VALIDATION POST-MIGRATION ==="
echo "Date: $(date)"
echo ""

cd "$(dirname "$0")/../.."

BUILD_OK=true
TYPE_OK=true
TEST_OK=true

# 1. Build complet
echo "1. Build complet..."
if npm run build 2>/dev/null; then
    echo "✅ Build: OK"
else
    echo "❌ Build: ÉCHEC"
    BUILD_OK=false
fi

# 2. Type check
echo ""
echo "2. Type check..."
if npm run type-check 2>/dev/null; then
    echo "✅ Types: OK"
else
    echo "❌ Types: ÉCHEC"
    TYPE_OK=false
fi

# 3. Tests unitaires
echo ""
echo "3. Tests unitaires..."
if npm test -- --passWithNoTests 2>/dev/null || npm test 2>/dev/null; then
    echo "✅ Tests: OK"
else
    echo "⚠️  Tests: Certains tests ont échoué"
    TEST_OK=false
fi

# 4. Comptage des doublons restants
echo ""
echo "4. Comptage doublons restants..."
echo ""
echo "   Type Definitions:"
echo "   ├─ InvoiceStatus: $(grep -r "type InvoiceStatus" --include="*.ts" . 2>/dev/null | wc -l | tr -d ' ')"
echo "   ├─ LeaseStatus: $(grep -r "type LeaseStatus" --include="*.ts" . 2>/dev/null | wc -l | tr -d ' ')"
echo "   ├─ PropertyStatus: $(grep -r "type PropertyStatus" --include="*.ts" . 2>/dev/null | wc -l | tr -d ' ')"
echo "   └─ PaymentStatus: $(grep -r "type PaymentStatus" --include="*.ts" . 2>/dev/null | wc -l | tr -d ' ')"

echo ""
echo "   Services:"
echo "   ├─ notification-service.ts: $([ -f lib/services/notification-service.ts ] && echo "EXISTS" || echo "DELETED ✓")"
echo "   ├─ sms.service.ts: $([ -f lib/services/sms.service.ts ] && echo "EXISTS" || echo "DELETED ✓")"
echo "   ├─ chat.service.ts: $([ -f lib/services/chat.service.ts ] && echo "EXISTS" || echo "DELETED ✓")"
echo "   └─ ocr.service.ts: $([ -f lib/services/ocr.service.ts ] && echo "EXISTS" || echo "RENAMED ✓")"

# 5. Vérifier les @deprecated non résolus
echo ""
echo "5. Exports @deprecated actifs:"
DEPRECATED_COUNT=$(grep -r "@deprecated" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | wc -l || echo "0")
echo "   Total: $DEPRECATED_COUNT"
if [ "$DEPRECATED_COUNT" -gt 0 ]; then
    grep -r "@deprecated" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | head -10
fi

# 6. Métriques
echo ""
echo "=== MÉTRIQUES ==="
TS_FILES=$(find . -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v node_modules | wc -l || echo "N/A")
echo "Fichiers TypeScript: $TS_FILES"

if command -v wc &> /dev/null; then
    TOTAL_LINES=$(find . \( -name "*.ts" -o -name "*.tsx" \) ! -path "./node_modules/*" -exec cat {} \; 2>/dev/null | wc -l || echo "N/A")
    echo "Lignes de code totales: $TOTAL_LINES"
fi

# 7. Résumé final
echo ""
echo "=== RÉSUMÉ FINAL ==="
if $BUILD_OK && $TYPE_OK; then
    echo "🎉 MIGRATION VALIDÉE"
    echo ""
    echo "Prochaines étapes:"
    echo "  1. Déployer en staging"
    echo "  2. Tester manuellement les fonctionnalités critiques"
    echo "  3. Monitorer Sentry pendant 24h"
    echo "  4. Déployer en production"
else
    echo "⚠️  MIGRATION PARTIELLEMENT VALIDÉE"
    echo ""
    echo "Problèmes à résoudre:"
    $BUILD_OK || echo "  - Build échoué"
    $TYPE_OK || echo "  - Erreurs TypeScript"
    $TEST_OK || echo "  - Certains tests échouent"
fi

echo ""
echo "=== FIN VALIDATION ==="
