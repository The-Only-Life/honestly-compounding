-- Migration: Add name and phone columns to waitlist table
-- Date: 2026-02-22
-- Description: The waitlist router inserts and selects name and phone but the
--              table was created manually without these columns.

ALTER TABLE public.waitlist
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;
