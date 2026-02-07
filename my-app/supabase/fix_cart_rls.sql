-- Fix Cart & Order RLS Policies
-- Run this in your Supabase SQL Editor

-- =====================
-- CART POLICIES
-- =====================

-- First, drop the existing policies
DROP POLICY IF EXISTS "user own cart" ON carts;
DROP POLICY IF EXISTS "user own cart items" ON cart_items;

-- Create more explicit policies for carts table
CREATE POLICY "carts_select_own" ON carts 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "carts_insert_own" ON carts 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "carts_update_own" ON carts 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "carts_delete_own" ON carts 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- Create more explicit policies for cart_items table
-- SELECT: Can read items from own carts
CREATE POLICY "cart_items_select_own" ON cart_items 
  FOR SELECT TO authenticated 
  USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  );

-- INSERT: Can insert items to own carts
CREATE POLICY "cart_items_insert_own" ON cart_items 
  FOR INSERT TO authenticated 
  WITH CHECK (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  );

-- UPDATE: Can update items in own carts
CREATE POLICY "cart_items_update_own" ON cart_items 
  FOR UPDATE TO authenticated 
  USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  );

-- DELETE: Can delete items from own carts
CREATE POLICY "cart_items_delete_own" ON cart_items 
  FOR DELETE TO authenticated 
  USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  );

-- Verify RLS is enabled on both tables
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Optional: Create an index to speed up the subquery
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- =====================
-- ORDER_ITEMS POLICIES
-- =====================

-- Drop existing policies
DROP POLICY IF EXISTS "user read own order items" ON order_items;

-- SELECT: Can read items from own orders
CREATE POLICY "order_items_select_own" ON order_items 
  FOR SELECT TO authenticated 
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- INSERT: Can insert items to own orders
CREATE POLICY "order_items_insert_own" ON order_items 
  FOR INSERT TO authenticated 
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- =====================
-- SHIPPING_ORDERS POLICIES
-- =====================

-- Drop existing policies
DROP POLICY IF EXISTS "user read own shipping" ON shipping_orders;

-- SELECT: Can read own shipping orders
CREATE POLICY "shipping_orders_select_own" ON shipping_orders 
  FOR SELECT TO authenticated 
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- INSERT: Can create shipping for own orders
CREATE POLICY "shipping_orders_insert_own" ON shipping_orders 
  FOR INSERT TO authenticated 
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- =====================
-- PAYMENTS POLICIES
-- =====================

-- Drop existing policies
DROP POLICY IF EXISTS "user own payments" ON payments;

-- SELECT: Can read own payments
CREATE POLICY "payments_select_own" ON payments 
  FOR SELECT TO authenticated 
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- INSERT: Can create payments for own orders
CREATE POLICY "payments_insert_own" ON payments 
  FOR INSERT TO authenticated 
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_orders_order_id ON shipping_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
