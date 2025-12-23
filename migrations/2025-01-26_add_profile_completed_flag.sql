-- Migration: Add profile_completed flag to user_metadata
-- Date: 2025-01-26
-- Description: Add a boolean flag to track whether user has completed their profile setup (set password, etc.)

-- Step 1: Add the profile_completed column to user_metadata table
ALTER TABLE user_metadata
ADD COLUMN profile_completed BOOLEAN DEFAULT false;

-- Step 2: Update existing records where users have already set passwords
-- Users who have email_confirmed_at set in auth.users are considered to have completed profiles
-- This is a one-time migration to set the flag for existing users
UPDATE user_metadata um
SET profile_completed = true
FROM auth.users au
WHERE um.user_id = au.id
  AND au.encrypted_password IS NOT NULL
  AND au.encrypted_password != '';

-- Step 3: Create an index for better query performance
CREATE INDEX idx_user_metadata_profile_completed ON user_metadata(profile_completed);

-- Note: After running this migration, the application will:
-- 1. Set profile_completed = false when inviting new users
-- 2. Set profile_completed = true when users complete the /complete-profile flow
-- 3. Check this flag to determine if users should be redirected to complete-profile page
