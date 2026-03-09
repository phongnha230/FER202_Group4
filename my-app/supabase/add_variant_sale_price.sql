-- Add sale_price column to product_variants table
ALTER TABLE product_variants
ADD COLUMN sale_price decimal(10,2) NULL;

-- Update the realtime policy if needed, though usually adding a column doesn't require it
-- unless explicit column grants are used.
