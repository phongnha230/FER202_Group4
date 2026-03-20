-- Migration: Add starts_at to vouchers table
-- Run this in Supabase SQL Editor

ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS starts_at timestamptz DEFAULT null;
