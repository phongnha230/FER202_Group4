-- Migration: Add voucher/promo code system
-- Run this in Supabase SQL Editor

-- 1. VOUCHERS TABLE
create table if not exists vouchers (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  min_order_amount numeric default 0,
  max_uses int default null,           -- NULL = unlimited
  used_count int default 0,
  expires_at timestamptz default null, -- NULL = no expiry
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. ADD VOUCHER FIELDS TO ORDERS TABLE
alter table orders
  add column if not exists voucher_code text references vouchers(code) on update cascade,
  add column if not exists discount_amount numeric default 0;

-- 3. RLS FOR VOUCHERS
alter table vouchers enable row level security;

-- Anyone can read active vouchers (needed for validation at checkout)
create policy "public read active vouchers"
  on vouchers for select
  to public
  using (is_active = true);

-- Only admin can insert/update/delete vouchers
create policy "admin manage vouchers"
  on vouchers for all
  to authenticated
  using (exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin'))
  with check (exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin'));

-- 4. INDEX
create index if not exists idx_vouchers_code on vouchers(code);

-- 5. SEED: Sample vouchers for testing
insert into vouchers (code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at) values
  ('WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên', 'percentage', 10, 0, 100, now() + interval '1 year'),
  ('SAVE20', 'Giảm $20 cho đơn từ $100', 'fixed', 20, 100, 50, now() + interval '6 months'),
  ('FREESHIP', 'Giảm $15 phí ship', 'fixed', 15, 50, null, null)
on conflict (code) do nothing;
