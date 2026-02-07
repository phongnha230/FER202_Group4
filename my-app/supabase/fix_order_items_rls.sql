-- Fix: Allow admin to read all order_items
-- Run this in Supabase SQL Editor
-- Problem: Admin can see all orders but cannot see order_items for other users' orders

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "user read own order items" ON order_items;
DROP POLICY IF EXISTS "order_items_select_own" ON order_items;

-- Create new policy: Users can read their own order items OR admins can read all
CREATE POLICY "order_items_select_policy" ON order_items 
  FOR SELECT TO authenticated 
  USING (
    -- User can read their own order items
    order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid()))
    OR
    -- Admin can read all order items
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- Keep the insert policy for users creating their own order items
DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;

CREATE POLICY "order_items_insert_policy" ON order_items 
  FOR INSERT TO authenticated 
  WITH CHECK (
    -- User can insert to their own orders
    order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid()))
    OR
    -- Admin can insert to any order
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- Add admin update policy for order_items
CREATE POLICY "order_items_admin_update" ON order_items 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- Add admin delete policy for order_items
CREATE POLICY "order_items_admin_delete" ON order_items 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- Verify the policy was created
-- Run this to check:
-- SELECT * FROM pg_policies WHERE tablename = 'order_items';
