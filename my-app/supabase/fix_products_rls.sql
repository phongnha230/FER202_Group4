-- Fix Products RLS: Add admin policies for products management
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "admin_insert_products" ON products;
DROP POLICY IF EXISTS "admin_update_products" ON products;
DROP POLICY IF EXISTS "admin_delete_products" ON products;

-- Admin can INSERT products
CREATE POLICY "admin_insert_products" ON products FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

-- Admin can UPDATE products
CREATE POLICY "admin_update_products" ON products FOR UPDATE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

-- Admin can DELETE products
CREATE POLICY "admin_delete_products" ON products FOR DELETE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

-- Admin policies for product_variants
CREATE POLICY "admin_insert_variants" ON product_variants FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "admin_update_variants" ON product_variants FOR UPDATE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "admin_delete_variants" ON product_variants FOR DELETE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

-- Admin policies for product_images
CREATE POLICY "admin_insert_images" ON product_images FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "admin_update_images" ON product_images FOR UPDATE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "admin_delete_images" ON product_images FOR DELETE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

-- Admin policies for categories
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "admin_update_categories" ON categories FOR UPDATE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "admin_delete_categories" ON categories FOR DELETE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);
