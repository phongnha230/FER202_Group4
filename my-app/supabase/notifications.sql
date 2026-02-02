-- Create Notifications Table
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
  is_read boolean default false,
  created_at timestamp default now()
);

-- Enable RLS
alter table notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications (mark as read)"
  on notifications for update
  using (auth.uid() = user_id);

-- Only system/admin (or server-side) allows inserting notifications usually
-- But for simple apps, we might allow users to trigger them or just rely on postgres functions/triggers
-- For now, we'll allow system-level insertion via service role or specific triggers.
