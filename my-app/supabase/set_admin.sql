-- =====================================================
-- SQL Script to Set a User as Admin
-- =====================================================
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- Go to: SQL Editor > New Query
-- =====================================================

-- Option 1: Set admin by EMAIL (RECOMMENDED - also updates user metadata for faster auth)
-- Replace 'your-email@example.com' with your actual email
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'your-email@example.com';
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found with that email';
    END IF;
    
    -- Update profiles table
    UPDATE profiles SET role = 'admin' WHERE id = target_user_id;
    
    -- Update user metadata for faster middleware check
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
    WHERE id = target_user_id;
    
    RAISE NOTICE 'Successfully set user % as admin', target_user_id;
END $$;

-- Option 2: Set admin by USER ID (if you know the user ID)
-- Replace 'your-user-id-here' with the actual UUID
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id-here';

-- =====================================================
-- Verify the update
-- =====================================================
SELECT 
    p.id,
    u.email,
    p.full_name,
    p.role,
    p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';

-- =====================================================
-- Optional: List all users to find the one you want
-- =====================================================
-- SELECT 
--     p.id,
--     u.email,
--     p.full_name,
--     p.role
-- FROM profiles p
-- JOIN auth.users u ON p.id = u.id
-- ORDER BY p.created_at DESC;

-- =====================================================
-- Optional: Create a new admin user with password
-- (Use this if you want to create a dedicated admin account)
-- =====================================================
-- First, sign up through the app with email/password
-- Then run the UPDATE statement above to set role = 'admin'

-- =====================================================
-- IMPORTANT: After running this SQL
-- =====================================================
-- 1. Log out from the app if you're logged in
-- 2. Go to http://localhost:3000/login
-- 3. Login with your admin email/password
-- 4. You will be automatically redirected to /admin/dashboard
