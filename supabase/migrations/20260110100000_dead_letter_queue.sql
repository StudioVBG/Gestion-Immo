-- Migration: Dead Letter Queue pour événements failed
-- Date: 2026-01-10
-- Description: Ajoute un système de Dead Letter Queue pour les événements
-- qui ont échoué définitivement après max_retries

-- Table pour les événements définitivement échoués
CREATE TABLE IF NOT EXISTS failed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence à l'événement original
  original_event_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Informations d'échec
  failure_reason TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  first_attempt_at TIMESTAMPTZ NOT NULL,
  last_attempt_at TIMESTAMPTZ NOT NULL,

  -- Statut de résolution
  resolution_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    resolution_status IN ('pending', 'retrying', 'resolved', 'ignored', 'escalated')
  ),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,

  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour requêtes fréquentes
CREATE INDEX idx_failed_events_status ON failed_events(resolution_status);
CREATE INDEX idx_failed_events_type ON failed_events(event_type);
CREATE INDEX idx_failed_events_created_at ON failed_events(created_at DESC);
CREATE INDEX idx_failed_events_pending ON failed_events(resolution_status, event_type)
  WHERE resolution_status = 'pending';

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_failed_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_failed_events_updated_at
  BEFORE UPDATE ON failed_events
  FOR EACH ROW
  EXECUTE FUNCTION update_failed_events_updated_at();

-- Fonction pour déplacer un événement vers la DLQ
CREATE OR REPLACE FUNCTION move_to_dead_letter_queue(
  p_event_id UUID,
  p_failure_reason TEXT
) RETURNS UUID AS $$
DECLARE
  v_event RECORD;
  v_dlq_id UUID;
BEGIN
  -- Récupérer l'événement original
  SELECT * INTO v_event FROM outbox WHERE id = p_event_id;

  IF v_event IS NULL THEN
    RAISE EXCEPTION 'Event not found: %', p_event_id;
  END IF;

  -- Insérer dans la DLQ
  INSERT INTO failed_events (
    original_event_id,
    event_type,
    payload,
    failure_reason,
    retry_count,
    max_retries,
    first_attempt_at,
    last_attempt_at
  ) VALUES (
    v_event.id,
    v_event.event_type,
    v_event.payload,
    p_failure_reason,
    v_event.retry_count,
    v_event.max_retries,
    v_event.created_at,
    NOW()
  ) RETURNING id INTO v_dlq_id;

  -- Supprimer de la table outbox
  DELETE FROM outbox WHERE id = p_event_id;

  RETURN v_dlq_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour retry un événement depuis la DLQ
CREATE OR REPLACE FUNCTION retry_failed_event(
  p_failed_event_id UUID,
  p_admin_id UUID
) RETURNS UUID AS $$
DECLARE
  v_failed_event RECORD;
  v_new_event_id UUID;
BEGIN
  -- Récupérer l'événement échoué
  SELECT * INTO v_failed_event FROM failed_events WHERE id = p_failed_event_id;

  IF v_failed_event IS NULL THEN
    RAISE EXCEPTION 'Failed event not found: %', p_failed_event_id;
  END IF;

  IF v_failed_event.resolution_status != 'pending' THEN
    RAISE EXCEPTION 'Event already processed with status: %', v_failed_event.resolution_status;
  END IF;

  -- Créer un nouvel événement dans outbox
  INSERT INTO outbox (
    event_type,
    payload,
    status,
    retry_count,
    max_retries,
    scheduled_at
  ) VALUES (
    v_failed_event.event_type,
    v_failed_event.payload,
    'pending',
    0,  -- Reset retry count
    3,  -- Fresh retries
    NOW()
  ) RETURNING id INTO v_new_event_id;

  -- Marquer comme en retry
  UPDATE failed_events SET
    resolution_status = 'retrying',
    resolved_at = NOW(),
    resolved_by = p_admin_id,
    resolution_notes = 'Retried manually. New event ID: ' || v_new_event_id::TEXT
  WHERE id = p_failed_event_id;

  RETURN v_new_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour ignorer un événement (acknowledge sans retry)
