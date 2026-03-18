import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import payos from '@/lib/payos';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Get order total from DB
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, total_price')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate a unique numeric orderCode for PayOS
    const orderCode = Date.now();

    // Convert amount to VND. Adjust PAYOS_VND_RATE in .env.local if your prices are not in USD.
    // Default: 1 USD = 24,000 VND
    const vndRate = Number(process.env.PAYOS_VND_RATE || 24000);
    const amountVND = Math.round(order.total_price * vndRate);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount: amountVND,
      // PayOS description max 25 chars
      description: `DH ${orderId.slice(0, 8).toUpperCase()}`,
      returnUrl: `${baseUrl}/checkout/payos-return?orderId=${orderId}`,
      cancelUrl: `${baseUrl}/checkout?paymentCancelled=true`,
    });

    // Store orderCode in transaction_code for webhook lookup
    await supabaseAdmin
      .from('payments')
      .update({ transaction_code: orderCode.toString() })
      .eq('order_id', orderId);

    return NextResponse.json({ checkoutUrl: paymentLink.checkoutUrl });
  } catch (error) {
    console.error('PayOS create payment link error:', error);
    return NextResponse.json(
      { error: 'Failed to create PayOS payment link' },
      { status: 500 }
    );
  }
}
