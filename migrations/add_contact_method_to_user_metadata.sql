-- Migration: Add contact_method column to user_metadata table
-- Created: 2025-01-21
-- Description: Track whether user was invited via email or phone

-- Add contact_method column with constraint
ALTER TABLE public.user_metadata
ADD COLUMN IF NOT EXISTS contact_method TEXT CHECK (contact_method IN ('email', 'phone'));

-- Set default value for existing rows based on auth.users data
-- Email users (have email in auth.users)
UPDATE public.user_metadata
SET contact_method = 'email'
WHERE contact_method IS NULL
  AND user_id IN (
    SELECT id FROM auth.users WHERE email IS NOT NULL
  );

-- Phone users (have phone but no email in auth.users)
UPDATE public.user_metadata
SET contact_method = 'phone'
WHERE contact_method IS NULL
  AND user_id IN (
    SELECT id FROM auth.users WHERE phone IS NOT NULL AND email IS NULL
  );

-- Create index for faster queries on contact_method
CREATE INDEX IF NOT EXISTS idx_user_metadata_contact_method
ON public.user_metadata(contact_method);

-- Add column comment for documentation
COMMENT ON COLUMN public.user_metadata.contact_method IS
'Contact method used for inviting the user: email or phone';

-- Verification query (run this to check the migration)
-- SELECT
--   um.user_id,
--   um.contact_method,
--   au.email,
--   au.phone,
--   au.created_at
-- FROM public.user_metadata um
-- JOIN auth.users au ON um.user_id = au.id
-- ORDER BY au.created_at DESC
-- LIMIT 10;
