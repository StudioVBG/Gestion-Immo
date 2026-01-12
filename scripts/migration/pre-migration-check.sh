#!/bin/bash
# scripts/migration/pre-migration-check.sh
# Vérification pré-migration pour l'audit de refactoring

set -e

echo "=== VÉRIFICATION PRÉ-MIGRATION ==="
echo "Date: $(date)"
echo ""

cd "$(dirname "$0")/../.."

echo "1. Vérification des imports notification-service..."
NOTIF_IMPORTS=$(grep -r "from.*notification-service" --include="*.ts" --include="*.tsx" . 2>/dev/null | wc -l || echo "0")
if [ "$NOTIF_IMPORTS" -gt 0 ]; then
    echo "⚠️  $NOTIF_IMPORTS imports trouvés pour notification-service"
    grep -r "from.*notification-service" --include="*.ts" --include="*.tsx" . 2>/dev/null || true
else
    echo "✅ Aucun import notification-service"
fi

echo ""
echo "2. Vérification des imports sms.service..."
SMS_IMPORTS=$(grep -r "from.*sms\.service" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v "sms-service" | wc -l || echo "0")
echo "📊 $SMS_IMPORTS imports pour sms.service.ts (ancien)"

echo ""
echo "3. Vérification des imports chat.service..."
CHAT_IMPORTS=$(grep -r "from.*[^-]chat\.service" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v "unified-chat" | wc -l || echo "0")
echo "📊 $CHAT_IMPORTS imports pour chat.service.ts (ancien)"

echo ""
echo "4. Comptage des définitions InvoiceStatus..."
INVOICE_STATUS=$(grep -r "type InvoiceStatus" --include="*.ts" . 2>/dev/null | wc -l || echo "0")
echo "📊 $INVOICE_STATUS définitions de InvoiceStatus"
if [ "$INVOICE_STATUS" -gt 1 ]; then
    echo "   Fichiers:"
    grep -r "type InvoiceStatus" --include="*.ts" . 2>/dev/null | head -10
fi

echo ""
echo "5. Comptage des définitions LeaseStatus..."
LEASE_STATUS=$(grep -r "type LeaseStatus" --include="*.ts" . 2>/dev/null | wc -l || echo "0")
echo "📊 $LEASE_STATUS définitions de LeaseStatus"
if [ "$LEASE_STATUS" -gt 1 ]; then
    echo "   Fichiers:"
    grep -r "type LeaseStatus" --include="*.ts" . 2>/dev/null | head -10
fi

echo ""
echo "6. Comptage des définitions PropertyStatus..."
PROP_STATUS=$(grep -r "type PropertyStatus" --include="*.ts" . 2>/dev/null | wc -l || echo "0")
echo "📊 $PROP_STATUS définitions de PropertyStatus"

echo ""
echo "7. Vérification dépendances circulaires..."
if command -v npx &> /dev/null; then
    npx madge --circular --extensions ts,tsx ./lib 2>/dev/null || echo "⚠️  madge non installé ou erreur"
else
    echo "⚠️  npx non disponible"
fi

echo ""
echo "8. Build test..."
if npm run type-check 2>/dev/null; then
    echo "✅ Type-check OK"
else
    echo "⚠️  Type-check a des erreurs (peut être normal)"
fi

echo ""
echo "=== RÉSUMÉ ==="
echo "Notification-service imports: $NOTIF_IMPORTS"
echo "SMS.service imports: $SMS_IMPORTS"
echo "Chat.service imports: $CHAT_IMPORTS"
echo "InvoiceStatus definitions: $INVOICE_STATUS"
echo "LeaseStatus definitions: $LEASE_STATUS"
echo "PropertyStatus definitions: $PROP_STATUS"

echo ""
echo "=== FIN VÉRIFICATION ==="
