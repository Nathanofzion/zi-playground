-- Automatically enable Row Level Security on every new table created
-- in the public schema. This ensures no table is ever accidentally left
-- open without RLS, which is a critical security baseline for Supabase.

CREATE OR REPLACE FUNCTION public.auto_enable_rls()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT schema_name, object_identity
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE'
      AND schema_name = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', obj.object_identity);
    RAISE NOTICE 'RLS automatically enabled on table: %', obj.object_identity;
  END LOOP;
END;
$$;

CREATE EVENT TRIGGER auto_enable_rls_trigger
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION public.auto_enable_rls();
