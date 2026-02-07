import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Create a shipping log entry when shipping status changes.
 * Used for tracking history (e.g. when admin updates order to "shipping" or "delivered").
 */
export async function createShippingLog(
  shippingId: string,
  status: string,
  message?: string,
  rawData?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin.from('shipping_logs').insert({
      shipping_id: shippingId,
      status,
      message: message ?? null,
      raw_data: rawData ?? null,
    });

    if (error) {
      console.error('Shipping log create error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e) {
    const err = e as Error;
    console.error('Shipping log create error:', err);
    return { success: false, error: err.message };
  }
}
