import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Thiếu code' }, { status: 400 });
    }

    // Verify caller is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const normalizedCode = code.toUpperCase().trim();

    // Get current used_count then increment (admin bypasses RLS)
    const { data: voucher } = await supabaseAdmin
      .from('vouchers')
      .select('used_count')
      .eq('code', normalizedCode)
      .single();

    if (voucher) {
      await supabaseAdmin
        .from('vouchers')
        .update({ used_count: (voucher.used_count || 0) + 1 })
        .eq('code', normalizedCode);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Non-blocking: log but don't fail the order flow
    console.warn('Redeem voucher error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
