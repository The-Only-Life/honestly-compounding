-- Migration: Add missing columns to user_metadata table
-- Date: 2026-02-22
-- Description: Add full_name, phone, and invited_by columns that the server expects
--              but were never included in a prior migration.

-- Add full_name column
ALTER TABLE public.user_metadata
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add phone column
ALTER TABLE public.user_metadata
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add invited_by column (references the admin/sponsor user who sent the invite)
ALTER TABLE public.user_metadata
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix the admin user whose metadata row was created without these columns
-- and whose flags were never set (profileCompleted, accessApproved, role, etc.)
-- Replace the user_id below if your admin user ID differs.
UPDATE public.user_metadata
SET
  role = 'admin',
  access_approved = true,
  profile_completed = true,
  has_agreed_to_terms = true
WHERE user_id = '8ee3b1e7-56eb-43d3-bd9e-1490bf0ab07b'
  AND (role IS NULL OR profile_completed = false);
