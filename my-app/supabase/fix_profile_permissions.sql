-- Fix permissions for profiles table to allow users to read their own data
-- Run this in Supabase SQL Editor

-- 1. Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. Grant SELECT on ALL columns of profiles to authenticated users
-- This fixes the issue where "select *" fails because some columns are restricted
GRANT SELECT ON public.profiles TO authenticated;

-- 3. Optimization: Create a clearer policy for reading own profile
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
CREATE POLICY "users_read_own_profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- 4. Allow users to update their own profile
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid());

-- 5. Allow users to insert their own profile
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
CREATE POLICY "users_insert_own_profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- 6. Grant basic access to public (for avatars/names in reviews)
GRANT SELECT (id, full_name, avatar_url, role, created_at) ON public.profiles TO public;
GRANT SELECT (id, full_name, avatar_url, role, created_at) ON public.profiles TO anon;

-- 7. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
