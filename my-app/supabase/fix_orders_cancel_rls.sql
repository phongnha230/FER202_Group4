-- Fix RLS policy to allow users to cancel their own orders
-- Run this in Supabase SQL Editor

-- Drop the old admin-only update policy
DROP POLICY IF EXISTS "orders_admin_update" ON orders;

-- Create new policy that allows:
-- 1. Admin can update any order
-- 2. User can update their own order ONLY to cancel it (change status to 'cancelled')
CREATE POLICY "orders_update_policy" ON orders FOR UPDATE TO authenticated
USING (
    -- Admin can update any order
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    OR
    -- User can update their own order
    user_id = (SELECT auth.uid())
)
WITH CHECK (
    -- Admin can set any status
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    OR
    (
        -- User can only update their own order
        user_id = (SELECT auth.uid())
        AND
        -- User can only change status to 'cancelled'
        order_status = 'cancelled'
    )
);

-- Verify the policy was created
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orders' AND policyname = 'orders_update_policy';
