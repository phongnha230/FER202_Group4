-- Script to fix Profile Save & Avatar Upload issues
-- Run this in the Supabase SQL Editor

-- 1. Create 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for 'avatars' bucket

-- Public access (anyone can view avatars)
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
CREATE POLICY "Avatar Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Authenticated upload (users can upload their own avatar)
DROP POLICY IF EXISTS "Avatar Authenticated Upload" ON storage.objects;
CREATE POLICY "Avatar Authenticated Upload"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Update own avatar
DROP POLICY IF EXISTS "Avatar Update Own" ON storage.objects;
CREATE POLICY "Avatar Update Own"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Delete own avatar
DROP POLICY IF EXISTS "Avatar Delete Own" ON storage.objects;
CREATE POLICY "Avatar Delete Own"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'avatars' AND auth.uid() = owner );


-- 3. Update 'profiles' table with missing columns
-- Add columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Vietnam';

-- 4. RLS Policies for 'profiles' table

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Read own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

-- Update own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Insert own profile (for new users triggers usually handle this, but good to have)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Public read access (for reviews/comments where user info is shown)
DROP POLICY IF EXISTS "Public can read profiles" ON public.profiles;
CREATE POLICY "Public can read profiles"
  ON public.profiles FOR SELECT
  USING ( true );
