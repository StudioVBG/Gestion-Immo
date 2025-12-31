-- ============================================
-- Migration : Équipement Invoices pour Stripe et Relances
-- Date : 2025-12-31
-- Description : Ajout des colonnes nécessaires pour le suivi des paiements Stripe
-- ============================================

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS date_paiement DATE;

-- Index pour la recherche rapide par Stripe ID
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_pi ON public.invoices(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_session ON public.invoices(stripe_session_id);

COMMENT ON COLUMN public.invoices.stripe_payment_intent_id IS 'ID du Payment Intent Stripe lié';
COMMENT ON COLUMN public.invoices.stripe_session_id IS 'ID de la session Checkout Stripe liée';
COMMENT ON COLUMN public.invoices.last_reminder_sent_at IS 'Date du dernier email de relance envoyé';
COMMENT ON COLUMN public.invoices.reminder_count IS 'Nombre de relances déjà envoyées';
COMMENT ON COLUMN public.invoices.date_paiement IS 'Date effective à laquelle le paiement a été reçu';

