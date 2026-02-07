-- Fix RLS circular reference issue for profiles table
-- Run this in Supabase SQL Editor

-- First, drop problematic policies
drop policy if exists "profiles_select_policy" on profiles;
drop policy if exists "user read own profile" on profiles;

-- Create a SECURITY DEFINER function to check admin role (bypasses RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Now create proper RLS policies using the function

-- 1. Users can read their own profile
create policy "users_read_own_profile" on profiles 
for select to authenticated 
using (id = (select auth.uid()));

-- 2. Admins can read all profiles (using the security definer function)
create policy "admins_read_all_profiles" on profiles 
for select to authenticated 
using (public.is_admin() = true);

-- 3. Users can update their own profile
drop policy if exists "user update own profile" on profiles;
create policy "users_update_own_profile" on profiles 
for update to authenticated 
using (id = (select auth.uid()));

-- 4. Users can insert their own profile (for signup)
drop policy if exists "user can insert own profile" on profiles;
create policy "users_insert_own_profile" on profiles 
for insert to authenticated 
with check (id = (select auth.uid()));

-- Verify the policies are created
select policyname, cmd from pg_policies where tablename = 'profiles';
