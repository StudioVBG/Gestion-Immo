-- Ensure local roles can manage objects inside the auth schema before
-- later migrations attempt to create SECURITY DEFINER helpers there.
GRANT USAGE, CREATE ON SCHEMA auth TO postgres;
GRANT USAGE, CREATE ON SCHEMA auth TO supabase_admin;

-- Keep runtime roles able to read functions defined within auth.
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

