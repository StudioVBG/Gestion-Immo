-- Fix owner_dashboard RPC to use 'etat' instead of 'statut' for properties
-- and fix the values for status filtering

CREATE OR REPLACE FUNCTION owner_dashboard(p_owner_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Vérifier que l'utilisateur est bien le propriétaire
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_owner_id 
    AND role = 'owner'
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  SELECT jsonb_build_object(
    'properties', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'ref', p.unique_code,
          'adresse', p.adresse_complete,
          'statut', p.etat,
          'type', p.type,
          'surface', p.surface,
          'nb_pieces', p.nb_pieces,
          'created_at', p.created_at,
          'updated_at', p.updated_at
        )
      )
      FROM properties p
      WHERE p.owner_id = p_owner_id
    ),
    'properties_stats', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'active', COUNT(*) FILTER (WHERE etat = 'published'),
        'draft', COUNT(*) FILTER (WHERE etat = 'draft')
      )
      FROM properties
      WHERE owner_id = p_owner_id
    ),
    'leases', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'property_id', l.property_id,
          'type_bail', l.type_bail,
          'loyer', l.loyer,
          'date_debut', l.date_debut,
          'date_fin', l.date_fin,
          'statut', l.statut,
          'created_at', l.created_at
        )
      )
      FROM leases l
      INNER JOIN properties p ON p.id = l.property_id
      WHERE p.owner_id = p_owner_id
    ),
    'leases_stats', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'active', COUNT(*) FILTER (WHERE l.statut = 'active'),
        'pending', COUNT(*) FILTER (WHERE l.statut = 'pending_signature')
      )
      FROM leases l
      INNER JOIN properties p ON p.id = l.property_id
      WHERE p.owner_id = p_owner_id
    ),
    'invoices', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'lease_id', i.lease_id,
          'periode', i.periode,
          'montant_total', i.montant_total,
          'statut', i.statut,
          'created_at', i.created_at
        )
      )
      FROM invoices i
      WHERE i.owner_id = p_owner_id
      ORDER BY i.created_at DESC
      LIMIT 10
    ),
    'invoices_stats', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'paid', COUNT(*) FILTER (WHERE statut = 'paid'),
        'pending', COUNT(*) FILTER (WHERE statut = 'sent'),
        'late', COUNT(*) FILTER (WHERE statut = 'late')
      )
      FROM invoices
      WHERE owner_id = p_owner_id
    ),
    'tickets', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'property_id', t.property_id,
          'titre', t.titre,
          'priorite', t.priorite,
          'statut', t.statut,
          'created_at', t.created_at
        )
      )
      FROM tickets t
      INNER JOIN properties p ON p.id = t.property_id
      WHERE p.owner_id = p_owner_id
      ORDER BY t.created_at DESC
      LIMIT 10
    ),
    'tickets_stats', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'open', COUNT(*) FILTER (WHERE t.statut = 'open'),
        'in_progress', COUNT(*) FILTER (WHERE t.statut = 'in_progress')
      )
      FROM tickets t
      INNER JOIN properties p ON p.id = t.property_id
      WHERE p.owner_id = p_owner_id
    )
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

