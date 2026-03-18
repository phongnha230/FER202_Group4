import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPayOS } from '@/lib/payos';
import { createNotification } from '@/services/notification.service';
import { sendOrderEmail } from '@/lib/notifications/send-order-email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify PayOS webhook signature and extract data
    const webhookData = await getPayOS().webhooks.verify(body);

    const { orderCode, code, reference } = webhookData;
    const isSuccess = code === '00';

    // Find payment record using the orderCode stored earlier
    const { data: payment, error: paymentQueryError } = await supabaseAdmin
      .from('payments')
      .select('order_id')
      .eq('transaction_code', orderCode.toString())
      .single();

    if (paymentQueryError || !payment) {
      // Unknown orderCode — still return 200 so PayOS doesn't retry
      console.warn('PayOS webhook: payment not found for orderCode', orderCode);
      return NextResponse.json({ code: '00', desc: 'success' });
    }

    const { order_id: orderId } = payment;

    if (isSuccess) {
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'success',
          transaction_code: reference || orderCode.toString(),
          paid_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      const { data: order } = await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'paid', order_status: 'paid' })
        .eq('id', orderId)
        .select('user_id')
        .single();

      if (order?.user_id) {
        await createNotification(
          order.user_id,
          'Thanh toán thành công',
          `Đơn hàng #${orderId.slice(0, 8).toUpperCase()} đã được thanh toán thành công.`,
          'success'
        );
      }

      await sendOrderEmail(orderId, 'order_success');
    } else {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('order_id', orderId);
    }

    // PayOS requires this exact response to acknowledge the webhook
    return NextResponse.json({ code: '00', desc: 'success' });
  } catch (error) {
    console.error('PayOS webhook error:', error);
    // Always return 200 — PayOS retries on non-200 responses
    return NextResponse.json({ code: '00', desc: 'success' });
  }
}
