import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderEmail } from '@/lib/notifications/send-order-email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body as { orderId: string };

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    // Verify caller is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify order belongs to user and is indeed cancelled
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_status, user_id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.order_status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Order is not cancelled' },
        { status: 400 }
      );
    }

    // Send cancellation email (non-blocking, don't fail the response if email fails)
    sendOrderEmail(orderId, 'order_cancelled_by_user').catch((err) => {
      console.warn('Failed to send order cancelled email (non-blocking):', err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel email route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
