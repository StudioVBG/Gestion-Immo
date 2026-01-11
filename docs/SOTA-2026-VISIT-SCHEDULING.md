# SOTA 2026 - Système de Planification des Visites Immobilières

## Table des Matières
1. [Résumé Exécutif](#résumé-exécutif)
2. [Stack Technique Recommandée](#stack-technique-recommandée)
3. [Bibliothèques Calendrier React](#bibliothèques-calendrier-react)
4. [Plateformes de Scheduling](#plateformes-de-scheduling)
5. [APIs Calendrier](#apis-calendrier)
6. [Architecture Base de Données](#architecture-base-de-données)
7. [Composants UI](#composants-ui)
8. [Algorithmes de Créneaux](#algorithmes-de-créneaux)
9. [Notifications & Rappels](#notifications--rappels)
10. [Architecture Recommandée pour TALOK](#architecture-recommandée-pour-talok)

---

## Résumé Exécutif

Ce document présente les technologies State-of-the-Art (SOTA) 2026 pour implémenter un système de planification de visites immobilières dans TALOK. Le système permettra aux propriétaires de définir leurs disponibilités et aux locataires inscrits de réserver des créneaux de visite.

### Objectifs Fonctionnels
- **Planning des premières visites** : Interface propriétaire pour définir les créneaux disponibles
- **Sélection des créneaux** : Interface locataire pour réserver une visite
- **Connexion calendrier** : Synchronisation avec Google Calendar, Outlook, Apple Calendar
- **Notifications automatiques** : Emails/SMS de confirmation et rappels

---

## Stack Technique Recommandée

### Stack Actuelle de TALOK (Déjà en Place)
| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Next.js (App Router) | 14.0.4 |
| Language | TypeScript | 5.3.3 |
| Database | PostgreSQL (Supabase) | - |
| UI Library | Radix UI + Tailwind | - |
| Calendar | react-day-picker | 9.11.3 |
| Forms | React Hook Form + Zod | 7.66.1 / 3.25.76 |
| State | Zustand + TanStack Query | 5.0.8 / 5.90.9 |
| Email | Resend | 6.5.2 |
| SMS | Twilio | 5.10.7 |

### Extensions SOTA 2026 Recommandées
| Composant | Recommandation | Justification |
|-----------|----------------|---------------|
| **Time Picker** | shadcn-datetime-picker | Natif shadcn/ui, date-fns |
| **Availability API** | Cal.com Unified API | Open-source, multi-provider |
| **Real-time** | Supabase Realtime | Déjà intégré |
| **Calendar Sync** | Nylas v3 ou Google Calendar API | Selon besoins |

---

## Bibliothèques Calendrier React

### 1. react-day-picker ⭐ (Déjà utilisé dans TALOK)
```
Weekly downloads: 6+ million
GitHub stars: 6,400+
```
**Avantages:**
- Fondation de shadcn/ui Calendar
- Léger et hautement personnalisable
- Support des ranges de dates
- Intégration native avec date-fns

**Usage TALOK:** Déjà implémenté dans `components/ui/calendar.tsx`

### 2. react-big-calendar (Pour vue agenda avancée)
**Idéal pour:** Apps type Google Calendar avec vues multiples
- Month, Week, Work Week, Day, Agenda
- Vue ressources incluse (gratuit)
- Flexbox-based

**Recommandation:** Ajouter pour la vue calendrier propriétaire

### 3. FullCalendar React
**Avantages:**
- 300+ options de configuration
- Support drag-and-drop
- Édition Premium pour fonctionnalités avancées

### 4. Planby (Nouveauté 2026)
**Idéal pour:** Timeline planners
- Virtualisation avancée (milliers d'événements)
- Open-source
- Booking systems

### Matrice de Décision

| Critère | react-day-picker | react-big-calendar | FullCalendar |
|---------|------------------|-------------------|--------------|
| Bundle size | ✅ Petit | ⚠️ Moyen | ❌ Grand |
| Facilité | ✅ Simple | ⚠️ Moyen | ⚠️ Complexe |
| Vues multiples | ❌ Non | ✅ Oui | ✅ Oui |
| shadcn/ui | ✅ Natif | ❌ Non | ❌ Non |
| Prix | ✅ Gratuit | ✅ Gratuit | ⚠️ Freemium |

**Recommandation TALOK:**
- Garder `react-day-picker` pour sélection de dates
- Ajouter `react-big-calendar` pour vue planning propriétaire

---

## Plateformes de Scheduling

### Cal.com (Open Source) ⭐ Recommandé

**Caractéristiques:**
- 100% Open Source (auto-hébergeable)
- API complète pour intégration
- Cal Atoms (composants embeddables)
- Unified Calendar API (multi-provider)

**Pricing:**
- Self-hosted: Gratuit
- Cloud: $10/utilisateur/mois

**Avantages pour TALOK:**
```typescript
// Exemple d'intégration Cal Atoms
import { CalendarAtom } from '@calcom/atoms';

function VisitBooking({ propertyId }) {
  return (
    <CalendarAtom
      calLink="owner-username/property-visit"
      config={{ layout: 'month_view' }}
      onBookingSuccess={(booking) => handleVisitBooked(booking)}
    />
  );
}
```

### Calendly

**Caractéristiques:**
- API v2 REST-based
- Embed API pour intégration web
- Webhook API pour temps réel
- 100+ intégrations natives

**Pricing:** $12/utilisateur/mois (Standard)

**Inconvénients:**
- Fermé, pas d'auto-hébergement
- Plus cher que Cal.com

### Comparatif

| Critère | Cal.com | Calendly |
|---------|---------|----------|
| Open Source | ✅ Oui | ❌ Non |
| Self-hosted | ✅ Oui | ❌ Non |
| API Quality | ✅ Excellent | ✅ Excellent |
| Intégrations | 6 CRM | 32 CRM |
| Customization | ✅ Total | ⚠️ Limité |
| Prix | $10/user | $12/user |

**Recommandation:** Cal.com pour sa flexibilité open-source

---

## APIs Calendrier

### Option A: Intégration Directe Google Calendar API

**Avantages:**
- Gratuit
- Contrôle total
- Fonctionnalités complètes

**Inconvénients:**
- Maintenance multiple (Google + Outlook + Apple)
- OAuth complexe par provider
- Verification app Google requise

**Best Practices Google OAuth 2026:**
```typescript
// Scopes recommandés (incremental authorization)
const SCOPES = {
  readonly: 'https://www.googleapis.com/auth/calendar.readonly',
  events: 'https://www.googleapis.com/auth/calendar.events',
  freebusy: 'https://www.googleapis.com/auth/calendar.freebusy',
};

// Demander les scopes au moment où ils sont nécessaires
async function requestCalendarAccess(scope: keyof typeof SCOPES) {
  // Incremental authorization - best practice 2026
  return await signIn('google', {
    scope: SCOPES[scope],
    prompt: 'consent'
  });
}
```

**Webhooks Google Calendar:**
- Expiration: 24h (renouvellement automatique requis)
- Pattern: Cron job pour renouvellement toutes les 20 minutes

### Option B: Nylas Unified Calendar API ⭐

**Avantages:**
- Une seule API pour tous les providers
- Google, Outlook, Exchange, Apple
- Hosted Auth (sécurité SOC 2)
- SDK moderne (v3)

**Nouveautés 2026:**
- Notetaker API (transcription réunions)
- Domain-specific model v3
- Composants UI natifs

**Pricing:** À partir de $0.90/compte connecté/mois

**Exemple d'intégration:**
```typescript
import Nylas from 'nylas';

const nylas = new Nylas({
  apiKey: process.env.NYLAS_API_KEY,
});

// Récupérer les disponibilités
async function getAvailability(calendarId: string, dateRange: DateRange) {
  const availability = await nylas.calendars.getAvailability({
    startTime: dateRange.start.getTime() / 1000,
    endTime: dateRange.end.getTime() / 1000,
    calendars: [{ accountId: calendarId }],
  });
  return availability.timeSlots;
}
```

### Option C: Cal.com Unified Calendar API (Nouvelle 2026)

**Slogan:** "One Calendar API to rule them all"
- Widget d'autorisation unique
- API CRUD unifiée
- Open-source

### Matrice de Décision APIs

| Critère | Google Direct | Nylas | Cal.com Unified |
|---------|--------------|-------|-----------------|
| Multi-provider | ❌ | ✅ | ✅ |
| Coût | Gratuit | $$$  | $$ |
| Maintenance | ❌ Haute | ✅ Basse | ✅ Basse |
| Open-source | ❌ | ❌ | ✅ |
| Maturité | ✅ | ✅ | ⚠️ Nouveau |

**Recommandation TALOK:**
1. **Court terme:** Google Calendar API direct (gratuit, bien documenté)
2. **Long terme:** Migration vers Cal.com Unified API (open-source)

---

## Architecture Base de Données

### Schéma Recommandé pour TALOK

```sql
-- =====================================================
-- TABLE: owner_availability_patterns
-- Patterns de disponibilité récurrents du propriétaire
-- =====================================================
CREATE TABLE owner_availability_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id),
  property_id UUID REFERENCES properties(id), -- NULL = toutes propriétés

  -- Pattern de récurrence
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'custom')),
  day_of_week INTEGER[], -- 0=Dimanche, 1=Lundi, etc.

  -- Plage horaire
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30,
  buffer_minutes INTEGER DEFAULT 15, -- Temps entre visites

  -- Période de validité
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,

  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: availability_exceptions
-- Exceptions aux patterns (vacances, indisponibilités)
-- =====================================================
CREATE TABLE availability_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_id UUID REFERENCES owner_availability_patterns(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id),

  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('unavailable', 'modified')),

  -- Si modifié, nouvelles heures
  modified_start_time TIME,
  modified_end_time TIME,

  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: visit_slots
-- Créneaux de visite générés (matérialisés pour performance)
-- =====================================================
CREATE TABLE visit_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id),
  owner_id UUID NOT NULL REFERENCES profiles(id),
  pattern_id UUID REFERENCES owner_availability_patterns(id),

  -- Créneau
  slot_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  -- Statut
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'booked', 'blocked', 'cancelled')),

  -- Capacité (pour visites groupées)
  max_visitors INTEGER DEFAULT 1,
  current_visitors INTEGER DEFAULT 0,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte d'unicité
  UNIQUE(property_id, start_time)
);

-- Index pour recherche rapide
CREATE INDEX idx_visit_slots_property_date ON visit_slots(property_id, slot_date);
CREATE INDEX idx_visit_slots_status ON visit_slots(status) WHERE status = 'available';

-- =====================================================
-- TABLE: visit_bookings
-- Réservations de visites par les locataires
-- =====================================================
CREATE TABLE visit_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES visit_slots(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  tenant_id UUID NOT NULL REFERENCES profiles(id),

  -- Statut de la visite
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',      -- En attente de confirmation
      'confirmed',    -- Confirmée par le propriétaire
      'cancelled',    -- Annulée
      'completed',    -- Visite effectuée
      'no_show'       -- Le locataire ne s'est pas présenté
    )),

  -- Informations complémentaires
  tenant_message TEXT,
  owner_notes TEXT,

  -- Rappels
  reminder_sent_at TIMESTAMPTZ,
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_1h_sent BOOLEAN DEFAULT false,

  -- Calendrier externe
  external_calendar_event_id TEXT,
  external_calendar_provider TEXT, -- 'google', 'outlook', 'apple'

  -- Métadonnées
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_visit_bookings_tenant ON visit_bookings(tenant_id);
CREATE INDEX idx_visit_bookings_property ON visit_bookings(property_id);
CREATE INDEX idx_visit_bookings_status ON visit_bookings(status);

-- =====================================================
-- TABLE: calendar_connections
-- Connexions aux calendriers externes
-- =====================================================
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),

  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple', 'caldav')),

  -- OAuth tokens (encrypted)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Calendar info
  calendar_id TEXT NOT NULL,
  calendar_name TEXT,

  -- Sync settings
  sync_enabled BOOLEAN DEFAULT true,
  sync_direction TEXT DEFAULT 'both' CHECK (sync_direction IN ('to_external', 'from_external', 'both')),
  last_sync_at TIMESTAMPTZ,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider, calendar_id)
);

-- =====================================================
-- FUNCTION: generate_visit_slots
-- Génère les créneaux à partir des patterns
-- =====================================================
CREATE OR REPLACE FUNCTION generate_visit_slots(
  p_property_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS INTEGER AS $$
DECLARE
  v_pattern RECORD;
  v_date DATE;
  v_slot_start TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
  v_count INTEGER := 0;
BEGIN
  FOR v_pattern IN
    SELECT * FROM owner_availability_patterns
    WHERE property_id = p_property_id
      AND is_active = true
      AND valid_from <= p_end_date
      AND (valid_until IS NULL OR valid_until >= p_start_date)
  LOOP
    v_date := GREATEST(p_start_date, v_pattern.valid_from);

    WHILE v_date <= LEAST(p_end_date, COALESCE(v_pattern.valid_until, p_end_date)) LOOP
      -- Vérifier si le jour correspond au pattern
      IF v_pattern.day_of_week IS NULL
         OR EXTRACT(DOW FROM v_date)::INTEGER = ANY(v_pattern.day_of_week) THEN

        -- Vérifier les exceptions
        IF NOT EXISTS (
          SELECT 1 FROM availability_exceptions
          WHERE pattern_id = v_pattern.id
            AND exception_date = v_date
            AND exception_type = 'unavailable'
        ) THEN
          -- Générer les créneaux pour cette journée
          v_slot_start := v_date + v_pattern.start_time;

          WHILE v_slot_start::TIME < v_pattern.end_time LOOP
            v_slot_end := v_slot_start + (v_pattern.slot_duration_minutes || ' minutes')::INTERVAL;

            INSERT INTO visit_slots (property_id, owner_id, pattern_id, slot_date, start_time, end_time)
            VALUES (p_property_id, v_pattern.owner_id, v_pattern.id, v_date, v_slot_start, v_slot_end)
            ON CONFLICT (property_id, start_time) DO NOTHING;

            v_count := v_count + 1;
            v_slot_start := v_slot_end + (v_pattern.buffer_minutes || ' minutes')::INTERVAL;
          END LOOP;
        END IF;
      END IF;

      v_date := v_date + INTERVAL '1 day';
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

### Stratégie de Génération des Créneaux

**Approche Hybride (Recommandée):**
1. Stocker les **patterns de récurrence** (pas les instances)
2. **Matérialiser** les créneaux sur une fenêtre glissante (ex: 30 jours)
3. Cron job quotidien pour générer les nouveaux créneaux

```typescript
// Edge Function: generate-visit-slots
export async function generateVisitSlots() {
  const today = new Date();
  const endDate = addDays(today, 30);

  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('status', 'active');

  for (const property of properties) {
    await supabase.rpc('generate_visit_slots', {
      p_property_id: property.id,
      p_start_date: format(today, 'yyyy-MM-dd'),
      p_end_date: format(endDate, 'yyyy-MM-dd'),
    });
  }
}
```

---

## Composants UI

### 1. Time Picker (shadcn-datetime-picker)

**Installation:**
```bash
# Déjà compatible avec le stack TALOK
npx shadcn-ui@latest add calendar
```

**Ressources recommandées:**
- [time.rdsx.dev](https://time.rdsx.dev/) - Date & Time picker complet
- [time.openstatus.dev](https://time.openstatus.dev/) - Time picker simple

**Exemple d'implémentation:**
```tsx
// components/visit-scheduling/time-slot-picker.tsx
'use client';

import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked';
}

interface TimeSlotPickerProps {
  propertyId: string;
  availableSlots: TimeSlot[];
  selectedDate: Date | undefined;
  selectedSlot: TimeSlot | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onSlotSelect: (slot: TimeSlot) => void;
}

export function TimeSlotPicker({
  propertyId,
  availableSlots,
  selectedDate,
  selectedSlot,
  onDateSelect,
  onSlotSelect,
}: TimeSlotPickerProps) {
  const slotsForDate = availableSlots.filter(
    slot => slot.status === 'available'
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Calendrier */}
      <div className="rounded-lg border p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          locale={fr}
          disabled={(date) => {
            // Désactiver les dates passées et sans créneaux
            return date < new Date() || !hasAvailableSlots(date);
          }}
          modifiers={{
            available: (date) => hasAvailableSlots(date),
          }}
          modifiersClassNames={{
            available: 'bg-green-100 text-green-900',
          }}
        />
      </div>

      {/* Créneaux horaires */}
      <div className="rounded-lg border p-4">
        <h3 className="font-medium mb-4">
          {selectedDate
            ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
            : 'Sélectionnez une date'}
        </h3>

        {selectedDate && (
          <div className="grid grid-cols-2 gap-2">
            {slotsForDate.map((slot) => (
              <button
                key={slot.id}
                onClick={() => onSlotSelect(slot)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  selectedSlot?.id === slot.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                )}
              >
                {format(new Date(slot.start_time), 'HH:mm')} -
                {format(new Date(slot.end_time), 'HH:mm')}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2. Composant Disponibilités Propriétaire

```tsx
// components/visit-scheduling/availability-editor.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const availabilitySchema = z.object({
  dayOfWeek: z.array(z.number().min(0).max(6)),
  startTime: z.string(),
  endTime: z.string(),
  slotDuration: z.number().min(15).max(120),
  bufferMinutes: z.number().min(0).max(60),
});

type AvailabilityFormData = z.infer<typeof availabilitySchema>;

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

export function AvailabilityEditor({ propertyId }: { propertyId: string }) {
  const form = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      dayOfWeek: [6], // Samedi par défaut
      startTime: '10:00',
      endTime: '18:00',
      slotDuration: 30,
      bufferMinutes: 15,
    },
  });

  async function onSubmit(data: AvailabilityFormData) {
    // Appel API pour sauvegarder le pattern
    await fetch('/api/visit-scheduling/availability', {
      method: 'POST',
      body: JSON.stringify({ propertyId, ...data }),
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Jours de la semaine */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Jours de visite
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <label
              key={day.value}
              className={cn(
                'px-3 py-2 rounded-md cursor-pointer transition-colors',
                form.watch('dayOfWeek').includes(day.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary'
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                value={day.value}
                {...form.register('dayOfWeek', { valueAsNumber: true })}
              />
              {day.label}
            </label>
          ))}
        </div>
      </div>

      {/* Plage horaire */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Heure de début
          </label>
          <input
            type="time"
            {...form.register('startTime')}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Heure de fin
          </label>
          <input
            type="time"
            {...form.register('endTime')}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Durée et buffer */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Durée d'une visite
          </label>
          <Select {...form.register('slotDuration')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 heure</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Temps entre visites
          </label>
          <Select {...form.register('bufferMinutes')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Aucun</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full">
        Enregistrer les disponibilités
      </button>
    </form>
  );
}
```

---

## Algorithmes de Créneaux

### Algorithme Two-Pointer pour Disponibilités Croisées

Utile quand le propriétaire ET le bien ont des contraintes de disponibilité:

```typescript
interface TimeSlot {
  start: number; // timestamp
  end: number;
}

/**
 * Trouve les créneaux communs entre deux listes de disponibilités
 * @param slots1 - Disponibilités du propriétaire
 * @param slots2 - Disponibilités du bien (horaires de visite autorisés)
 * @param duration - Durée minimale requise (en minutes)
 */
function findCommonSlots(
  slots1: TimeSlot[],
  slots2: TimeSlot[],
  duration: number
): TimeSlot[] {
  // Trier par heure de début
  const sorted1 = [...slots1].sort((a, b) => a.start - b.start);
  const sorted2 = [...slots2].sort((a, b) => a.start - b.start);

  const result: TimeSlot[] = [];
  let i = 0, j = 0;

  while (i < sorted1.length && j < sorted2.length) {
    const start = Math.max(sorted1[i].start, sorted2[j].start);
    const end = Math.min(sorted1[i].end, sorted2[j].end);

    // Vérifier si l'intersection est assez longue
    const overlapMinutes = (end - start) / (1000 * 60);
    if (overlapMinutes >= duration) {
      result.push({ start, end });
    }

    // Avancer le pointeur du créneau qui se termine en premier
    if (sorted1[i].end < sorted2[j].end) {
      i++;
    } else {
      j++;
    }
  }

  return result;
}
```

### Génération de Créneaux avec Buffer

```typescript
/**
 * Génère des créneaux à partir d'une plage horaire
 */
function generateSlots(
  date: Date,
  startTime: string, // "09:00"
  endTime: string,   // "18:00"
  slotDuration: number, // minutes
  bufferMinutes: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentStart = new Date(date);
  currentStart.setHours(startHour, startMin, 0, 0);

  const endLimit = new Date(date);
  endLimit.setHours(endHour, endMin, 0, 0);

  while (currentStart < endLimit) {
    const slotEnd = addMinutes(currentStart, slotDuration);

    if (slotEnd <= endLimit) {
      slots.push({
        start: currentStart.getTime(),
        end: slotEnd.getTime(),
      });
    }

    // Prochain créneau = fin du créneau actuel + buffer
    currentStart = addMinutes(slotEnd, bufferMinutes);
  }

  return slots;
}
```

---

## Notifications & Rappels

### Architecture avec Resend (Déjà dans TALOK)

```typescript
// lib/email/visit-notifications.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface VisitBookingEmail {
  tenantEmail: string;
  tenantName: string;
  propertyAddress: string;
  visitDate: Date;
  visitTime: string;
  ownerName: string;
}

export async function sendVisitConfirmation(data: VisitBookingEmail) {
  await resend.emails.send({
    from: 'TALOK <visites@talok.fr>',
    to: data.tenantEmail,
    subject: `Visite confirmée - ${data.propertyAddress}`,
    react: VisitConfirmationEmail(data),
  });
}

export async function sendVisitReminder(data: VisitBookingEmail, hoursBeforeVisit: number) {
  await resend.emails.send({
    from: 'TALOK <rappels@talok.fr>',
    to: data.tenantEmail,
    subject: `Rappel: Visite dans ${hoursBeforeVisit}h - ${data.propertyAddress}`,
    react: VisitReminderEmail({ ...data, hoursBeforeVisit }),
  });
}
```

### Cron Jobs pour Rappels (Supabase Edge Functions)

```typescript
// supabase/functions/send-visit-reminders/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();

  // Rappels 24h avant
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: visits24h } = await supabase
    .from('visit_bookings')
    .select(`
      *,
      slot:visit_slots(*),
      tenant:profiles!tenant_id(*),
      property:properties(*)
    `)
    .eq('status', 'confirmed')
    .eq('reminder_24h_sent', false)
    .gte('slot.start_time', now.toISOString())
    .lte('slot.start_time', tomorrow.toISOString());

  for (const visit of visits24h || []) {
    await sendVisitReminder({
      tenantEmail: visit.tenant.email,
      tenantName: `${visit.tenant.prenom} ${visit.tenant.nom}`,
      propertyAddress: visit.property.adresse_complete,
      visitDate: new Date(visit.slot.start_time),
      visitTime: format(new Date(visit.slot.start_time), 'HH:mm'),
      ownerName: 'Le propriétaire',
    }, 24);

    await supabase
      .from('visit_bookings')
      .update({ reminder_24h_sent: true })
      .eq('id', visit.id);
  }

  return new Response('OK');
});
```

### SMS avec Twilio (Optionnel)

```typescript
// lib/sms/visit-notifications.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendVisitSMS(
  phone: string,
  propertyAddress: string,
  visitDateTime: Date
) {
  const formattedDate = format(visitDateTime, "EEEE d MMMM 'à' HH:mm", { locale: fr });

  await client.messages.create({
    body: `TALOK - Rappel: Votre visite au ${propertyAddress} est prévue ${formattedDate}. À bientôt!`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
}
```

---

## Architecture Recommandée pour TALOK

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  Owner Portal           │         Tenant Portal             │
│  ┌───────────────────┐  │  ┌───────────────────────────┐    │
│  │ AvailabilityEditor│  │  │ TimeSlotPicker            │    │
│  │ CalendarSync      │  │  │ BookingConfirmation       │    │
│  │ VisitsList        │  │  │ MyVisits                  │    │
│  └───────────────────┘  │  └───────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ROUTES                              │
├─────────────────────────────────────────────────────────────┤
│  /api/visit-scheduling/                                      │
│  ├── availability/          POST/GET/PUT patterns           │
│  ├── slots/                 GET available slots             │
│  ├── bookings/              POST create, PUT update         │
│  └── calendar-sync/         OAuth + sync                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE                                 │
├─────────────────────────────────────────────────────────────┤
│  Tables:                    │  Edge Functions:              │
│  - owner_availability_patterns │  - generate-visit-slots    │
│  - availability_exceptions     │  - send-visit-reminders    │
│  - visit_slots                 │  - sync-external-calendar  │
│  - visit_bookings              │                             │
│  - calendar_connections        │  Realtime:                  │
│                                │  - slot status updates      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────┤
│  Google Calendar API    │    Resend (Email)    │   Twilio   │
│  (ou Nylas/Cal.com)     │                       │   (SMS)    │
└─────────────────────────────────────────────────────────────┘
```

### Flux Utilisateur

#### 1. Propriétaire définit ses disponibilités
```
1. Owner → /owner/properties/[id]/visits
2. Configure pattern récurrent (jours, heures)
3. API sauvegarde dans owner_availability_patterns
4. Edge Function génère visit_slots pour 30 jours
5. (Optionnel) Sync avec Google Calendar
```

#### 2. Locataire réserve une visite
```
1. Tenant → /tenant/properties/[id]/book-visit
2. Voit TimeSlotPicker avec créneaux disponibles
3. Sélectionne date + créneau
4. Confirme réservation
5. API crée visit_booking, update visit_slot.status
6. Notifications envoyées (email + SMS optionnel)
7. Event créé dans calendrier propriétaire
```

#### 3. Rappels automatiques
```
Cron (Supabase) toutes les heures:
1. Cherche visites dans 24h sans reminder_24h_sent
2. Envoie rappels email/SMS
3. Mark reminder_24h_sent = true
4. Répète pour 1h avant
```

### Plan d'Implémentation

| Phase | Composant | Effort Estimé |
|-------|-----------|---------------|
| **Phase 1** | Schéma DB + migrations | 1 |
| **Phase 1** | API CRUD disponibilités | 1 |
| **Phase 1** | AvailabilityEditor (Owner) | 1 |
| **Phase 2** | API GET slots disponibles | 1 |
| **Phase 2** | TimeSlotPicker (Tenant) | 1 |
| **Phase 2** | Booking flow complet | 1 |
| **Phase 3** | Notifications email | 1 |
| **Phase 3** | Edge Function rappels | 1 |
| **Phase 4** | Google Calendar OAuth | 2 |
| **Phase 4** | Sync bidirectionnelle | 2 |
| **Phase 5** | SMS notifications | 1 |
| **Phase 5** | React Big Calendar (Owner) | 1 |

---

## Sources & Références

### Bibliothèques Calendrier
- [Top JavaScript Scheduler Libraries 2026](https://www.jqwidgets.com/top-javascript-scheduler-libraries/)
- [React Calendar Components - Builder.io](https://www.builder.io/blog/best-react-calendar-component-ai)
- [Best React Scheduler - DHTMLX](https://dhtmlx.com/blog/best-react-scheduler-components-dhtmlx-bryntum-syncfusion-daypilot-fullcalendar/)

### Plateformes Scheduling
- [Cal.com GitHub](https://github.com/calcom/cal.com)
- [Cal.com vs Calendly 2026](https://fluentbooking.com/articles/cal-com-vs-calendly/)
- [Calendly Developer Portal](https://developer.calendly.com/)

### APIs Calendrier
- [Google OAuth 2.0 Best Practices](https://developers.google.com/identity/protocols/oauth2)
- [Nylas API Guide 2026](https://zeeg.me/en/blog/post/nylas-api)
- [Nylas Calendar API](https://developer.nylas.com/docs/v3/calendar/)
- [Cal.com Unified Calendar API](https://cal.com/unified)

### Architecture & Patterns
- [Appointment Scheduling Algorithm - Baeldung](https://www.baeldung.com/cs/appointment-scheduling-algorithm)
- [Recurring Events Database Design](https://medium.com/@aureliadotlim/recurring-calendar-events-database-design-dc872fb4f2b5)
- [Real-Time Booking with Next.js 14](https://medium.com/@abdulrehmanikram9710/building-a-real-time-booking-system-with-next-js-14-a-practical-guide-d67d7f944d76)

### UI Components
- [shadcn/ui Calendar](https://ui.shadcn.com/docs/components/calendar)
- [ShadCN DateTime Picker](https://time.rdsx.dev/)
- [OpenStatus Time Picker](https://time.openstatus.dev/)

### Real Estate Tech 2026
- [Real Estate Technology Trends 2026](https://www.jellyfishtechnologies.com/top-real-estate-technology-trends/)
- [AI Scheduling Tools Real Estate](https://dialzara.com/blog/best-ai-scheduling-tools-real-estate)
- [Real Estate Automation Tools](https://parseur.com/blog/real-estate-automation-tools)

---

*Document généré le 11 Janvier 2026 - TALOK Visit Scheduling System*
