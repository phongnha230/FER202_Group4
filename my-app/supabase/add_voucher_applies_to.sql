-- Migration: Add applies_to column to vouchers table
-- Run this in Supabase SQL Editor

alter table vouchers
  add column if not exists applies_to text not null default 'order'
    check (applies_to in ('order', 'shipping'));

-- Update existing shipping-related vouchers
update vouchers set applies_to = 'shipping'
  where lower(code) like '%ship%' or lower(description) like '%ship%';
