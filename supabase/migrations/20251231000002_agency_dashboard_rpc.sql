-- RPC pour le dashboard agence
-- Récupère toutes les données nécessaires (stats, mandats, paiements, tâches)

CREATE OR REPLACE FUNCTION agency_dashboard(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agency_profile_id UUID;
  v_stats JSONB;
  v_recent_mandates JSONB;
  v_recent_payments JSONB;
  v_pending_tasks JSONB;
  v_result JSONB;
BEGIN
  -- 1. Récupérer l'ID du profil agence
  SELECT id INTO v_agency_profile_id
  FROM profiles
  WHERE user_id = p_user_id AND role = 'agency';

  IF v_agency_profile_id IS NULL THEN
    -- Vérifier si l'utilisateur est un gestionnaire d'agence
    SELECT agency_profile_id INTO v_agency_profile_id
    FROM agency_managers
    WHERE user_profile_id = (SELECT id FROM profiles WHERE user_id = p_user_id)
    AND is_active = true;
  END IF;

  IF v_agency_profile_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Profil agence non trouvé');
  END IF;

  -- 2. Statistiques via la vue existing agency_dashboard_stats
  SELECT jsonb_build_object(
    'mandatsActifs', mandats_actifs,
    'mandatsTotal', total_mandats,
    'proprietaires', total_proprietaires,
    'biensGeres', total_biens_geres,
    'commissionsEncaissees', commissions_encaissees,
    'commissionsEnAttente', commissions_en_attente,
    'loyersEncaissesMois', (
      SELECT COALESCE(SUM(montant_total), 0)
      FROM invoices i
      JOIN mandates m ON m.owner_profile_id = i.owner_id
      WHERE m.agency_profile_id = v_agency_profile_id
      AND i.statut = 'paid'
      AND i.periode = to_char(CURRENT_DATE, 'YYYY-MM')
    ),
    'tauxOccupation', (
      SELECT CASE WHEN total_biens_geres > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE l.statut = 'active'))::NUMERIC / total_biens_geres * 100)
        ELSE 0 END
      FROM leases l
      INNER JOIN properties p ON p.id = l.property_id
      INNER JOIN mandates m ON m.owner_profile_id = p.owner_id
      WHERE m.agency_profile_id = v_agency_profile_id
    ),
    'ticketsOuverts', (
      SELECT COUNT(*)
      FROM tickets t
      INNER JOIN properties p ON p.id = t.property_id
      INNER JOIN mandates m ON m.owner_profile_id = p.owner_id
      WHERE m.agency_profile_id = v_agency_profile_id
      AND t.statut IN ('open', 'in_progress')
    )
  ) INTO v_stats
  FROM agency_dashboard_stats
  WHERE agency_id = v_agency_profile_id;

  -- 3. Mandats récents
  SELECT jsonb_agg(mandate_data) INTO v_recent_mandates
  FROM (
    SELECT jsonb_build_object(
      'id', m.id,
      'owner', (SELECT concat(pr.prenom, ' ', pr.nom) FROM profiles pr WHERE pr.id = m.owner_profile_id),
      'type', m.type_mandat,
      'biens', CASE WHEN m.inclut_tous_biens THEN (SELECT COUNT(*) FROM properties WHERE owner_id = m.owner_profile_id) ELSE array_length(m.properties_ids, 1) END,
      'status', m.statut,
      'commission', m.commission_pourcentage || '%'
    ) as mandate_data
    FROM mandates m
    WHERE m.agency_profile_id = v_agency_profile_id
    ORDER BY m.created_at DESC
    LIMIT 5
  ) sub;

  -- 4. Paiements récents
  SELECT jsonb_agg(payment_data) INTO v_recent_payments
  FROM (
    SELECT jsonb_build_object(
      'id', i.id,
      'property', (SELECT p.adresse_complete FROM properties p WHERE p.id = l.property_id),
      'tenant', (SELECT concat(pr.prenom, ' ', pr.nom) FROM profiles pr WHERE pr.id = i.tenant_id),
      'amount', i.montant_total,
      'status', i.statut,
      'date', to_char(i.updated_at, 'DD/MM/YYYY')
    ) as payment_data
    FROM invoices i
    JOIN leases l ON l.id = i.lease_id
    JOIN mandates m ON m.owner_profile_id = i.owner_id
    WHERE m.agency_profile_id = v_agency_profile_id
    AND i.statut IN ('paid', 'sent', 'late')
    ORDER BY i.updated_at DESC
    LIMIT 5
  ) sub;

  -- 5. Tâches en attente (EDL, Signatures, Révisions)
  SELECT jsonb_agg(task_data) INTO v_pending_tasks
  FROM (
    -- EDL en attente
    SELECT jsonb_build_object(
      'id', e.id,
      'title', 'EDL ' || e.type || ' - ' || (SELECT p.ville FROM properties p WHERE p.id = e.property_id),
      'type', 'edl',
      'dueDate', to_char(e.created_at + interval '2 days', 'DD/MM/YYYY')
    ) as task_data
    FROM edl e
    INNER JOIN properties p ON p.id = e.property_id
    INNER JOIN mandates m ON m.owner_profile_id = p.owner_id
    WHERE m.agency_profile_id = v_agency_profile_id
    AND e.is_signed = false
    UNION ALL
    -- Baux en attente de signature
    SELECT jsonb_build_object(
      'id', l.id,
      'title', 'Signature bail - ' || (SELECT p.adresse_complete FROM properties p WHERE p.id = l.property_id),
      'type', 'signature',
      'dueDate', to_char(l.created_at + interval '1 week', 'DD/MM/YYYY')
    ) as task_data
    FROM leases l
    INNER JOIN properties p ON p.id = l.property_id
    INNER JOIN mandates m ON m.owner_profile_id = p.owner_id
    WHERE m.agency_profile_id = v_agency_profile_id
    AND l.statut = 'pending_signature'
    LIMIT 5
  ) sub;

  -- 6. Résultat final
  v_result := jsonb_build_object(
    'stats', COALESCE(v_stats, '{}'::jsonb),
    'recentMandates', COALESCE(v_recent_mandates, '[]'::jsonb),
    'recentPayments', COALESCE(v_recent_payments, '[]'::jsonb),
    'pendingTasks', COALESCE(v_pending_tasks, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

