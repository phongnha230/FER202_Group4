import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
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

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        total_price,
        order_status,
        payment_status,
        payment_method,
        created_at,
        profiles:user_id (
          full_name,
          phone,
          address
        ),
        shipping_orders (
          receiver_name,
          receiver_phone,
          receiver_address,
          shipping_fee,
          status
        ),
        order_items (
          id,
          quantity,
          price,
          variant:product_variants (
            size,
            color,
            product:products (
              name,
              image
            )
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Order not found', details: error?.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

