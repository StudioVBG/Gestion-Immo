-- Migration : Fonction RPC pour renvoyer une invitation
-- Cette fonction régénère le token d'une invitation et réinitialise sa date d'expiration

CREATE OR REPLACE FUNCTION resend_invitation(p_invitation_id UUID)
RETURNS invitations AS $$
DECLARE
  v_new_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_invitation invitations;
BEGIN
  -- Vérifier que l'invitation existe et appartient à l'utilisateur connecté
  SELECT * INTO v_invitation
  FROM invitations
  WHERE id = p_invitation_id
  AND created_by = public.user_profile_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation non trouvée ou accès non autorisé';
  END IF;

  -- Générer un nouveau token (64 caractères hexadécimaux)
  v_new_token := encode(gen_random_bytes(32), 'hex');

  -- Nouvelle date d'expiration : 7 jours à partir de maintenant
  v_expires_at := NOW() + INTERVAL '7 days';

  -- Mettre à jour l'invitation
  UPDATE invitations
  SET
    token = v_new_token,
    expires_at = v_expires_at,
    used_at = NULL,
    used_by = NULL,
    updated_at = NOW()
  WHERE id = p_invitation_id
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire pour la documentation
COMMENT ON FUNCTION resend_invitation(UUID) IS 
'Régénère le token d''une invitation et réinitialise sa date d''expiration. 
Seul le créateur de l''invitation peut l''utiliser.';

