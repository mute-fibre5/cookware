-- Run this in Supabase: SQL Editor → New query → Paste → Run
-- This creates the buyers table so buyer profiles are saved when they log in.

CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyers_email ON buyers(email);

ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if you're re-running (optional)
-- DROP POLICY IF EXISTS "Users can read own buyer row" ON buyers;
-- DROP POLICY IF EXISTS "Users can insert own buyer row" ON buyers;
-- DROP POLICY IF EXISTS "Users can update own buyer row" ON buyers;

CREATE POLICY "Users can read own buyer row"
  ON buyers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own buyer row"
  ON buyers FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own buyer row"
  ON buyers FOR UPDATE
  USING (auth.uid() = id);