CREATE OR REPLACE FUNCTION ignore_failed_event(
  p_failed_event_id UUID,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE failed_events SET
    resolution_status = 'ignored',
    resolved_at = NOW(),
    resolved_by = p_admin_id,
    resolution_notes = COALESCE(p_notes, 'Ignored by admin')
  WHERE id = p_failed_event_id
    AND resolution_status = 'pending';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour escalader un événement (marquer pour intervention urgente)
CREATE OR REPLACE FUNCTION escalate_failed_event(
  p_failed_event_id UUID,
  p_admin_id UUID,
  p_notes TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE failed_events SET
    resolution_status = 'escalated',
    resolved_at = NOW(),
    resolved_by = p_admin_id,
    resolution_notes = p_notes
  WHERE id = p_failed_event_id
    AND resolution_status = 'pending';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC pour obtenir les statistiques DLQ
CREATE OR REPLACE FUNCTION get_dlq_statistics()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_pending', (SELECT COUNT(*) FROM failed_events WHERE resolution_status = 'pending'),
    'total_retrying', (SELECT COUNT(*) FROM failed_events WHERE resolution_status = 'retrying'),
    'total_resolved', (SELECT COUNT(*) FROM failed_events WHERE resolution_status = 'resolved'),
    'total_ignored', (SELECT COUNT(*) FROM failed_events WHERE resolution_status = 'ignored'),
    'total_escalated', (SELECT COUNT(*) FROM failed_events WHERE resolution_status = 'escalated'),
    'by_event_type', (
      SELECT json_agg(json_build_object(
        'event_type', event_type,
        'count', count
      ))
      FROM (
        SELECT event_type, COUNT(*) as count
        FROM failed_events
        WHERE resolution_status = 'pending'
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),
    'oldest_pending', (
      SELECT created_at FROM failed_events
      WHERE resolution_status = 'pending'
      ORDER BY created_at ASC LIMIT 1
    ),
    'last_24h_failures', (
      SELECT COUNT(*) FROM failed_events
      WHERE created_at > NOW() - INTERVAL '24 hours'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politiques RLS
ALTER TABLE failed_events ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir/modifier les événements échoués
CREATE POLICY "admin_select_failed_events" ON failed_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = public.user_profile_id() AND role = 'admin'
    )
  );

CREATE POLICY "admin_update_failed_events" ON failed_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = public.user_profile_id() AND role = 'admin'
    )
  );

-- Trigger pour déplacer automatiquement les événements failed vers DLQ
CREATE OR REPLACE FUNCTION auto_move_to_dlq()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' AND NEW.retry_count >= NEW.max_retries THEN
    PERFORM move_to_dead_letter_queue(NEW.id, NEW.error_message);
    RETURN NULL;  -- Empêcher l'update car l'événement a été déplacé
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_dlq
  AFTER UPDATE OF status ON outbox
  FOR EACH ROW
  WHEN (NEW.status = 'failed')
  EXECUTE FUNCTION auto_move_to_dlq();

-- Commentaires
COMMENT ON TABLE failed_events IS 'Dead Letter Queue pour les événements outbox ayant échoué définitivement';
COMMENT ON FUNCTION move_to_dead_letter_queue IS 'Déplace un événement outbox vers la DLQ';
COMMENT ON FUNCTION retry_failed_event IS 'Réessaie un événement depuis la DLQ (admin uniquement)';
COMMENT ON FUNCTION ignore_failed_event IS 'Ignore un événement sans le réessayer (acknowledge)';
COMMENT ON FUNCTION escalate_failed_event IS 'Marque un événement pour intervention urgente';
COMMENT ON FUNCTION get_dlq_statistics IS 'Retourne les statistiques de la DLQ';
