import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderEmail, OrderEmailType } from '@/lib/notifications/send-order-email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, type } = body as { orderId: string; type: OrderEmailType };

    if (!orderId || !type) {
      return NextResponse.json(
        { error: 'Missing orderId or type' },
        { status: 400 }
      );
    }

    if (!['order_placed', 'order_success'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be order_placed or order_success' },
        { status: 400 }
      );
    }

    // Verify user owns the order (for order_placed - called from checkout)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();
    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 403 });
    }

    const result = await sendOrderEmail(orderId, type);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email sent successfully (${type})`,
    });
  } catch (error) {
    console.error('Order email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
