import Image from 'next/image';
import Link from 'next/link';
import { adaptProductsToUI } from '@/lib/adapters/product.adapter';
import type { UIProduct } from '@/lib/adapters/product.adapter';
import { supabaseAdmin } from '@/lib/supabase/admin';

type TopSellingOrderItemRow = {
    quantity: number;
    product_variants: { product_id: string } | { product_id: string }[] | null;
};

type RankedStyleProduct = UIProduct & {
    soldCount: number;
    rank: number;
};

const STYLE_PRODUCT_SELECT = `
    *,
    category:categories(id, name),
    variants:product_variants(*),
    images:product_images(*)
`;

const SUCCESSFUL_ORDER_STATUSES = ['paid', 'processing', 'shipping', 'delivered', 'completed'];

async function getFeaturedStyleProducts(limit = 7) {
    const featuredQuery = await supabaseAdmin
        .from('products')
        .select(STYLE_PRODUCT_SELECT)
        .eq('status', 'active')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (featuredQuery.error) {
        return { data: [] as RankedStyleProduct[], error: featuredQuery.error };
    }

    let products = featuredQuery.data || [];

    if (products.length < limit) {
        const fallbackQuery = await supabaseAdmin
            .from('products')
            .select(STYLE_PRODUCT_SELECT)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(limit * 2);

        if (!fallbackQuery.error && fallbackQuery.data) {
            const deduped = new Map<string, (typeof fallbackQuery.data)[number]>();
            [...products, ...fallbackQuery.data].forEach((product) => {
                deduped.set(product.id, product);
            });
            products = Array.from(deduped.values()).slice(0, limit);
        }
    }

    const featuredProducts = adaptProductsToUI(products)
        .filter((product) => product.slug && product.image)
        .map((product, index) => ({
            ...product,
            soldCount: 0,
            rank: index + 1,
        }));

    return { data: featuredProducts, error: null };
}

async function getTopSellingStyleProducts(limit = 7) {
    const salesQuery = await supabaseAdmin
        .from('order_items')
        .select(`
            quantity,
            product_variants!inner(product_id),
            orders!inner(payment_status, order_status)
        `)
        .eq('orders.payment_status', 'paid')
        .in('orders.order_status', SUCCESSFUL_ORDER_STATUSES);

    if (salesQuery.error) {
        return { data: [] as RankedStyleProduct[], error: salesQuery.error };
    }

    const salesByProduct = new Map<string, number>();

    for (const item of (salesQuery.data || []) as TopSellingOrderItemRow[]) {
        const variant = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;
        const productId = variant?.product_id;

        if (!productId) continue;

        salesByProduct.set(productId, (salesByProduct.get(productId) || 0) + (item.quantity || 0));
    }

    const rankedProductIds = Array.from(salesByProduct.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([productId]) => productId);

    if (rankedProductIds.length === 0) {
        return { data: [] as RankedStyleProduct[], error: null };
    }

    const productsQuery = await supabaseAdmin
        .from('products')
        .select(STYLE_PRODUCT_SELECT)
        .eq('status', 'active')
        .in('id', rankedProductIds);

    if (productsQuery.error) {
        return { data: [] as RankedStyleProduct[], error: productsQuery.error };
    }

    const rankedProducts = adaptProductsToUI(productsQuery.data || [])
        .filter((product) => product.slug && product.image)
        .sort((a, b) => (salesByProduct.get(b.id) || 0) - (salesByProduct.get(a.id) || 0))
        .map((product, index) => ({
            ...product,
            soldCount: salesByProduct.get(product.id) || 0,
            rank: index + 1,
        }));

    return { data: rankedProducts, error: null };
}

