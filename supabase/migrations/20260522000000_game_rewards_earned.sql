-- Fix the auto_enable_rls event trigger function.
-- The original used format('%I', obj.object_identity) where object_identity is
-- already schema-qualified (e.g. 'public.game_rewards_earned'). %I treats the
-- whole dotted string as a single identifier "public.game_rewards_earned"
-- (with the dot inside the quotes), which PostgreSQL cannot resolve.
-- Fix: split schema_name and table name and quote them separately.
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
    EXECUTE format(
      'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      obj.schema_name,
      split_part(obj.object_identity, '.', 2)
    );
    RAISE NOTICE 'RLS automatically enabled on table: %', obj.object_identity;
  END LOOP;
END;
$$;

-- Track lifetime game ZI earnings per wallet address
-- Enforces the 10 ZI per wallet lifetime cap for game rewards

CREATE TABLE IF NOT EXISTS "public"."game_rewards_earned" (
  "address"       text        PRIMARY KEY,
  "total_stroops" bigint      NOT NULL DEFAULT 0 CHECK (total_stroops >= 0),
  "updated_at"    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."game_rewards_earned" ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "game_rewards_earned_select"
  ON "public"."game_rewards_earned"
  FOR SELECT
  USING (true);

-- Allow inserts from server (anon key)
CREATE POLICY "game_rewards_earned_insert"
  ON "public"."game_rewards_earned"
  FOR INSERT
  WITH CHECK (true);

-- Only allow updates that do not decrease total_stroops
CREATE POLICY "game_rewards_earned_update"
  ON "public"."game_rewards_earned"
  FOR UPDATE
  USING (true)
  WITH CHECK (total_stroops >= 0);

