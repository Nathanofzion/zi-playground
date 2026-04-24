-- Security fix: remove 'anon' role from users insert policy (P04)
-- Previously: auth.role() = 'service_role' OR auth.role() = 'anon'
-- Fixed:      auth.role() = 'service_role' only
-- Rationale: anonymous callers must never be able to insert user rows directly.
--            All user creation flows through the auth edge function which runs
--            as service_role.

DROP POLICY IF EXISTS "users_insert_service" ON "public"."users";

CREATE POLICY "users_insert_service" ON "public"."users"
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
