-- ============================================================
-- AUTOMATIC PROFILE LINKING ON SIGNUP
-- ============================================================
-- This trigger automatically links an existing profile to a new
-- auth user if they share the same email address.
-- This solves the "Orphan Profile" issue when tenants sign up.
-- ============================================================

-- 1. Create the function that handles the new user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  existing_profile_id UUID;
BEGIN
  -- Check if a profile with this email already exists
  -- (Case insensitive search)
  SELECT id INTO existing_profile_id
  FROM public.profiles
  WHERE email ILIKE new.email
  LIMIT 1;

  IF existing_profile_id IS NOT NULL THEN
    -- A profile exists: Link it to the new auth user
    UPDATE public.profiles
    SET 
      user_id = new.id,
      updated_at = NOW()
    WHERE id = existing_profile_id;
    
    RAISE LOG 'Linked existing profile % to new user % (email: %)', existing_profile_id, new.id, new.email;
  ELSE
    -- No profile exists: Create a new one
    -- We use the metadata from the auth user if available
    INSERT INTO public.profiles (
      id,
      user_id,
      email,
      prenom,
      nom,
      role,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(), -- Generate a new UUID for the profile
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'prenom', new.raw_user_meta_data->>'first_name', ''),
      COALESCE(new.raw_user_meta_data->>'nom', new.raw_user_meta_data->>'last_name', ''),
      COALESCE(new.raw_user_meta_data->>'role', 'tenant'), -- Default to tenant if not specified
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Created new profile for user % (email: %)', new.id, new.email;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the trigger if it already exists to avoid duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DATA CLEANUP (OPTIONAL BUT RECOMMENDED)
-- ============================================================
-- Try to link any existing unlinked profiles
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT p.id, p.email, u.id as auth_id
    FROM public.profiles p
    JOIN auth.users u ON p.email = u.email
    WHERE p.user_id IS NULL
  LOOP
    UPDATE public.profiles
    SET user_id = r.auth_id
    WHERE id = r.id;
  END LOOP;
END $$;
