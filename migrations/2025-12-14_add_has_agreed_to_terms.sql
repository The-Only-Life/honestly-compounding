-- Add has_agreed_to_terms column to user_metadata table
ALTER TABLE user_metadata 
ADD COLUMN IF NOT EXISTS has_agreed_to_terms BOOLEAN DEFAULT false;
