-- =====================================================
-- Migration : Index de performance additionnels
-- Date : 2026-01-10
-- Description : Ajoute des index pour les tables charges, meters, meter_readings et outbox
-- =====================================================

-- =====================================================
-- INDEX POUR LA TABLE CHARGES
-- =====================================================

-- Index sur property_id pour filtrer les charges par bien
CREATE INDEX IF NOT EXISTS idx_charges_property_id ON charges(property_id);

-- Index sur created_at pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_charges_created_at ON charges(created_at DESC);

-- Index composite property + date pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_charges_property_date ON charges(property_id, created_at DESC);

-- Index sur le type de charge
CREATE INDEX IF NOT EXISTS idx_charges_type ON charges(type);

-- =====================================================
-- INDEX POUR LA TABLE METERS
-- =====================================================

-- Index sur property_id pour lister les compteurs d'un bien
CREATE INDEX IF NOT EXISTS idx_meters_property_id ON meters(property_id);

-- Index sur le type de compteur
CREATE INDEX IF NOT EXISTS idx_meters_type ON meters(type);

-- Index composite property + type
CREATE INDEX IF NOT EXISTS idx_meters_property_type ON meters(property_id, type);

-- =====================================================
-- INDEX POUR LA TABLE METER_READINGS
-- =====================================================

-- Index sur meter_id pour historique des relevés
CREATE INDEX IF NOT EXISTS idx_meter_readings_meter_id ON meter_readings(meter_id);

-- Index sur reading_date pour tri chronologique
CREATE INDEX IF NOT EXISTS idx_meter_readings_date ON meter_readings(reading_date DESC);

-- Index composite meter + date pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_meter_readings_meter_date ON meter_readings(meter_id, reading_date DESC);

-- Index sur recorded_by pour audit
CREATE INDEX IF NOT EXISTS idx_meter_readings_recorded_by ON meter_readings(recorded_by);

-- =====================================================
-- INDEX POUR LA TABLE OUTBOX (Event Sourcing)
-- =====================================================

-- Index sur le statut pour le worker de traitement
CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);

-- Index sur event_type pour filtrage
CREATE INDEX IF NOT EXISTS idx_outbox_event_type ON outbox(event_type);

-- Index sur scheduled_at pour les jobs programmés
CREATE INDEX IF NOT EXISTS idx_outbox_scheduled_at ON outbox(scheduled_at) WHERE status = 'pending';

-- Index composite pour le worker: événements pending par ordre de priorité
CREATE INDEX IF NOT EXISTS idx_outbox_pending_processing ON outbox(scheduled_at, created_at)
  WHERE status = 'pending';

-- Index sur retry_count pour identifier les événements en échec
CREATE INDEX IF NOT EXISTS idx_outbox_retry_count ON outbox(retry_count)
  WHERE status = 'pending' AND retry_count > 0;

-- =====================================================
-- INDEX POUR LA TABLE DEPOSIT_MOVEMENTS
-- =====================================================

-- Index sur lease_id pour l'historique des dépôts
CREATE INDEX IF NOT EXISTS idx_deposit_movements_lease_id ON deposit_movements(lease_id);

-- Index sur le type de mouvement
CREATE INDEX IF NOT EXISTS idx_deposit_movements_type ON deposit_movements(type);

-- Index sur le statut
CREATE INDEX IF NOT EXISTS idx_deposit_movements_status ON deposit_movements(status);

-- Index composite lease + date
CREATE INDEX IF NOT EXISTS idx_deposit_movements_lease_date ON deposit_movements(lease_id, created_at DESC);

-- =====================================================
-- INDEX POUR LA TABLE PAYMENT_INTENTS
-- =====================================================

-- Index sur lease_id
CREATE INDEX IF NOT EXISTS idx_payment_intents_lease_id ON payment_intents(lease_id);

-- Index sur le statut
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);

-- Index sur provider_intent_id pour les webhooks
CREATE INDEX IF NOT EXISTS idx_payment_intents_provider_id ON payment_intents(provider_intent_id)
  WHERE provider_intent_id IS NOT NULL;

-- Index sur payment_share_id
CREATE INDEX IF NOT EXISTS idx_payment_intents_share_id ON payment_intents(payment_share_id);

-- =====================================================
-- INDEX POUR LA TABLE PAYMENT_SHARES
-- =====================================================

-- Index sur roommate_id
CREATE INDEX IF NOT EXISTS idx_payment_shares_roommate_id ON payment_shares(roommate_id);

-- Index sur le statut
CREATE INDEX IF NOT EXISTS idx_payment_shares_status ON payment_shares(status);

-- =====================================================
-- INDEX POUR LES TABLES EDL
-- =====================================================

-- Index sur lease_id pour les états des lieux
CREATE INDEX IF NOT EXISTS idx_etats_des_lieux_lease_id ON etats_des_lieux(lease_id);

-- Index sur le type (entree/sortie)
CREATE INDEX IF NOT EXISTS idx_etats_des_lieux_type ON etats_des_lieux(type);

-- Index sur le statut
CREATE INDEX IF NOT EXISTS idx_etats_des_lieux_statut ON etats_des_lieux(statut);

-- Index composite lease + type + statut
CREATE INDEX IF NOT EXISTS idx_edl_lease_type_statut ON etats_des_lieux(lease_id, type, statut);

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON INDEX idx_charges_property_date IS 'Optimise le chargement des charges par bien avec tri chronologique';
COMMENT ON INDEX idx_meter_readings_meter_date IS 'Optimise l''historique des relevés de compteur';
COMMENT ON INDEX idx_outbox_pending_processing IS 'Optimise le traitement des événements en attente par le worker';
COMMENT ON INDEX idx_payment_intents_provider_id IS 'Optimise la recherche par ID provider pour les webhooks Stripe/GoCardless';
COMMENT ON INDEX idx_edl_lease_type_statut IS 'Optimise la recherche d''EDL par bail, type et statut';
