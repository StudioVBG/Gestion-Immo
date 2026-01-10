# TALOK - Rapport de Vérification des Flux Complet

**Date:** 10 Janvier 2026
**Analyseur:** Claude Code (Opus 4.5)
**Portée:** Flux de création, formulaires, données, tâches, paiements, fonctions

---

## Table des Matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Flux de Création](#2-flux-de-création)
3. [Formulaires et Validation](#3-formulaires-et-validation)
4. [Flux de Paiement](#4-flux-de-paiement)
5. [Tâches et Jobs](#5-tâches-et-jobs)
6. [Opérations de Données](#6-opérations-de-données)
7. [Services et Fonctions](#7-services-et-fonctions)
8. [Problèmes Critiques](#8-problèmes-critiques)
9. [Recommandations](#9-recommandations)

---

## 1. Résumé Exécutif

### Statistiques Globales

| Catégorie | Total | Avec Validation | Sans Validation |
|-----------|-------|-----------------|-----------------|
| **Routes API** | 390 | 97 (24.9%) | 293 (75.1%) |
| **Formulaires** | 14 | 3 avec Zod | 11 basiques |
| **Server Actions** | 5 fichiers | 3 sécurisés | 2 avec lacunes |
| **CRON Jobs** | 10 | 10 configurés | 0 manquants |
| **Edge Functions** | 7 | 6 fonctionnels | 1 incomplet |
| **Services** | 37 | 30 complets | 7 avec TODOs |

### Score de Maturité par Domaine

```
Authentification       ██████████░░ 85%  - Passkeys + 2FA implémentés
Création Propriété     ████████░░░░ 70%  - V3 schema, quelques lacunes
Création Bail          ███████░░░░░ 65%  - Multi-signataires OK, gaps
Paiements              ████████░░░░ 75%  - Stripe complet, SEPA partiel
Facturation            ███████░░░░░ 60%  - CRON OK, régularisation TODO
Notifications          █████░░░░░░░ 45%  - Email OK, SMS/Push incomplets
Documents              ██████░░░░░░ 55%  - Upload OK, OCR partiel
EDL                    ███████░░░░░ 65%  - Compteurs OK, comparaison TODO
```

---

## 2. Flux de Création

### 2.1 Création de Propriété

**Statut:** ⚠️ Fonctionnel avec lacunes

```
Flux:
PropertyWizardV3 → Zod Validation → Server Action → Supabase Insert → Triggers

Points forts:
✅ Validation V3 complète (40+ champs)
✅ Génération code unique automatique
✅ Support parking, commercial, résidentiel
✅ Photos avec upload pré-signé

Lacunes identifiées:
❌ Pas de rollback si upload média échoue
❌ Création rooms avant property possible (orphelins)
❌ Pas de progress tracking pour uploads
❌ DPE non auto-rempli depuis API gouvernementale
```

**Fichiers concernés:**
- `/app/owner/properties/new/` - Wizard V3
- `/app/owner/properties/actions.ts` - Server actions
- `/lib/validations/property-v3.ts` - Schéma Zod

### 2.2 Création de Bail

**Statut:** ⚠️ Fonctionnel avec gaps

```
Flux:
LeaseWizard (3 étapes) → Validation → API /leases/invite → Email invitations

Points forts:
✅ Multi-signataires (propriétaire, locataire, colocataires, garant)
✅ Calcul automatique dépôt légal
✅ Support tous types de baux (nu, meublé, commercial, etc.)
✅ Génération PDF contrat

Lacunes identifiées:
❌ Pas de validation email déjà locataire actif
❌ Pas de détection chevauchement baux (même bien)
❌ Téléphone garant non collecté
❌ Email envoyé sans retry queue
❌ Pas de rate limiting sur invitations
```

**Fichiers concernés:**
- `/features/leases/components/lease-form.tsx`
- `/app/api/leases/invite/route.ts`
- `/lib/validations/lease-financial.ts`

### 2.3 Création Utilisateur

**Statut:** ✅ Bien implémenté

```
Flux:
/signup/role/ → /signup/account/ → Supabase Auth → Trigger handle_new_user → Profile

Points forts:
✅ Validation mot de passe robuste (12+ chars, complexité)
✅ Support magic link + OAuth
✅ Onboarding par rôle (owner, tenant, provider, guarantor)
✅ Sauvegarde draft localStorage + DB

Lacunes identifiées:
❌ Pas de CAPTCHA protection (spam possible)
❌ Pas de vérification téléphone
❌ Pas de re-consentement si CGU changent
```

### 2.4 Création Ticket

**Statut:** ⚠️ Basique

```
Flux:
Form → ticketSchema.parse() → API POST → Outbox event → AI analysis async

Points forts:
✅ 5 catégories avec icônes visuelles
✅ 4 niveaux de priorité
✅ Analyse IA automatique (catégorisation, coût estimé)

Lacunes identifiées:
❌ Pas d'upload photo/pièce jointe à la création
❌ Provider assignment manuel (pas d'auto-dispatch)
❌ Pas de SLA enforcement
❌ Fee urgente affiché mais pas de paiement
```

### 2.5 Création Facture

**Statut:** ⚠️ Partiellement automatisé

```
Flux:
CRON mensuel → generate_monthly_invoices() RPC → Outbox Rent.InvoiceIssued

Points forts:
✅ Génération automatique 1er du mois
✅ Calcul loyer + charges
✅ Idempotent (évite doublons via période)

Lacunes identifiées:
❌ Reminder sending = TODO (juste log)
❌ Pas de template personnalisable
❌ Pas de paiement partiel trackable
❌ Pas de facture anticipée
❌ Email attachment non vérifié
```

### 2.6 Création EDL

**Statut:** ⚠️ Semi-automatique

```
Flux:
Signature bail → Trigger auto-create EDL entrée → Invitation tenant

Points forts:
✅ Auto-création sur signature
✅ Relevés compteurs avec OCR
✅ Multi-signatures (propriétaire + locataire)

Lacunes identifiées:
❌ Pas d'évaluation dommages pièce par pièce
❌ Seuil confiance OCR non enforced (~50% accepté)
❌ Pas de validation valeurs compteurs (peuvent aller en arrière)
❌ Photos floues acceptées
❌ Pas de workflow dispute
```

---

## 3. Formulaires et Validation

### 3.1 Inventaire des Formulaires

| Formulaire | Validation | Erreurs champ | Loading | Accessibilité |
|------------|------------|---------------|---------|---------------|
| Sign-in | ✅ Custom | ⚠️ Partiel | ✅ | ✅ |
| Lease | ✅ Zod + Custom | ⚠️ Limité | ✅ | ⚠️ |
| Owner Profile | ❌ HTML5 only | ❌ | ✅ | ❌ |
| Tenant Profile | ❌ HTML5 only | ❌ | ✅ | ❌ |
| Provider Profile | ❌ Schema défini mais non utilisé | ❌ | ✅ | ❌ |
| Document Upload | ⚠️ Taille seulement | ❌ | ✅ | ❌ |
| DPE Request | ⚠️ Basique | ❌ | ⚠️ | ❌ |
| Ticket | ⚠️ Required seulement | ❌ | ⚠️ | ❌ |
| Quote Request | ❌ alert() au lieu de toast | ❌ | ⚠️ | ❌ |

### 3.2 Schémas Zod Définis mais Non Utilisés

```typescript
// Ces schémas existent dans /lib/validations/index.ts mais ne sont PAS utilisés:

ownerProfileSchema     // SIRET, IBAN, BIC validation - NON UTILISÉ
tenantProfileSchema    // Revenus, situation - NON UTILISÉ
providerProfileSchema  // Type services, zones - NON UTILISÉ
chargeSchema          // Montant > 0 - NON UTILISÉ
ticketSchema          // Min lengths - PARTIELLEMENT UTILISÉ
documentSchema        // Type enum - NON UTILISÉ
```

### 3.3 Routes API Sans Validation (Critiques)

| Route | Méthode | Risque | Impact |
|-------|---------|--------|--------|
| `/api/copro/sites` | POST | 🔴 Injection | Données invalides |
| `/api/meters/readings` | POST | 🔴 Injection | Compteurs faux |
| `/api/end-of-lease/[id]/dg/retention` | POST | 🔴 Financier | Calcul erroné |
| `/api/charges` | GET | 🟠 RLS bypass | Accès non autorisé |
| ~290 autres routes | * | 🟡-🔴 | Variable |

### 3.4 Problèmes d'Accessibilité Formulaires

```
❌ aria-invalid manquant sur erreurs
❌ aria-describedby non lié aux messages
❌ aria-label manquant sur boutons icône
❌ Pas d'annonces screen reader pour erreurs
❌ Focus management incomplet dans modals
```

---

## 4. Flux de Paiement

### 4.1 Architecture Paiement

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUX DE PAIEMENT                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Stripe    │  │    SEPA     │  │   Espèces   │         │
│  │  Checkout   │  │   Mandate   │  │   (manual)  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              WEBHOOK HANDLER                         │   │
│  │  • checkout.session.completed                        │   │
│  │  • payment_intent.succeeded                          │   │
│  │  • payment_intent.payment_failed                     │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ACTIONS POST-PAIEMENT                   │   │
│  │  1. Update invoice status → "paid"                   │   │
│  │  2. Create payment record                            │   │
│  │  3. Generate receipt PDF                             │   │
│  │  4. Emit outbox event                                │   │
│  │  5. Send email confirmation                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Endpoints Paiement

| Endpoint | Statut | Notes |
|----------|--------|-------|
| `POST /api/payments/create-intent` | ✅ | Validation Zod, auth |
| `POST /api/payments/confirm` | ✅ | Rate limited |
| `POST /api/payments/checkout` | ✅ | Stripe session |
| `POST /api/payments/setup-sepa` | ⚠️ | Mandate OK, pas de scheduler |
| `POST /api/payments/cash-receipt` | ✅ | Double signature, hash |

### 4.3 Problèmes Paiement Identifiés

```
🔴 CRITIQUE:
- Pas de workflow vérification virement bancaire
- Pas de réconciliation avec relevés bancaires
- Pas de retry pour SEPA bounce

🟠 IMPORTANT:
- Pas de paiement partiel trackable
- Pas de late fee calculation
- Pas de plan paiement/échelonnement

🟡 MINEUR:
- Race condition possible webhook vs API confirm
- PDF génération bloque réponse webhook
```

### 4.4 Calculs Financiers

```typescript
// Frais de paiement par méthode
CB Standard:      2.2% (Stripe: 1.5% + 0.25€, marge: ~0.7%)
SEPA Standard:    0.50€ fixe (Stripe: 0.35€, marge: 0.15€)
Virement:         Gratuit

// Indexation IRL
Nouveau Loyer = Loyer Actuel × (IRL Nouveau / IRL Référence)
// Valeurs IRL hardcodées 2022-2024 seulement!

// TVA régionale
Métropole:    20%
Guadeloupe:   8.5%
Martinique:   8.5%
Guyane:       0%
La Réunion:   8.5%
Mayotte:      0%
```

---

## 5. Tâches et Jobs

### 5.1 CRON Jobs Configurés

| Job | Fréquence | Statut | Notes |
|-----|-----------|--------|-------|
| `/api/cron/generate-invoices` | 1er du mois 6h | ✅ | Idempotent |
| `/api/cron/generate-monthly-invoices` | 1er du mois | ✅ | Alternative |
| `/api/cron/lease-expiry-alerts` | Lundi 8h | ✅ | 90/60/30/15/7 jours |
| `/api/cron/rent-reminders` | Quotidien 9h | ✅ | J+5, J+10, J+15, J+30 |
| `/api/cron/check-cni-expiry` | Quotidien | ✅ | 30/15/7 jours + expiré |
| `/api/cron/subscription-alerts` | Quotidien 10h | ✅ | Trial + renewal |
| `/api/cron/irl-indexation` | 1er du mois | ⚠️ | IRL hardcodé |
| `/api/cron/refresh-analytics` | Quotidien 4h | ✅ | 5 vues matérialisées |
| `/api/cron/notifications` | Quotidien | ✅ | Batch process |
| `/api/cron/process-outbox` | - | ❌ | Stub vide |

### 5.2 Edge Functions

| Function | Trigger | Statut |
|----------|---------|--------|
| `process-outbox` | Polling/CRON | ✅ Retry + backoff |
| `monthly-invoicing` | CRON 1er mois | ✅ |
| `payment-reminders` | CRON quotidien | ✅ |
| `generate-pdf` | Event | ⚠️ PDFShift API |
| `bank-sync` | Manual | ⚠️ GoCardless partiel |
| `cleanup-exports` | CRON | ✅ |
| `analyze-documents` | Event | ⚠️ OCR partiel |

### 5.3 Événements Outbox

```typescript
// 20 types d'événements définis:
Rent.InvoiceIssued       // Facturation mensuelle
Payment.Succeeded        // Paiement réussi (tenant)
Payment.Received         // Paiement reçu (owner)
Payment.Reminder         // Rappel de paiement
Payment.OverdueAlert     // Alerte impayé critique
Ticket.Opened            // Nouveau ticket
Lease.Activated          // Bail activé
Lease.TenantSigned       // Locataire a signé
Lease.OwnerSigned        // Propriétaire a signé
Lease.FullySigned        // Tous ont signé
EDL.InvitationSent       // Invitation EDL
Property.DraftCreated    // Brouillon créé
Property.StepCompleted   // Étape wizard complétée
Property.PhotosAdded     // Photos ajoutées
Property.ReadyForReview  // Prêt pour validation
Property.Published       // Publié
Property.InvitationSent  // Invitation locataire
Property.TenantJoined    // Locataire rejoint
Legislation.Updated      // MAJ légale
application.ocr.completed // OCR terminé
```

### 5.4 Triggers Base de Données

| Trigger | Table | Action |
|---------|-------|--------|
| `trigger_activate_lease_on_edl_signed` | edl | Active bail si EDL entrée signé |
| `update_lease_status_on_signature` | lease_signers | Update status après signature |
| `notify_invoice_late` | invoices | Notifie owner si statut = late |
| `notify_payment_received` | payments | Notifie owner paiement reçu |
| `notify_lease_signed` | leases | Notifie owner bail actif |
| `notify_ticket_created` | tickets | Notifie owner nouveau ticket |
| 7 triggers tenant notifications | multiple | Diverses notifications |

### 5.5 Problèmes Jobs

```
🔴 CRITIQUE:
- /api/cron/process-outbox est un stub VIDE
- Pas de Dead Letter Queue pour événements failed
- Pas d'alerting pour échecs répétés

🟠 IMPORTANT:
- IRL hardcodé (pas de mise à jour automatique depuis INSEE)
- Push notifications TODO non implémenté
- SMS queue séparée de outbox (pas de retry)

🟡 MINEUR:
- Refresh analytics max 60s peut être insuffisant
- Webhook PDF génération bloque la réponse
```

---

## 6. Opérations de Données

### 6.1 Server Actions

| Action | Auth | Validation | Audit | Problème |
|--------|------|------------|-------|----------|
| `createTicketAction` | ✅ | ✅ Zod | ✅ | - |
| `updateTicketStatusAction` | ❌ | ❌ | ❌ | **CRITIQUE** |
| `createInvoiceAction` | ✅ | ✅ Zod | ✅ | N+1 queries |
| `updateInvoiceStatusAction` | ❌ | ❌ | ❌ | **CRITIQUE** |
| `updateProperty` | ✅ | ✅ V3 | ✅ | - |
| `deleteProperty` | ✅ | ✅ | ✅ | Hard delete |
| `markInvoiceAsPaid` | ✅ | ✅ | ✅ | - |
| `terminateLease` | ✅ | ✅ | ✅ | - |

### 6.2 Patterns RLS Problématiques

```sql
-- Récursion RLS identifiée et partiellement corrigée:
-- Le helper user_profile_id() peut retourner NULL dans certains contextes

-- Pattern correct:
CREATE FUNCTION public.user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Problème: Certaines policies utilisent encore auth.uid() directement
-- ce qui peut échouer avec "auth.uid() = NULL"
```

### 6.3 Indexes Manquants

```sql
-- Recommandés pour performance:
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_leases_property_id_statut ON leases(property_id, statut);
CREATE INDEX idx_invoices_owner_id_periode ON invoices(owner_id, periode DESC);
CREATE INDEX idx_tickets_created_by ON tickets(created_by_profile_id, created_at DESC);
CREATE INDEX idx_documents_property_id ON documents(property_id);
CREATE INDEX idx_charges_property_id ON charges(property_id);
```

### 6.4 Cascade Delete Manquant

```
Tables avec risque d'orphelins:
- documents → property (NO CASCADE)
- charges → property (NO CASCADE)
- tickets → property (NO CASCADE)
- photos → property (NO CASCADE)

Recommandation: Implémenter soft delete avec deleted_at
```

---

## 7. Services et Fonctions

### 7.1 Services avec TODOs Critiques

| Service | Fichier | TODO |
|---------|---------|------|
| Email Service | email-service.ts:278 | Intégrer email réel |
| SMS Service | email-service.ts:289 | Intégrer SMS réel |
| Quote Service | quote-service.ts:165 | Notifications |
| Copro Régularisation | regularisation.service.ts:221 | Notifications |
| Push Notifications | process-outbox:646 | Web Push API |
| PDF Service | generate-pdf:190 | Native PDF lib |
| Lease Service | leases.service.ts:105 | eIDAS provider |
| End-of-Lease | end-of-lease.service.ts:310 | Email quotes |

### 7.2 Services Complets

| Service | Méthodes | Statut |
|---------|----------|--------|
| Auth Service | 15+ | ✅ Passkeys + 2FA |
| Stripe Service | 10+ | ✅ Complet |
| Rental Calculator | 8 | ✅ Complet |
| Activity Log | 5 | ✅ Audit trail |
| API Keys Service | 4 | ✅ Rotation |

### 7.3 Problèmes Services

```
🔴 HAUTE SÉVÉRITÉ:
- email-service.ts:118: Fallback hardcodé "onboarding@resend.dev"
- payments.service.ts: Pas d'idempotency key
- chat.service.ts:396-400: WebSocket désactivé silencieusement
- ocr-service.ts:219-232: Mode simulé non indiqué utilisateur

🟠 MOYENNE SÉVÉRITÉ:
- auth.service.ts: Pas de rate limit password reset
- leases.service.ts:125-127: Transitions status non validées
- invoices.service.ts:29-35: Filtrage client-side (N+1)
- document-ai.service.ts:23: Pas de retry LangGraph
```

---

## 8. Problèmes Critiques

### 8.1 Sécurité

| ID | Problème | Fichier | Ligne |
|----|----------|---------|-------|
| SEC-01 | Auth manquante updateTicketStatusAction | tickets.ts | 86-100 |
| SEC-02 | Auth manquante updateInvoiceStatusAction | invoices.ts | 96-110 |
| SEC-03 | Ownership non vérifié charges GET | charges/route.ts | 24-30 |
| SEC-04 | File upload sans MIME validation | documents/upload | 43-50 |
| SEC-05 | File upload sans size limit | documents/upload | 43-50 |
| SEC-06 | Service role key exposé | multiple | - |

### 8.2 Données

| ID | Problème | Impact |
|----|----------|--------|
| DAT-01 | 293 routes sans validation Zod | Injection SQL/données invalides |
| DAT-02 | Pas de soft delete généralisé | Perte données accidentelle |
| DAT-03 | Cascade delete non configuré | Données orphelines |
| DAT-04 | Migration V2→V3 incomplète | Propriétés legacy orphelines |
| DAT-05 | Indexes manquants | Queries lentes |

### 8.3 Fonctionnalité

| ID | Problème | Impact |
|----|----------|--------|
| FUNC-01 | Dead Letter Queue absente | Perte événements |
| FUNC-02 | SMS/Push non implémentés | Notifications manquantes |
| FUNC-03 | IRL hardcodé | Indexation incorrecte 2025+ |
| FUNC-04 | Virement non vérifié | Réconciliation manuelle |
| FUNC-05 | SEPA scheduler absent | Prélèvements manuels |

### 8.4 UX

| ID | Problème | Impact |
|----|----------|--------|
| UX-01 | ARIA insuffisant | Accessibilité réduite |
| UX-02 | Erreurs champ non affichées | UX formulaires pauvre |
| UX-03 | Loading states inconsistants | Confusion utilisateur |
| UX-04 | alert() au lieu de toast | UX incohérente |

---

## 9. Recommandations

### 9.1 Actions Immédiates (P0 - Cette semaine)

```
1. Ajouter auth check à updateTicketStatusAction et updateInvoiceStatusAction
   Fichiers: features/tickets/actions/tickets.ts, features/billing/actions/invoices.ts

2. Ajouter validation Zod aux routes critiques:
   - /api/copro/sites
   - /api/meters/readings
   - /api/charges (GET ownership)

3. Implémenter file upload security:
   - Size limit (50MB max)
   - MIME type whitelist
   - Extension validation

4. Créer Dead Letter Queue:
   - Table failed_events
   - Admin UI pour retry manuel
   - Alerting Slack/email
```

### 9.2 Actions Court Terme (P1 - Ce mois)

```
1. Compléter validation formulaires:
   - Utiliser ownerProfileSchema, tenantProfileSchema, providerProfileSchema
   - Ajouter erreurs champ-niveau dans UI

2. Implémenter soft delete:
   - Ajouter deleted_at à properties, documents, tickets
   - Modifier RLS pour filtrer deleted_at IS NULL

3. Ajouter indexes manquants (voir section 6.3)

4. Implémenter SMS via outbox:
   - Unifier avec event processing
   - Ajouter retry logic
```

### 9.3 Actions Moyen Terme (P2 - Ce trimestre)

```
1. Compléter intégrations:
   - SMS Twilio réel
   - Push notifications Web Push API
   - IRL depuis API INSEE

2. Améliorer paiements:
   - Workflow virement bancaire
   - SEPA scheduler récurrent
   - Paiement partiel

3. Améliorer accessibilité:
   - ARIA complet sur formulaires
   - Focus management modals
   - Screen reader testing
```

### 9.4 Actions Long Terme (P3 - Ce semestre)

```
1. Architecture:
   - API versioning v1/v2
   - Multi-tenant isolation
   - Event sourcing complet

2. Performance:
   - Cache Redis/Vercel KV
   - Query optimization
   - Materialized views étendues

3. Testing:
   - Coverage unit tests 80%+
   - E2E tests sur flux critiques
   - RLS policy tests
```

---

## Annexe: Fichiers Clés

### Server Actions
```
/features/tickets/actions/tickets.ts
/features/billing/actions/invoices.ts
/app/owner/properties/actions.ts
/app/owner/money/actions.ts
/app/owner/leases/actions.ts
```

### Validation Schemas
```
/lib/validations/index.ts
/lib/validations/property-v3.ts
/lib/validations/lease-financial.ts
/lib/validations/schemas-shared.ts
/lib/validations/onboarding.ts
```

### Services
```
/lib/services/email-service.ts
/lib/services/stripe.service.ts
/lib/services/notification-service.ts
/features/auth/services/auth.service.ts
/features/billing/services/invoices.service.ts
```

### Edge Functions
```
/supabase/functions/process-outbox/index.ts
/supabase/functions/monthly-invoicing/index.ts
/supabase/functions/payment-reminders/index.ts
/supabase/functions/generate-pdf/index.ts
```

---

**Fin du Rapport**

*Ce rapport a été généré par Claude Code (Opus 4.5) le 10 Janvier 2026.*
