-- Performance indexes for common queries
-- Run this in Supabase SQL Editor

-- Products: Featured products query (homepage)
CREATE INDEX IF NOT EXISTS idx_products_featured_status 
  ON products(featured, status) 
  WHERE status = 'active' AND featured = true;

-- Products: Slug lookup (product detail page)
CREATE INDEX IF NOT EXISTS idx_products_slug 
  ON products(slug) 
  WHERE slug IS NOT NULL;

-- Products: Category filtering
CREATE INDEX IF NOT EXISTS idx_products_category_status 
  ON products(category_id, status);

-- Products: Created at for ordering
CREATE INDEX IF NOT EXISTS idx_products_created_at 
  ON products(created_at DESC);

-- Product Variants: Product lookup
CREATE INDEX IF NOT EXISTS idx_variants_product_id 
  ON product_variants(product_id);

-- Product Images: Product lookup  
CREATE INDEX IF NOT EXISTS idx_images_product_id 
  ON product_images(product_id);

-- Cart Items: Cart lookup
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id 
  ON cart_items(cart_id);

-- Carts: User lookup
CREATE INDEX IF NOT EXISTS idx_carts_user_id 
  ON carts(user_id);

-- Orders: User lookup + status filtering
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
  ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON orders(order_status);

-- Order Items: Order lookup
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
  ON order_items(order_id);

-- Shipping: Order lookup
CREATE INDEX IF NOT EXISTS idx_shipping_order_id 
  ON shipping_orders(order_id);

-- Notifications: User + read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, is_read) 
  WHERE is_read = false;
