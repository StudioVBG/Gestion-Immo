-- Amélioration du RPC tenant_dashboard pour supporter multi-baux
-- et retourner plus d'informations connectées

CREATE OR REPLACE FUNCTION tenant_dashboard(p_tenant_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_leases JSONB;
  v_invoices JSONB;
  v_tickets JSONB;
  v_pending_edls JSONB;
  v_insurance_status JSONB;
  v_stats JSONB;
  v_result JSONB;
BEGIN
  -- 1. Récupérer l'ID du profil à partir du user_id
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id = p_tenant_user_id AND role = 'tenant';

  IF v_profile_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Récupérer TOUS les baux (actifs ou en attente)
  SELECT jsonb_agg(lease_data) INTO v_leases
  FROM (
    SELECT 
      l.*,
      jsonb_build_object(
        'id', p.id,
        'adresse_complete', p.adresse_complete,
        'ville', p.ville,
        'code_postal', p.code_postal,
        'type', p.type,
        'surface', p.surface,
        'nb_pieces', p.nb_pieces,
        'cover_url', (SELECT url FROM property_photos WHERE property_id = p.id AND is_main = true LIMIT 1)
      ) as property,
      jsonb_build_object(
        'id', owner_prof.id,
        'name', concat(owner_prof.prenom, ' ', owner_prof.nom),
        'email', owner_prof.email
      ) as owner
    FROM leases l
    JOIN lease_signers ls ON ls.lease_id = l.id
    JOIN properties p ON p.id = l.property_id
    JOIN profiles owner_prof ON owner_prof.id = p.owner_id
    WHERE ls.profile_id = v_profile_id
    AND l.statut IN ('active', 'pending_signature', 'terminated')
    ORDER BY l.statut = 'active' DESC, l.created_at DESC
  ) lease_data;

  -- 3. Récupérer les factures (10 dernières)
  SELECT jsonb_agg(invoice_data) INTO v_invoices
  FROM (
    SELECT 
      i.*,
      p.type as property_type,
      p.adresse_complete as property_address
    FROM invoices i
    JOIN leases l ON l.id = i.lease_id
    JOIN properties p ON p.id = l.property_id
    WHERE i.tenant_id = v_profile_id
    ORDER BY i.periode DESC, i.created_at DESC
    LIMIT 10
  ) invoice_data;

  -- 4. Récupérer les tickets récents (10 derniers)
  SELECT jsonb_agg(ticket_data) INTO v_tickets
  FROM (
    SELECT 
      t.*,
      p.adresse_complete as property_address,
      p.type as property_type
    FROM tickets t
    JOIN properties p ON p.id = t.property_id
    WHERE t.created_by_profile_id = v_profile_id
    ORDER BY t.created_at DESC
    LIMIT 10
  ) ticket_data;

  -- 5. Récupérer les EDLs en attente de signature
  SELECT jsonb_agg(edl_data) INTO v_pending_edls
  FROM (
    SELECT 
      e.id,
      e.type,
      e.scheduled_at,
      es.invitation_token,
      p.adresse_complete as property_address,
      p.type as property_type
    FROM edl e
    JOIN edl_signatures es ON es.edl_id = e.id
    JOIN properties p ON p.id = e.property_id
    WHERE es.signer_profile_id = v_profile_id
    AND es.signed_at IS NULL
    AND e.status IN ('draft', 'scheduled', 'in_progress')
    ORDER BY e.created_at DESC
  ) edl_data;

  -- 6. Vérifier l'assurance pour les baux actifs
  SELECT jsonb_build_object(
    'has_insurance', EXISTS (
      SELECT 1 FROM documents 
      WHERE tenant_id = v_profile_id 
      AND type = 'attestation_assurance'
      AND is_archived = false
      AND (expiry_date IS NULL OR expiry_date > NOW())
    ),
    'last_expiry_date', (
      SELECT expiry_date FROM documents 
      WHERE tenant_id = v_profile_id 
      AND type = 'attestation_assurance'
      AND is_archived = false
      ORDER BY expiry_date DESC LIMIT 1
    )
  ) INTO v_insurance_status;

  -- 7. Stats globales
  SELECT jsonb_build_object(
    'unpaid_amount', COALESCE(SUM(montant_total) FILTER (WHERE statut IN ('sent', 'late')), 0),
    'unpaid_count', COUNT(*) FILTER (WHERE statut IN ('sent', 'late')),
    'total_monthly_rent', COALESCE(SUM(loyer + charges_forfaitaires) FILTER (WHERE statut = 'active'), 0),
    'active_leases_count', COUNT(*) FILTER (WHERE statut = 'active')
  ) INTO v_stats
  FROM leases l
  JOIN lease_signers ls ON ls.lease_id = l.id
  WHERE ls.profile_id = v_profile_id;

  -- 8. Assembler le résultat
  v_result := jsonb_build_object(
    'profile_id', v_profile_id,
    'leases', COALESCE(v_leases, '[]'::jsonb),
    -- Rétro-compatibilité : premier bail
    'lease', CASE WHEN v_leases IS NOT NULL THEN v_leases->0 ELSE NULL END,
    'invoices', COALESCE(v_invoices, '[]'::jsonb),
    'tickets', COALESCE(v_tickets, '[]'::jsonb),
    'pending_edls', COALESCE(v_pending_edls, '[]'::jsonb),
    'insurance', v_insurance_status,
    'stats', COALESCE(v_stats, '{"unpaid_amount": 0, "unpaid_count": 0, "total_monthly_rent": 0, "active_leases_count": 0}'::jsonb)
  );

  RETURN v_result;
END;
$$;

