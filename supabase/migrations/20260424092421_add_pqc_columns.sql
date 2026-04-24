-- Add hybrid ML-DSA-65 post-quantum cryptography columns to users table.
-- These are populated by the auth edge function during wallet registration
-- and read by the verify-hybrid edge function during proof verification.
-- All columns are nullable for backward compatibility with existing wallets.

ALTER TABLE "public"."users"
  ADD COLUMN IF NOT EXISTS "pqc_public_key"    text,
  ADD COLUMN IF NOT EXISTS "pqc_algorithm"     text,
  ADD COLUMN IF NOT EXISTS "pqc_registered_at" timestamp with time zone;
