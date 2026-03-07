import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { adaptProductsToUI } from '@/lib/adapters/product.adapter';

async function getStyleProducts(limit = 7) {
    const supabase = await createClient();

    const baseSelect = `
        *,
        category:categories(id, name),
        variants:product_variants(*),
        images:product_images(*)
    `;

    const featuredQuery = await supabase
        .from('products')
        .select(baseSelect)
        .eq('status', 'active')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (featuredQuery.error) {
        return { data: [], error: featuredQuery.error };
    }

    let products = featuredQuery.data || [];

    if (products.length < limit) {
        const fallback = supabase
            .from('products')
            .select(baseSelect)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(limit * 2);

        const fallbackQuery = await fallback;
        if (!fallbackQuery.error && fallbackQuery.data) {
            const deduped = new Map<string, (typeof fallbackQuery.data)[number]>();
            [...products, ...fallbackQuery.data].forEach((item) => {
                deduped.set(item.id, item);
            });
            products = Array.from(deduped.values()).slice(0, limit);
        }
    }

    return { data: products, error: null };
}

function formatPrice(price?: number) {
    if (typeof price !== 'number') return 'N/A';
    return `$${price.toFixed(2)}`;
}

export default async function StyleInspiration() {
    const { data, error } = await getStyleProducts(7);

    if (error) {
        console.error('Error loading style products:', error);
        return null;
    }

    const products = adaptProductsToUI(data).filter((p) => p.slug && p.image);

    if (products.length === 0) {
        return null;
    }

    const [mainProduct, ...sideProducts] = products;

    return (
        <section className="bg-[#f2f2f0] py-14 md:py-18 lg:py-20">
            <div className="container-custom">
                <div className="mb-7 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Style Selection</p>
                        <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-950 md:text-4xl">Shop The Look</h2>
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
                            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                {mainProduct.category || 'Streetwear'}
                            </span>
                        </div>
                        <div className="border-t border-slate-200 px-6 py-5">
                            <p className="line-clamp-2 text-2xl font-semibold leading-tight text-slate-950">{mainProduct.name}</p>
                            <div className="mt-3 flex items-center justify-between gap-4">
                                <p className="text-lg font-bold text-slate-900">{formatPrice(mainProduct.salePrice ?? mainProduct.price)}</p>
                                <span className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition group-hover:bg-slate-800">
                                    View product
                                </span>
                            </div>
                        </div>
                    </Link>

                    <div className="grid h-full auto-rows-fr content-start items-stretch grid-cols-2 gap-4 self-start xl:grid-cols-3">
                        {sideProducts.slice(0, 6).map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.slug}`}
                                className="group block h-full rounded-2xl border border-slate-300/80 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.11)]"
                            >
                                <div className="relative min-h-[150px] overflow-hidden rounded-xl bg-gradient-to-b from-slate-100 to-slate-200">
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
                                    <p className="mt-1.5 text-sm font-bold text-slate-900">{formatPrice(product.salePrice ?? product.price)}</p>
                                    <span className="mt-2.5 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-800 transition group-hover:bg-slate-900 group-hover:text-white">
                                        Add to cart
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
