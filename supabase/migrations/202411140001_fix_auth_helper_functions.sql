-- Migration : sécuriser public.user_profile_id() et public.user_role()
-- Objectif : éviter les récursions infinies dues aux politiques RLS qui appellent ces fonctions.

DO $$
BEGIN
  -- Garantir l'existence du schéma auth (cas d'environnements locaux)
  IF NOT EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname = 'auth'
  ) THEN
    EXECUTE 'CREATE SCHEMA auth';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_profile_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result uuid;
  previous_setting text;
BEGIN
  -- Sauvegarder l'état de row_security et le désactiver le temps de la lecture
  previous_setting := current_setting('row_security', true);
  PERFORM set_config('row_security', 'off', true);

  SELECT id
    INTO result
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Restaurer l'état initial
  IF previous_setting IS NOT NULL THEN
    PERFORM set_config('row_security', previous_setting, true);
  ELSE
    PERFORM set_config('row_security', 'on', true);
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    IF previous_setting IS NOT NULL THEN
      PERFORM set_config('row_security', previous_setting, true);
    ELSE
      PERFORM set_config('row_security', 'on', true);
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result text;
  previous_setting text;
BEGIN
  previous_setting := current_setting('row_security', true);
  PERFORM set_config('row_security', 'off', true);

  SELECT role
    INTO result
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF previous_setting IS NOT NULL THEN
    PERFORM set_config('row_security', previous_setting, true);
  ELSE
    PERFORM set_config('row_security', 'on', true);
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    IF previous_setting IS NOT NULL THEN
      PERFORM set_config('row_security', previous_setting, true);
    ELSE
      PERFORM set_config('row_security', 'on', true);
    END IF;
    RETURN NULL;
END;
$$;





