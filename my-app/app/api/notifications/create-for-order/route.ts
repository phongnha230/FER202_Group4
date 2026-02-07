import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/services/notification.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, title, message, type } = body as {
      orderId: string;
      title: string;
      message: string;
      type?: 'info' | 'success' | 'warning' | 'error';
    };

    if (!orderId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing orderId, title or message' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify order belongs to current user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 403 });
    }

    const result = await createNotification(
      order.user_id,
      title,
      message,
      type ?? 'info'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to create notification', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
