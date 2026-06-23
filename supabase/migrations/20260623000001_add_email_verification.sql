-- Add email verification fields to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token text,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at timestamptz;

-- Ensure existing rows with no email are not erroneously marked verified
UPDATE public.users SET email_verified = false WHERE email_verified IS NULL;
