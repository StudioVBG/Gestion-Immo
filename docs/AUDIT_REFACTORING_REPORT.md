# AUDIT COMPLET ET PLAN DE REFACTORING - TALOK

**Date:** 12 Janvier 2026
**Version:** 1.0
**Auteur:** Audit Automatisé Claude

---

## TABLE DES MATIÈRES

1. [Résumé Exécutif](#résumé-exécutif)
2. [Phase 1: Cartographie](#phase-1-cartographie-complète)
3. [Phase 2: Doublons Détectés](#phase-2-doublons-détectés)
4. [Phase 3: Analyse des Dépendances](#phase-3-analyse-des-dépendances)
5. [Phase 4: Plan de Fusion Sécurisé](#phase-4-plan-de-fusion-sécurisé)

---

## RÉSUMÉ EXÉCUTIF

### Métriques Clés

| Métrique | Valeur |
|----------|--------|
| **Fichiers TypeScript/TSX** | 1,574 |
| **API Routes** | 419 |
| **Components** | 561 |
| **Hooks Personnalisés** | 50+ |
| **Types/Interfaces** | 725+ |
| **Services** | 94+ |
| **Code Dupliqué Estimé** | ~3,500 lignes |

### Problèmes Critiques Identifiés

| Priorité | Problème | Impact |
|----------|----------|--------|
| 🔴 CRITIQUE | 5 définitions différentes de `InvoiceStatus` | Conflits de types, incohérences |
| 🔴 CRITIQUE | 4 définitions différentes de `LeaseStatus` | Désynchronisation DB/Code |
| 🔴 CRITIQUE | 4 définitions différentes de `PropertyStatus` | Confusion sémantique |
| 🟡 ÉLEVÉ | Services dupliqués (notification, SMS, chat) | ~1,500 lignes redondantes |
| 🟡 ÉLEVÉ | Hooks CRUD répétitifs (7 hooks identiques) | ~1,000 lignes redondantes |
| 🟢 MOYEN | Components dupliqués (cards, lists) | ~500 lignes redondantes |

### Économies Potentielles

- **Lignes de code à supprimer:** ~3,500
- **Fichiers à consolider:** ~25
- **Types à unifier:** 5 types critiques
- **Services à fusionner:** 6 paires

---

## PHASE 1: CARTOGRAPHIE COMPLÈTE

### 1.1 Architecture Globale

```
TALOK/
├── app/                          [749 fichiers] - Next.js App Router
│   ├── api/                      [419 routes API]
│   ├── (dashboard)/              [Routes dashboard groupées]
│   ├── (public)/                 [Routes publiques]
│   ├── admin/                    [17 sections admin]
│   ├── owner/                    [27 sections propriétaire]
│   ├── tenant/                   [Sections locataire]
│   ├── provider/                 [14 sections prestataire]
│   └── copro/                    [7 sections copropriété]
│
├── lib/                          [252 fichiers] - Utilitaires partagés
│   ├── hooks/                    [40+ hooks React]
│   ├── types/                    [22 fichiers de types]
│   ├── services/                 [38+ services]
│   ├── supabase/                 [Client Supabase]
│   └── validations/              [Schémas Zod]
│
├── components/                   [247 fichiers] - Composants React
│   ├── ui/                       [64 composants shadcn/ui]
│   ├── dashboard/                [Widgets dashboard]
│   ├── owner/                    [Composants propriétaire]
│   └── [feature]/                [Composants par feature]
│
└── features/                     [226 fichiers] - Modules métier
    ├── accounting/               [Module comptabilité]
    ├── billing/                  [Module facturation]
    ├── leases/                   [Module baux]
    ├── properties/               [Module biens]
    └── [25 autres modules]
```

### 1.2 Stack Technologique

| Catégorie | Technologies |
|-----------|-------------|
| **Frontend** | Next.js 14.0.4, React 18.2.0, TypeScript 5.3.3 |
| **UI** | Shadcn/UI, Radix UI, Tailwind CSS 3.4.0, Framer Motion |
| **État** | React Query 5.x, Zustand 5.0.8 |
| **Backend** | Supabase 2.39.0 (PostgreSQL, Auth, Realtime) |
| **Paiements** | Stripe 20.0.0 |
| **AI** | LangChain, OpenAI SDK 4.104.0 |
| **Email** | Resend 6.5.2, SendGrid |
| **Mobile** | Capacitor 8.0.0, PWA |

### 1.3 Inventaire des Entités

#### Components (561 total)

| Catégorie | Nombre | Emplacement |
|-----------|--------|-------------|
| UI Primitifs | 64 | `components/ui/` |
| Pages | 300 | `app/*/page.tsx` |
| Features | 124 | `features/*/components/` |
| Owner | 22 | `components/owner/` |
| Layout | 10 | `components/layout/` |
| Dashboard | 11 | `components/dashboard/` |
| Admin | 8 | `components/admin/` |

#### Hooks (50+)

| Catégorie | Hooks | Fichier |
|-----------|-------|---------|
| **Auth** | useAuth, usePermissions, use2FARequired | `lib/hooks/` |
| **CRUD** | useProperties, useLeases, useInvoices, usePayments, useTickets, useDocuments | `lib/hooks/` |
| **Real-time** | useTenantRealtime, useRealtimeDashboard, useNotifications | `lib/hooks/` |
| **Forms** | useFormWithValidation, useApiMutation, useOptimisticMutation | `lib/hooks/` |
| **Utils** | useDebounce, usePrefetch, useLocalStorage | `lib/hooks/` |
| **Feature** | useLeaseValidation, useIdentityVerification | `features/*/hooks/` |

#### Types (725+ définitions)

| Fichier Principal | Contenu |
|-------------------|---------|
| `lib/types/index.ts` | UserRole, LeaseStatus, InvoiceStatus, DocumentType, Profile, Property, Lease |
| `lib/types/status.ts` | Tous les status consolidés (SOTA 2026) |
| `lib/types/property-v3.ts` | PropertyTypeV3, équipements, types de bail |
| `lib/subscriptions/types.ts` | Subscription, SubscriptionInvoiceStatus |
| `lib/types/invoicing.ts` | ProviderInvoice, InvoiceItem |
| `features/accounting/types/` | Types comptables, FEC, CRG |

#### Services (94+)

| Catégorie | Services Principaux |
|-----------|-------------------|
| **Communication** | email-service, sms-service, notification.service |
| **Paiements** | stripe.service, payments.service |
| **Documents** | pdf.service, ocr-service, document-ai.service |
| **Auth** | otp-service, vault-service, france-identite-service |
| **Business** | invoices.service, leases.service, properties.service |

---

## PHASE 2: DOUBLONS DÉTECTÉS

### 2.1 Types en Conflit (CRITIQUE)

#### PropertyStatus (4 définitions différentes)

| Fichier | Valeurs | Usage |
|---------|---------|-------|
| `lib/types/index.ts` | brouillon, en_attente, published, publie, rejete, rejected, archive, archived | Legacy, FR/EN mixte |
| `lib/owner/types.ts` | loue, en_preavis, vacant, a_completer | Statut opérationnel |
| `lib/types/status.ts` | draft, pending_review, published, rejected, archived | **CANONIQUE** (SOTA 2026) |
| `components/properties/types.ts` | vacant, loue, en_travaux, signature_en_cours | UI local |

**Problème:** Deux concepts différents mélangés:
- **Publication Status:** draft → pending_review → published/rejected → archived
- **Operational Status:** vacant, rented, notice_period, incomplete

#### LeaseStatus (4 définitions différentes)

| Fichier | Valeurs | Notes |
|---------|---------|-------|
| `lib/types/index.ts` | 11 valeurs (draft, sent, pending_signature...) | Le plus complet mais incohérent DB |
| `lib/owner/types.ts` | 4 valeurs | Simplifié |
| `lib/types/status.ts` | 8 valeurs | **CANONIQUE** - Proche DB |
| `components/properties/types.ts` | 5 valeurs + "expired" | Local |

**DB Schema:** `draft, pending_signature, partially_signed, fully_signed, active, terminated, archived, cancelled`

#### InvoiceStatus (5 définitions différentes)

| Fichier | Valeurs | Contexte |
|---------|---------|----------|
| `lib/types/index.ts` | draft, sent, paid, late | Simple (4) - **DB SCHEMA** |
| `lib/owner/types.ts` | Identique | Copie |
| `lib/subscriptions/types.ts` | draft, open, paid, void, uncollectible | Stripe |
| `lib/types/status.ts` | draft, sent, viewed, partial, paid, late, cancelled | SOTA 2026 (7) |
| `lib/types/invoicing.ts` | 9 valeurs (+ overdue, disputed, credited) | Provider |

**Problème Critique:** Le code utilise des valeurs (viewed, partial) non supportées par la DB!

### 2.2 Services Dupliqués

| Service 1 | Service 2 | Similarité | Canonical | Action |
|-----------|-----------|------------|-----------|--------|
| `notification.service.ts` | `notification-service.ts` | 40% | notification.service.ts | SUPPRIMER notification-service.ts |
| `sms.service.ts` | `sms-service.ts` | 60% | sms-service.ts | FUSIONNER puis supprimer sms.service.ts |
| `chat.service.ts` | `unified-chat.service.ts` | 45% | unified-chat.service.ts | MIGRER vers unified |
| `ocr.service.ts` | `ocr-service.ts` | 5% | DIFFÉRENTS | RENOMMER ocr.service → meter-ocr.service |
| `export.service.ts` | `export-service.ts` | 25% | DIFFÉRENTS | CLARIFIER noms (job vs generator) |

**Code Dupliqué Total Services:** ~1,500 lignes

### 2.3 Components Dupliqués

| Component 1 | Component 2 | Similarité | Action |
|-------------|-------------|------------|--------|
| `components/properties/PropertyCard` | `features/properties/property-card` | 50% | Ajouter variant prop |
| `components/leases/LeaseCard` | `features/leases/lease-card` | 60% | FUSIONNER avec variant |
| `components/chat/conversations-list` | `unified-conversations-list` | 70% | MIGRER vers unified |
| `features/billing/invoices-list` | `invoice-list-unified` | 80% | MIGRER vers unified |
| `features/tickets/tickets-list` | `ticket-list-unified` | 80% | MIGRER vers unified |

**Déjà Consolidés (KPI Cards):** ✅
- `components/ui/kpi-card.tsx` est la version canonique
- Les anciennes versions (`dashboard/KpiCard`, `owner/OwnerKpiCard`) re-exportent avec @deprecated

### 2.4 Hooks Dupliqués

#### Pattern CRUD Répétitif (7 hooks identiques)

```typescript
// Ce pattern est répété 7 fois (~150 lignes chaque):
- use-properties.ts
- use-leases.ts
- use-invoices.ts
- use-payments.ts
- use-tickets.ts
- use-documents.ts
- use-rooms.ts

// Structure identique:
export function use[Entity]() { ... }
export function use[Entity](id) { ... }
export function useCreate[Entity]() { ... }
export function useUpdate[Entity]() { ... }
export function useDelete[Entity]() { ... }
```

**Économie Potentielle:** ~1,000 lignes via factory générique

#### Real-time Hooks Similaires

| Hook | Lignes | Overlap |
|------|--------|---------|
| `use-realtime-tenant.ts` | 585 | Supabase channel, toast, event handling |
| `use-realtime-dashboard.ts` | 440 | Même pattern, données différentes |

**Économie Potentielle:** ~200 lignes via extraction pattern

#### Mutation Hooks Concurrents

- `use-mutation-with-toast.ts` - Simple, générique
- `use-optimistic-mutation.ts` - Complet avec variants

**Action:** Documenter quand utiliser chaque pattern ou consolider

### 2.5 Tableau Récapitulatif des Doublons

| Catégorie | Doublons | Lignes Redondantes | Risque |
|-----------|----------|-------------------|--------|
| Types Status | 3 types × 4-5 defs | N/A (définitions) | 🔴 CRITIQUE |
| Services | 5 paires | ~1,500 | 🟡 ÉLEVÉ |
| Hooks CRUD | 7 hooks | ~1,000 | 🟡 ÉLEVÉ |
| Components | 5 paires | ~500 | 🟢 MOYEN |
| Real-time | 2 hooks | ~200 | 🟢 MOYEN |
| **TOTAL** | | **~3,200 lignes** | |

---

## PHASE 3: ANALYSE DES DÉPENDANCES

### 3.1 Fichiers à Haut Impact (High-Impact)

#### TIER 1 - CATASTROPHIQUE (100-150+ fichiers cassent)

| Fichier | Importé Par | Risque |
|---------|-------------|--------|
| `lib/types/index.ts` | 150+ fichiers | Types centraux, toute modif cascade |
| `lib/supabase/client.ts` | 48+ fichiers via useAuth | Singleton auth client |
| `lib/supabase/database.types.ts` | Toutes queries | Types générés DB |
| `lib/hooks/use-auth.ts` | 11+ hooks | Foundation auth |

#### TIER 2 - SÉVÈRE (30-99 fichiers cassent)

| Fichier | Importé Par | Risque |
|---------|-------------|--------|
| `lib/api-client.ts` | 30+ services | Client HTTP unifié |
| `features/billing/services/invoices.service.ts` | 20+ fichiers | Facturation |
| `lib/hooks/use-properties.ts` | 15+ composants | Property CRUD |

#### TIER 3 - SIGNIFICATIF (10-29 fichiers cassent)

| Fichier | Importé Par |
|---------|-------------|
| `lib/rbac.ts` | Permissions UI |
| `components/ui/*` | 64 composants base |
| API routes `/api/owner/properties` | Hooks properties |

### 3.2 Graphe de Dépendances

```
COUCHES D'ARCHITECTURE (pas de dépendances circulaires ✅)

Layer 1 - Core (Aucune dépendance):
├─ lib/types/*.ts
└─ lib/validations/*.ts

Layer 2 - Infrastructure:
├─ lib/supabase/client.ts → types
├─ lib/supabase/server.ts → types
└─ lib/api-client.ts → supabase/client, types

Layer 3 - Hooks:
├─ lib/hooks/use-auth.ts → supabase/client, types
└─ lib/hooks/use-*.ts → use-auth, api-client, types

Layer 4 - Services:
└─ features/*/services/*.ts → api-client, types

Layer 5 - Components:
├─ app/*/page.tsx → hooks, types
└─ components/*.tsx → hooks, types

Layer 6 - API Routes:
└─ app/api/*/route.ts → supabase/server, types
```

### 3.3 Flux de Données Critiques

#### Authentification
```
Component → useAuth() → lib/supabase/client.ts → Supabase Auth
                     ↓
              Profile (types/index.ts)
                     ↓
         Tous les hooks dépendants (profile?.id)
```

#### Property CRUD
```
Component → useProperties() → apiClient → /api/owner/properties
                                              ↓
                                       Supabase RLS
                                              ↓
                                       PropertyRow[]
```

#### Invoice/Payment
```
Component → useInvoices() → invoicesService → /api/invoices
                                                   ↓
                                            RLS (role-based)
                                                   ↓
                                            Invoice[]
```

### 3.4 Points d'Entrée Critiques

| Point d'Entrée | Chaîne de Dépendances |
|----------------|----------------------|
| `/app/auth/signin` | Supabase OAuth → callback → session → useAuth |
| PropertyWizard | useCreateProperty → apiClient → API → Supabase |
| InvoiceList | useInvoices → invoicesService → API → RLS |
| PaymentForm | Stripe → /api/payments/create-intent → webhook |

---

## PHASE 4: PLAN DE FUSION SÉCURISÉ

### 4.1 Priorisation par Risque

#### 🟢 SAFE - Composants Feuilles (PR 1-3)

| Tâche | Fichiers | Impact | Temps Estimé |
|-------|----------|--------|--------------|
| Supprimer `notification-service.ts` | 1 fichier | Aucun import | 15 min |
| Renommer `ocr.service.ts` → `meter-ocr.service.ts` | 1 fichier, 1 import | Clarification | 30 min |
| Supprimer KPI cards @deprecated (si aucun import direct) | 3 fichiers | Déjà re-export | 30 min |

#### 🟡 MODÉRÉ - Services/Components Partagés (PR 4-8)

| Tâche | Fichiers | Fichiers Impactés | Temps Estimé |
|-------|----------|-------------------|--------------|
| Fusionner SMS services | 2 fichiers | 5-10 imports | 2h |
| Migrer chat vers unified-chat | 3 fichiers | 10-15 imports | 3h |
| Consolider PropertyCard avec variant | 3 fichiers | 8-12 imports | 2h |
| Consolider LeaseCard avec variant | 2 fichiers | 5-8 imports | 1.5h |
| Migrer vers listes unifiées (invoices, tickets) | 4 fichiers | 10-15 imports | 3h |

#### 🔴 CRITIQUE - Types et Hooks Centraux (PR 9-15)

| Tâche | Fichiers | Fichiers Impactés | Temps Estimé |
|-------|----------|-------------------|--------------|
| Renommer InvoiceStatus subscriptions → SubscriptionInvoiceStatus | 1 fichier | 5-10 imports | 1h |
| Renommer InvoiceStatus invoicing → ProviderInvoiceStatus | 1 fichier | 5-10 imports | 1h |
| Consolider LeaseStatus vers status.ts | 4 fichiers | 30+ imports | 4h |
| Séparer PropertyStatus (Publication vs Operational) | 4 fichiers | 20+ imports | 4h |
| Créer factory hook CRUD générique | 7 fichiers | 0 (nouveau) | 6h |
| Migrer hooks vers factory | 7 fichiers | 50+ imports | 8h |

### 4.2 Plan de Migration Détaillé

#### PR 1: Nettoyage Services Isolés 🟢

```markdown
**Scope:**
- Supprimer lib/services/notification-service.ts (non utilisé)
- Renommer lib/services/ocr.service.ts → meter-ocr.service.ts
- Mettre à jour imports dans app/api/meters/[id]/photo-ocr/route.ts

**Tests:**
- Vérifier build passe
- Tester API OCR mètres

**Rollback:**
- git revert du commit
```

#### PR 2: Fusion SMS Services 🟡

```markdown
**Étapes:**
1. Copier detectTerritory() de sms.service.ts vers sms-service.ts
2. Ajouter support DROM (Martinique, Guadeloupe, Réunion, Guyane, Mayotte)
3. Mettre à jour tous les imports vers sms-service.ts
4. Supprimer sms.service.ts

**Fichiers Impactés:**
- lib/services/sms-service.ts (modifier)
- lib/services/sms.service.ts (supprimer)
- [Tous fichiers importants sms.service]

**Tests:**
- Test unitaire formatage téléphone DROM
- Test envoi SMS (mock Twilio)

**Rollback:**
- Restaurer sms.service.ts
- Revert imports
```

#### PR 3: Migration Chat Unifié 🟡

```markdown
**Étapes:**
1. Identifier tous les imports de chat.service.ts
2. Migrer vers unified-chat.service.ts
3. Tester toutes les pages messages (owner, tenant, provider)
4. Supprimer lib/services/chat.service.ts

**Fichiers Impactés:**
- app/tenant/messages/page.tsx
- app/owner/messages/page.tsx
- components/chat/*

**Tests:**
- Test E2E conversation owner-tenant
- Test E2E conversation owner-provider

**Rollback:**
- Restaurer chat.service.ts
- Revert imports
```

#### PR 4: PropertyCard avec Variants 🟡

```markdown
**Étapes:**
1. Ajouter prop variant: "portfolio" | "management" | "dashboard" à PropertyCard
2. Extraire logique de features/properties/property-card.tsx
3. Migrer usages vers PropertyCard avec variant
4. Supprimer features/properties/property-card.tsx (ou @deprecated)

**API Finale:**
<PropertyCard
  property={property}
  variant="management"  // nouveau
  onEdit={...}
  onDelete={...}
/>

**Tests:**
- Test visuel de chaque variant
- Test actions edit/delete

**Rollback:**
- Conserver features/properties/property-card.tsx temporairement
```

#### PR 5-6: Listes Unifiées 🟡

```markdown
**invoice-list-unified et ticket-list-unified existent déjà!**

**Étapes:**
1. Vérifier que unified versions supportent tous les use cases
2. Migrer imports de invoices-list vers invoice-list-unified
3. Migrer imports de tickets-list vers ticket-list-unified
4. Marquer anciennes versions @deprecated
5. Supprimer après période de transition (1 sprint)

**Tests:**
- Test liste invoices owner
- Test liste invoices tenant
- Test liste tickets owner/tenant/provider
```

#### PR 7: Renommer InvoiceStatus Contextuels 🔴

```markdown
**Problème:** 3 types s'appellent InvoiceStatus mais signifient différentes choses

**Solution:**
- lib/types/index.ts → garder InvoiceStatus (tenant/owner invoices)
- lib/subscriptions/types.ts → renommer en SubscriptionInvoiceStatus
- lib/types/invoicing.ts → renommer en ProviderInvoiceStatus

**Étapes:**
1. Dans lib/subscriptions/types.ts:
   - export type SubscriptionInvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible"
   - Conserver ancien export avec @deprecated pour transition

2. Dans lib/types/invoicing.ts:
   - export type ProviderInvoiceStatus = "draft" | "sent" | "viewed" | ...
   - Conserver ancien export avec @deprecated

3. Mettre à jour imports (grep pour usages)

**Tests:**
- Build complet
- Tests unitaires subscriptions
- Tests unitaires provider invoicing

**Rollback:**
- Garder alias @deprecated plus longtemps
```

#### PR 8: Consolider LeaseStatus 🔴

```markdown
**Source Canonique:** lib/types/status.ts

**Valeurs Finales (alignées DB):**
draft, pending_signature, partially_signed, fully_signed,
active, notice_given, terminated, archived, cancelled

**Étapes:**
1. Mettre à jour lib/types/status.ts avec toutes les valeurs nécessaires
2. Dans lib/types/index.ts, ré-exporter depuis status.ts
3. Supprimer définitions locales dans:
   - lib/owner/types.ts (importer depuis status.ts)
   - components/properties/types.ts (importer depuis status.ts)
4. Mettre à jour tous les imports

**Fichiers Impactés:** ~30 fichiers
- features/leases/services/leases.service.ts
- features/billing/services/invoices.service.ts
- components/leases/*

**Tests:**
- Test création lease (tous statuts)
- Test transition statuts
- Test UI badges statuts

**Migration DB (si nécessaire):**
- Ajouter valeurs manquantes dans contrainte CHECK
```

#### PR 9: Factory Hooks CRUD 🔴

```markdown
**Nouveau Fichier:** lib/hooks/use-crud-factory.ts

**API:**
function createCRUDHooks<T>(config: CRUDConfig<T>) {
  return {
    useList: (filters?) => useQuery(...),
    useDetail: (id) => useQuery(...),
    useCreate: () => useMutation(...),
    useUpdate: () => useMutation(...),
    useDelete: () => useMutation(...),
  }
}

**Usage:**
// lib/hooks/use-properties.ts
const propertyHooks = createCRUDHooks({
  entityName: 'properties',
  service: propertiesService,
  queryKeys: {
    list: (profileId) => ['properties', profileId],
    detail: (id) => ['property', id],
  },
})

export const { useList: useProperties, ... } = propertyHooks

**Étapes:**
1. Créer use-crud-factory.ts
2. Migrer use-properties.ts comme premier test
3. Valider que tout fonctionne identiquement
4. Migrer les 6 autres hooks un par un

**Tests:**
- Tests unitaires factory
- Tests intégration pour chaque hook migré
- Tests E2E pages properties

**Rollback:**
- Conserver ancienne implémentation en parallèle
```

### 4.3 Calendrier Recommandé

```
Semaine 1: PR 1-3 (Safe)
├─ Jour 1-2: PR 1 - Nettoyage services isolés
├─ Jour 3-4: PR 2 - Fusion SMS
└─ Jour 5: PR 3 - Migration chat unifié

Semaine 2: PR 4-6 (Modéré)
├─ Jour 1-2: PR 4 - PropertyCard variants
├─ Jour 3-4: PR 5-6 - Listes unifiées
└─ Jour 5: Tests E2E

Semaine 3: PR 7-8 (Critique - Types)
├─ Jour 1-2: PR 7 - Renommer InvoiceStatus
├─ Jour 3-5: PR 8 - Consolider LeaseStatus
└─ Tests complets

Semaine 4: PR 9 (Critique - Hooks)
├─ Jour 1-2: Créer factory
├─ Jour 3-4: Migrer use-properties
└─ Jour 5: Valider et documenter

Semaine 5+: Migrations progressives
├─ Migrer 1-2 hooks par semaine
└─ Tests après chaque migration
```

### 4.4 Checklist de Validation

Pour chaque PR:

- [ ] Build local passe (`npm run build`)
- [ ] TypeScript sans erreurs (`npm run type-check`)
- [ ] Tests unitaires passent (`npm test`)
- [ ] Tests E2E passent (`npm run test:e2e`)
- [ ] Aucune régression visuelle
- [ ] Review par 1+ développeur
- [ ] Documentation mise à jour si API change

### 4.5 Plan de Rollback

| Niveau | Déclencheur | Action |
|--------|-------------|--------|
| **Immediate** | Build cassé | `git revert` immédiat |
| **Quick** | Bug critique en prod | Rollback deploy + `git revert` |
| **Gradual** | Régressions mineures | Hotfix forward |

---

## ANNEXES

### A. Commandes Utiles

```bash
# Trouver tous les imports d'un fichier
grep -r "from.*notification-service" --include="*.ts" --include="*.tsx"

# Vérifier les types inutilisés
npx ts-prune

# Lister les dépendances circulaires
npx madge --circular --extensions ts,tsx ./lib

# Compter les lignes par catégorie
find ./lib/hooks -name "*.ts" -exec wc -l {} + | tail -1
```

### B. Fichiers Critiques à Ne Jamais Modifier Sans Coordination

1. `lib/types/index.ts`
2. `lib/supabase/client.ts`
3. `lib/supabase/database.types.ts`
4. `lib/hooks/use-auth.ts`
5. `lib/api-client.ts`
6. `lib/rbac.ts`

### C. Contacts pour Validation

| Domaine | Équipe/Personne |
|---------|-----------------|
| Types/Architecture | Tech Lead |
| Facturation | Équipe Billing |
| Auth/Security | Équipe Security |
| UI/Components | Équipe Frontend |

---

## CONCLUSION

Ce rapport identifie **~3,500 lignes de code redondant** réparties entre:
- 5 types en conflit critique
- 6 paires de services dupliqués
- 7 hooks CRUD identiques
- 5 paires de composants similaires

Le plan de fusion proposé est découpé en **15 PRs** classées par risque:
- 3 PRs Safe (2 jours)
- 5 PRs Modéré (1 semaine)
- 7 PRs Critique (2-3 semaines)

**Temps total estimé:** 4-6 semaines pour une migration complète et sécurisée.

**Bénéfices attendus:**
- Réduction de ~3,500 lignes de code
- Élimination des conflits de types
- Amélioration de la maintenabilité
- Réduction du temps de build (moins de fichiers)
- Meilleure expérience développeur (moins de confusion)
