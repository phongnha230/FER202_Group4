import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createNotification } from '@/services/notification.service';
import { restoreStock } from '@/services/inventory.service';

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

    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        user_id,
        order_status,
        order_items (variant_id, quantity)
      `)
      .eq('id', orderId)
      .single();

    if (fetchError || !orderData) {
      return NextResponse.json(
        { error: 'Order not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    const cancellableStatuses = ['pending_payment', 'paid', 'processing'];
    if (!cancellableStatuses.includes(orderData.order_status)) {
      return NextResponse.json(
        { error: 'Cannot cancel order in current status' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ order_status: 'cancelled' })
      .eq('id', orderId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to cancel order', details: updateError.message },
        { status: 500 }
      );
    }

    // Restore stock
    const itemsToRestore = (orderData.order_items || []).map((item: { variant_id: string; quantity: number }) => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
    }));
    if (itemsToRestore.length > 0) {
      const { error: stockError } = await restoreStock(itemsToRestore, supabaseAdmin);
      if (stockError) {
        console.warn('Failed to restore stock (non-blocking):', stockError);
      }
    }

    // Create notification for customer
    if (orderData.user_id) {
      await createNotification(
        orderData.user_id,
        'Đơn hàng đã bị hủy',
        `Đơn hàng #${orderId.slice(0, 8).toUpperCase()} đã được hủy bởi quản trị viên.`,
        'warning'
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin cancel order error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
