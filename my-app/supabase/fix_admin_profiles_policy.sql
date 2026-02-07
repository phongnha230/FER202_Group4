-- Fix: Allow admin to read all profiles
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policy
drop policy if exists "user read own profile" on profiles;

-- Create new policy: Users can read their own profile OR admins can read all
create policy "profiles_select_policy" on profiles for select to authenticated 
using (
  id = (select auth.uid())
  OR
  exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin')
);

-- Also check if there are any users in auth.users
-- Run this to see existing users:
-- select id, email, created_at, raw_user_meta_data from auth.users;

-- Check profiles table:
-- select * from profiles;

-- If profiles table is empty but auth.users has records, run the backfill again:
insert into public.profiles (id, full_name, role, created_at)
select 
  au.id,
  coalesce(au.raw_user_meta_data->>'full_name', 'Unknown'),
  'customer',
  coalesce(au.created_at, now())
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null
on conflict (id) do nothing;