async function getStyleProducts(limit = 7) {
    const topSellingQuery = await getTopSellingStyleProducts(limit);

    if (!topSellingQuery.error && topSellingQuery.data.length > 0) {
        return topSellingQuery;
    }

    const fallbackQuery = await getFeaturedStyleProducts(limit);

    if (fallbackQuery.error) {
        return { data: [] as RankedStyleProduct[], error: fallbackQuery.error };
    }

    return { data: fallbackQuery.data, error: topSellingQuery.error };
}

function formatPrice(price?: number) {
    if (typeof price !== 'number') return 'N/A';
    return `$${price.toFixed(2)}`;
}

export default async function StyleInspiration() {
    const { data, error } = await getStyleProducts(7);

    if (error) {
        console.error('Error loading style products:', error);
    }

    if (data.length === 0) {
        return null;
    }

    const [mainProduct, ...sideProducts] = data;
    const hasSalesRanking = data.some((product) => product.soldCount > 0);

    return (
        <section className="bg-[#f2f2f0] py-14 md:py-18 lg:py-20">
            <div className="container-custom">
                <div className="mb-7 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                            {hasSalesRanking ? 'Top Selling Products' : 'Style Selection'}
                        </p>
                        <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-950 md:text-4xl">
                            {hasSalesRanking ? 'Best Sellers' : 'Shop The Look'}
                        </h2>
                    </div>
                    <Link
                        href="/streetwear"
                        className="text-sm font-semibold uppercase tracking-wide text-slate-800 transition hover:text-black"
                    >
                        View all
                    </Link>
                </div>

                <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[0.95fr_1.05fr] md:gap-5">
                    <Link
                        href={`/product/${mainProduct.slug}`}
                        className="group block overflow-hidden rounded-[20px] border border-slate-300/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)] md:grid md:h-full md:grid-rows-[1fr_auto]"
                    >
                        <div className="relative min-h-[300px] bg-gradient-to-b from-slate-100 to-slate-200 md:min-h-0">
                            <Image
                                src={mainProduct.image}
                                alt={mainProduct.name}
                                fill
                                sizes="(max-width: 1024px) 100vw, 56vw"
                                className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.04]"
                            />
                            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                                <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                                    #{mainProduct.rank} Best Seller
                                </span>
                                <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                    {mainProduct.category || 'Streetwear'}
                                </span>
                            </div>
                        </div>
                        <div className="border-t border-slate-200 px-6 py-5">
                            <p className="line-clamp-2 text-2xl font-semibold leading-tight text-slate-950">{mainProduct.name}</p>
                            {mainProduct.soldCount > 0 && (
                                <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                                    {mainProduct.soldCount} sold
                                </p>
                            )}
                            <div className="mt-3 flex items-center justify-between gap-4">
                                <p className="text-lg font-bold text-slate-900">{formatPrice(mainProduct.salePrice ?? mainProduct.price)}</p>
                                <span className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition group-hover:bg-slate-800">
                                    {mainProduct.soldCount > 0 ? 'Top product' : 'View product'}
                                </span>
                            </div>
                        </div>
                    </Link>

                    <div className="grid h-full auto-rows-fr content-start items-stretch grid-cols-2 gap-4 self-start xl:grid-cols-3">
                        {sideProducts.map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.slug}`}
                                className="group block h-full rounded-2xl border border-slate-300/80 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.11)]"
                            >
                                <div className="relative min-h-[150px] overflow-hidden rounded-xl bg-gradient-to-b from-slate-100 to-slate-200">
                                    <span className="absolute left-3 top-3 z-10 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                                        #{product.rank}
                                    </span>
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 18vw"
                                        className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                                <div className="pt-3.5">
                                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{product.name}</p>
                                    {product.soldCount > 0 && (
                                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                            {product.soldCount} sold
                                        </p>
                                    )}
                                    <p className="mt-1.5 text-sm font-bold text-slate-900">{formatPrice(product.salePrice ?? product.price)}</p>
                                    <span className="mt-2.5 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-800 transition group-hover:bg-slate-900 group-hover:text-white">
                                        {product.soldCount > 0 ? 'View rank' : 'View product'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
