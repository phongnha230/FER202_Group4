import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createOrder, createBuyNowOrder } from '@/services/order.service';

export async function POST(req: NextRequest) {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mode, ...params } = body;

    let result;
    if (mode === 'buy_now') {
        result = await createBuyNowOrder(user.id, params, supabaseAdmin);
    } else {
        result = await createOrder(user.id, params, supabaseAdmin);
    }

    if (result.error || !result.data) {
        return NextResponse.json(
            { error: (result.error as Error)?.message || 'Failed to create order' },
            { status: 400 }
        );
    }

    return NextResponse.json({ order: result.data });
}
