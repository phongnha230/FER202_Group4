-- FIX: Allow public read access to profiles (needed for Reviews)
-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "user read own profile" ON profiles;

-- 2. Create a new permissive policy for SELECT
CREATE POLICY "public read profiles" 
ON profiles FOR SELECT 
TO public 
USING (true);

-- 3. Security: Restrict column access so phone/address don't leak
-- Revoke all access first to reset
REVOKE SELECT ON profiles FROM public;
REVOKE SELECT ON profiles FROM authenticated;
REVOKE SELECT ON profiles FROM anon;

-- Grant access to specific safe columns only
GRANT SELECT (id, full_name, avatar_url, role, created_at) ON profiles TO public;
GRANT SELECT (id, full_name, avatar_url, role, created_at) ON profiles TO authenticated;
GRANT SELECT (id, full_name, avatar_url, role, created_at) ON profiles TO anon;

-- Note: 'anon' is for unauthenticated users, 'authenticated' for logged in users. 
-- 'public' role covers all, but sometimes explicit grants to anon/authenticated are safer in Supabase.
