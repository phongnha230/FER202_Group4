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
 * This is a placeholder for actual gateway integration (Momo, VNPay, Credit Card, etc.)
 */
export async function initializePayment(
    orderId: string,
    method: 'momo' | 'vnpay' | 'card' | 'payos'
): Promise<{ paymentUrl?: string; error: Error | null }> {
    if (method === 'payos') {
        try {
            const response = await fetch('/api/payment/payos/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
            });
            const data = await response.json();
            if (!response.ok) {
                return { error: new Error(data.error || 'Failed to create PayOS payment link') };
            }
            return { paymentUrl: data.checkoutUrl, error: null };
        } catch (err) {
            return { error: err as Error };
        }
    }

    // Mock fallback for other methods (momo, vnpay, card)
    return {
        paymentUrl: `/checkout/payment-mock?orderId=${orderId}&method=${method}`,
        error: null,
    };
}
