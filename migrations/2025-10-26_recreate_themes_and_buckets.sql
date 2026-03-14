-- Migration: Recreate themes and buckets tables
-- Date: 2025-01-26
-- Description: Drop existing themes and risk_buckets tables, then recreate with new schema (snake_case columns)
-- IMPORTANT: This will delete ALL existing data in themes, risk_buckets, and stocks tables

-- Step 1: Drop existing tables (will cascade to stocks table)
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS risk_buckets CASCADE;
DROP TABLE IF EXISTS themes CASCADE;

-- Step 2: Create new themes table (without pdfUrl, description is now TEXT for markdown)
CREATE TABLE themes (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL,
  CONSTRAINT themes_creator_fkey FOREIGN KEY (created_by) REFERENCES user_metadata(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 3: Create new buckets table (renamed from risk_buckets, added risk_measure field)
CREATE TABLE buckets (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  risk_measure TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL,
  CONSTRAINT buckets_creator_fkey FOREIGN KEY (created_by) REFERENCES user_metadata(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 4: Recreate stocks table with updated foreign keys
CREATE TABLE stocks (
  id TEXT PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  theme_id TEXT NOT NULL,
  bucket_id TEXT NOT NULL,
  pdf_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL,
  CONSTRAINT stocks_theme_fkey FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT stocks_bucket_fkey FOREIGN KEY (bucket_id) REFERENCES buckets(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT stocks_creator_fkey FOREIGN KEY (created_by) REFERENCES user_metadata(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 5: Create indexes for better query performance
CREATE INDEX idx_themes_created_by ON themes(created_by);
CREATE INDEX idx_themes_created_at ON themes(created_at);
CREATE INDEX idx_buckets_created_by ON buckets(created_by);
CREATE INDEX idx_buckets_created_at ON buckets(created_at);
CREATE INDEX idx_stocks_theme_id ON stocks(theme_id);
CREATE INDEX idx_stocks_bucket_id ON stocks(bucket_id);
CREATE INDEX idx_stocks_created_by ON stocks(created_by);

-- Step 6: After running this migration, run the following command to regenerate Prisma client:
-- cd libs/db && bun prisma generate
