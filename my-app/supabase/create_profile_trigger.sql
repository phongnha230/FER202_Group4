-- Trigger to automatically create a profile when a new user signs up
-- Run this in Supabase SQL Editor

-- Create the function that will be called by the trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Unknown'),
    'customer',
    now()
  );
  return new;
end;
$$;

-- Create the trigger on auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grant necessary permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;

-- Also, let's create profiles for any existing users that don't have one
-- (Run this once to backfill existing users)
insert into public.profiles (id, full_name, role, created_at)
select 
  au.id,
  coalesce(au.raw_user_meta_data->>'full_name', 'Unknown'),
  'customer',
  coalesce(au.created_at, now())
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null;
