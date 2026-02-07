-- Fix RLS policy to allow stock restoration when order is cancelled
-- This allows the system to restore stock for cancelled orders
-- Run this in Supabase SQL Editor

-- Option 1: Allow admin to update variants (for stock management)
-- Check if policy exists first
DROP POLICY IF EXISTS "admin_update_variants" ON product_variants;

CREATE POLICY "admin_update_variants" ON product_variants 
FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

-- Option 2: Create a database function to restore stock (more secure)
-- This function can be called by any authenticated user but only restores stock for their cancelled orders
CREATE OR REPLACE FUNCTION restore_order_stock(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with the privileges of the function creator (superuser)
AS $$
DECLARE
    v_user_id UUID;
    v_order_status TEXT;
    item RECORD;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Verify the order belongs to the user and is being cancelled
    SELECT order_status INTO v_order_status
    FROM orders
    WHERE id = p_order_id AND user_id = v_user_id;
    
    IF v_order_status IS NULL THEN
        RAISE EXCEPTION 'Order not found or does not belong to user';
    END IF;
    
    IF v_order_status != 'cancelled' THEN
        RAISE EXCEPTION 'Can only restore stock for cancelled orders';
    END IF;
    
    -- Restore stock for each item in the order
    FOR item IN 
        SELECT variant_id, quantity 
        FROM order_items 
        WHERE order_id = p_order_id
    LOOP
        UPDATE product_variants
        SET stock = stock + item.quantity
        WHERE id = item.variant_id;
    END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION restore_order_stock(UUID) TO authenticated;

-- Verify
SELECT 'Stock restore function created successfully' as result;
