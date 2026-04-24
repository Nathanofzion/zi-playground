-- Enable Row Level Security on all existing public tables.
-- The auto_rls_trigger (previous migration) only covers future tables;
-- this migration covers the tables that already exist in the schema.

-- Drop all policies first so this migration is idempotent on retry
DROP POLICY IF EXISTS "users_select_own"       ON "public"."users";
DROP POLICY IF EXISTS "users_update_own"       ON "public"."users";
DROP POLICY IF EXISTS "users_insert_service"   ON "public"."users";
DROP POLICY IF EXISTS "rewards_select_own"     ON "public"."rewards";
DROP POLICY IF EXISTS "rewards_insert_service" ON "public"."rewards";
DROP POLICY IF EXISTS "scores_select_all"      ON "public"."scores";
DROP POLICY IF EXISTS "scores_insert_service"  ON "public"."scores";
DROP POLICY IF EXISTS "challenges_service_only" ON "public"."challenges";
DROP POLICY IF EXISTS "pairs_select_all"       ON "public"."pairs";
DROP POLICY IF EXISTS "pairs_write_service"    ON "public"."pairs";

ALTER TABLE IF EXISTS "public"."users"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."rewards"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."scores"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."pairs"      ENABLE ROW LEVEL SECURITY;

-- Basic policies: allow authenticated users to read/write their own rows.
-- These are conservative starter policies — tighten per table as needed.

-- users: can only see and update their own record
CREATE POLICY "users_select_own" ON "public"."users"
  FOR SELECT USING (auth.jwt()->>'sub' = user_id OR auth.role() = 'service_role');

CREATE POLICY "users_update_own" ON "public"."users"
  FOR UPDATE USING (auth.jwt()->>'sub' = user_id OR auth.role() = 'service_role');

CREATE POLICY "users_insert_service" ON "public"."users"
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'anon');

-- rewards: users can read their own rewards; only service role can insert
CREATE POLICY "rewards_select_own" ON "public"."rewards"
  FOR SELECT USING (auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = rewards.user_id AND u.user_id = auth.jwt()->>'sub'));

CREATE POLICY "rewards_insert_service" ON "public"."rewards"
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- scores: users can read all scores (leaderboard); insert own only
CREATE POLICY "scores_select_all" ON "public"."scores"
  FOR SELECT USING (true);

CREATE POLICY "scores_insert_service" ON "public"."scores"
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- challenges: service role only (WebAuthn challenge state)
CREATE POLICY "challenges_service_only" ON "public"."challenges"
  USING (auth.role() = 'service_role');

-- pairs: read-only public (Soroswap liquidity pairs)
CREATE POLICY "pairs_select_all" ON "public"."pairs"
  FOR SELECT USING (true);

CREATE POLICY "pairs_write_service" ON "public"."pairs"
  FOR ALL USING (auth.role() = 'service_role');
