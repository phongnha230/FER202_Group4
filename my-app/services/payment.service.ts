import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Payment } from '@/types/database.types';

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  orderId: string,
  status: 'success' | 'failed',
  transactionCode?: string
): Promise<{ error: PostgrestError | null }> {
  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status,
      transaction_code: transactionCode,
      paid_at: status === 'success' ? new Date().toISOString() : null,
    })
    .eq('order_id', orderId);

  if (paymentError) {
    return { error: paymentError };
  }

  // Update order status if payment is successful
  if (status === 'success') {
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        order_status: 'paid', // Or 'processing' depending on workflow
      })
      .eq('id', orderId);

    if (orderError) return { error: orderError };
  }

  return { error: null };
}

/**
 * Get payment details for an order
 */
export async function getPaymentByOrderId(orderId: string): Promise<{ data: Payment | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .single();

  return { data, error };
}

/**
 * Initialize a payment (e.g. for external gateways)
 * This is a placeholder for actual gateway integration (Momo, VNPay, etc.)
 */
export async function initializePayment(
    orderId: string, 
    method: 'momo' | 'vnpay' | 'cod'
): Promise<{ paymentUrl?: string; error: Error | null }> {
    if (method === 'cod') {
        return { error: null }; // No URL needed
    }

    // Mock logic for online payment
    // In a real app, this would call the backend API to generate a payment URL
    console.log(`Initializing ${method} payment for order ${orderId}`);
    
    // Simulate a payment URL
    return { 
        paymentUrl: `/checkout/payment-mock?orderId=${orderId}&method=${method}`,
        error: null 
    };
}
