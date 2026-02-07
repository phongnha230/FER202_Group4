-- Add 'card' to payments.method check constraint
-- Run this migration if you get "invalid input value for enum" when using Credit Card payment

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check 
  CHECK (method IN ('momo', 'vnpay', 'cod', 'card'));
