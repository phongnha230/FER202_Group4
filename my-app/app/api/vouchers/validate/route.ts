import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal, shipping } = await request.json();

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json({ error: 'Thiếu code hoặc subtotal' }, { status: 400 });
    }

    const shippingFee = typeof shipping === 'number' ? shipping : 0;

    const supabase = await createClient();

    const { data: voucher, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !voucher) {
      return NextResponse.json({ error: 'Mã voucher không hợp lệ hoặc đã hết hạn' }, { status: 404 });
    }

    // Kiểm tra hết hạn
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Mã voucher đã hết hạn' }, { status: 400 });
    }

    // Kiểm tra số lần dùng
    if (voucher.max_uses !== null && voucher.used_count >= voucher.max_uses) {
      return NextResponse.json({ error: 'Mã voucher đã hết lượt sử dụng' }, { status: 400 });
    }

    // Xác định base amount dựa trên applies_to
    const appliesTo: 'order' | 'shipping' = voucher.applies_to ?? 'order';

    // Kiểm tra đơn tối thiểu
    // Voucher giảm ship: check theo subtotal + shipping; voucher đơn hàng: check theo subtotal
    const checkAmount = appliesTo === 'shipping' ? subtotal + shippingFee : subtotal;
    if (checkAmount < voucher.min_order_amount) {
      return NextResponse.json(
        { error: `Đơn hàng tối thiểu $${voucher.min_order_amount.toFixed(2)} để dùng mã này` },
        { status: 400 }
      );
    }
    const baseAmount = appliesTo === 'shipping' ? shippingFee : subtotal;

    // Tính tiền giảm
    let discountAmount = 0;
    if (voucher.discount_type === 'percentage') {
      discountAmount = (baseAmount * voucher.discount_value) / 100;
    } else {
      discountAmount = voucher.discount_value;
    }

    // Cap discount không vượt quá base amount
    discountAmount = Math.min(discountAmount, baseAmount);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return NextResponse.json({
      valid: true,
      voucher: {
        code: voucher.code,
        description: voucher.description,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        applies_to: appliesTo,
      },
      discount_amount: discountAmount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi server', details: (error as Error).message },
      { status: 500 }
    );
  }
}
