import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type ProductCardStats = {
  averageRating: number;
  totalReviews: number;
  soldCount: number;
};

type SalesRow = {
  quantity: number | null;
  variant_id: string;
};

type VariantRow = {
  id: string;
  product_id: string;
};

const SUCCESSFUL_ORDER_STATUSES = ['paid', 'processing', 'shipping', 'delivered', 'completed'];

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids') || '';
  const productIds = Array.from(
    new Set(
      idsParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    )
  );

  if (productIds.length === 0) {
    return NextResponse.json({ error: 'Missing product ids' }, { status: 400 });
  }

  const stats: Record<string, ProductCardStats> = Object.fromEntries(
    productIds.map((id) => [
      id,
      {
        averageRating: 0,
        totalReviews: 0,
        soldCount: 0,
      },
    ])
  );

  const [reviewsResult, variantsResult] = await Promise.all([
    supabaseAdmin.from('reviews').select('product_id, rating').in('product_id', productIds),
    supabaseAdmin.from('product_variants').select('id, product_id').in('product_id', productIds),
  ]);

  if (reviewsResult.error) {
    return NextResponse.json({ error: reviewsResult.error.message }, { status: 500 });
  }

  if (variantsResult.error) {
    return NextResponse.json({ error: variantsResult.error.message }, { status: 500 });
  }

  for (const review of reviewsResult.data || []) {
    const productId = review.product_id;
    const current = stats[productId];

    if (!current) {
      continue;
    }

    current.averageRating += review.rating || 0;
    current.totalReviews += 1;
  }

  for (const productId of productIds) {
    const current = stats[productId];
    if (current.totalReviews > 0) {
      current.averageRating = Math.round((current.averageRating / current.totalReviews) * 10) / 10;
    }
  }

  const variants = (variantsResult.data || []) as VariantRow[];
  const variantIds = variants.map((variant) => variant.id);
  const productByVariantId = new Map(variants.map((variant) => [variant.id, variant.product_id]));

  if (variantIds.length > 0) {
    const salesResult = await supabaseAdmin
      .from('order_items')
      .select(`
        quantity,
        variant_id,
        orders!inner(payment_status, order_status)
      `)
      .in('variant_id', variantIds)
      .eq('orders.payment_status', 'paid')
      .in('orders.order_status', SUCCESSFUL_ORDER_STATUSES);

    if (salesResult.error) {
      return NextResponse.json({ error: salesResult.error.message }, { status: 500 });
    }

    for (const row of (salesResult.data || []) as SalesRow[]) {
      const productId = productByVariantId.get(row.variant_id);

      if (!productId || !stats[productId]) {
        continue;
      }

      stats[productId].soldCount += row.quantity || 0;
    }
  }

  return NextResponse.json({ stats });
}
