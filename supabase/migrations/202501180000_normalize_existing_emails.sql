-- Migration : Normaliser les emails existants dans auth.users
-- Cette migration garantit que tous les emails sont en minuscules pour éviter les problèmes de connexion
-- Note: Cette fonction nécessite des privilèges admin sur auth.users

-- Fonction pour normaliser les emails dans auth.users
CREATE OR REPLACE FUNCTION public.normalize_auth_emails()
RETURNS TABLE(
  user_id UUID,
  old_email TEXT,
  new_email TEXT,
  updated BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_record RECORD;
  normalized_email TEXT;
  updated_count INTEGER := 0;
BEGIN
  -- Parcourir tous les utilisateurs dont l'email n'est pas déjà normalisé
  FOR user_record IN 
    SELECT id, email 
    FROM auth.users 
    WHERE email IS NOT NULL 
      AND email != LOWER(TRIM(email))
  LOOP
    normalized_email := LOWER(TRIM(user_record.email));
    
    -- Mettre à jour l'email uniquement s'il est différent
    IF normalized_email != user_record.email THEN
      UPDATE auth.users
      SET email = normalized_email,
          updated_at = NOW()
      WHERE id = user_record.id;
      
      updated_count := updated_count + 1;
      
      -- Retourner les informations de mise à jour
      RETURN QUERY SELECT 
        user_record.id,
        user_record.email,
        normalized_email,
        TRUE;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Total d''emails normalisés : %', updated_count;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.normalize_auth_emails() IS 
  'Normalise tous les emails dans auth.users en minuscules. 
   Retourne un tableau avec les utilisateurs mis à jour.
   À exécuter manuellement via le dashboard Supabase SQL Editor avec les privilèges admin.
   
   Exemple d''utilisation:
   SELECT * FROM public.normalize_auth_emails();
   
   Pour exécuter automatiquement (nécessite privilèges admin):
   DO $$
   BEGIN
     PERFORM public.normalize_auth_emails();
   END $$;
   ';

-- Créer aussi une fonction pour vérifier les emails non normalisés (sans modification)
CREATE OR REPLACE FUNCTION public.check_non_normalized_emails()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  normalized_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    LOWER(TRIM(u.email)) as normalized_email
  FROM auth.users u
  WHERE u.email IS NOT NULL 
    AND u.email != LOWER(TRIM(u.email))
  ORDER BY u.email;
END;
$$;

COMMENT ON FUNCTION public.check_non_normalized_emails() IS 
  'Vérifie les emails non normalisés dans auth.users sans les modifier.
   Utile pour voir quels emails doivent être normalisés avant d''exécuter normalize_auth_emails().';

