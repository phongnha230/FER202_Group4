import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createNotification } from '@/services/notification.service';
import { createShippingLog } from '@/services/shipping-log.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, newStatus } = body as { orderId: string; newStatus: string };

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing orderId or newStatus' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending_payment', 'paid', 'processing', 'shipping', 'delivered'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Verify caller is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get order with user_id for notification
    const { data: order, error: orderFetchError } = await supabaseAdmin
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (orderFetchError || !order) {
      return NextResponse.json(
        { error: 'Order not found', details: orderFetchError?.message },
        { status: 404 }
      );
    }

    // Get shipping_orders id for this order
    const { data: shippingOrder } = await supabaseAdmin
      .from('shipping_orders')
      .select('id')
      .eq('order_id', orderId)
      .single();

    // Map order status to shipping status
    const getShippingStatus = (status: string) => {
      switch (status) {
        case 'pending_payment':
        case 'paid':
        case 'processing':
          return 'created';
        case 'shipping':
          return 'shipping';
        case 'delivered':
        case 'completed':
          return 'delivered';
        default:
          return 'created';
      }
    };

    const shippingStatus = getShippingStatus(newStatus);

    // Update order
    const { error: orderUpdateError } = await supabaseAdmin
      .from('orders')
      .update({
        order_status: newStatus,
        ...(newStatus !== 'pending_payment' && { payment_status: 'paid' }),
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      return NextResponse.json(
        { error: 'Failed to update order', details: orderUpdateError.message },
        { status: 500 }
      );
    }

    // Update shipping_orders
    if (shippingOrder) {
      await supabaseAdmin
        .from('shipping_orders')
        .update({
          status: shippingStatus,
          ...(shippingStatus === 'shipping' && { shipped_at: new Date().toISOString() }),
          ...(shippingStatus === 'delivered' && { delivered_at: new Date().toISOString() }),
        })
        .eq('id', shippingOrder.id);

      // Create shipping_log when status changes (processing, shipping, delivered)
      if (['created', 'shipping', 'delivered'].includes(shippingStatus)) {
        const statusLabels: Record<string, string> = {
          created: 'Đơn hàng đã được tạo',
          shipping: 'Đang giao hàng',
          delivered: 'Đã giao hàng',
        };
        await createShippingLog(
          shippingOrder.id,
          shippingStatus,
          statusLabels[shippingStatus] ?? shippingStatus,
          { order_id: orderId, updated_at: new Date().toISOString() }
        );
      }
    }

    // Create notification for customer
    const notificationMessages: Record<string, { title: string; message: string }> = {
      processing: {
        title: 'Đơn hàng đang xử lý',
        message: `Đơn hàng #${orderId.slice(0, 8).toUpperCase()} đang được chuẩn bị.`,
      },
      shipping: {
        title: 'Đơn hàng đang giao',
        message: `Đơn hàng #${orderId.slice(0, 8).toUpperCase()} đã được gửi đi và đang trên đường giao đến bạn.`,
      },
      delivered: {
        title: 'Đơn hàng đã giao',
        message: `Đơn hàng #${orderId.slice(0, 8).toUpperCase()} đã được giao thành công. Cảm ơn bạn đã mua sắm!`,
      },
    };

    const notif = notificationMessages[newStatus];
    if (notif && order.user_id) {
      await createNotification(order.user_id, notif.title, notif.message, 'success');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin update order status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
