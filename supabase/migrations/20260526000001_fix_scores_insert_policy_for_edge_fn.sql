-- Allow score edge function (called with anon key) to insert leaderboard rows.
-- Keep read policy open for leaderboard display.

DROP POLICY IF EXISTS "scores_insert_service" ON "public"."scores";

CREATE POLICY "scores_insert_open"
ON "public"."scores"
FOR INSERT
WITH CHECK (true);
