import Link from 'next/link';
import Image from 'next/image';
import { adaptProductsToUI } from '@/lib/adapters/product.adapter';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import BlurText from '@/components/ui/BlurText';
import ScrollAnimationWrapper from '@/components/ui/ScrollAnimationWrapper';

type CategoryCard = {
    name: string;
    count: number;
    image: string;
    overlayLabel: string;
    imageClassName: string;
};

function pickLifestyleImage(category: string, fallbackImage: string) {
    const key = category.toLowerCase();

    if (key.includes('sweater')) return '/banners/ao-sweater-nam-phoi-voi-quan-gi-6_84ac797089b142ee9e96d09135c3317b.jpg';
    if (key.includes('jacket') || key.includes('khoac') || key.includes('outer')) return '/banners/jackets.png';
    if (key.includes('tee') || key.includes('thun') || key.includes('t-shirt')) return '/banners/ao-phong-mau-xam-in-chu-va-hinh-anh-phoi-voi-quan-kaki-mau-be.jpg';
    if (key.includes('pant') || key.includes('quan') || key.includes('trouser') || key.includes('bottom')) return '/banners/Pants1.jpg';
    if (key.includes('shirt') || key.includes('so mi') || key.includes('polo')) return '/banners/neon-nights.jpg';

    return fallbackImage || '/banners/hero-model.jpg';
}

function getOverlayLabel(category: string) {
    const key = category.toLowerCase();

    if (key.includes('hood')) return 'HOODIES';
    if (key.includes('sweater')) return 'SWEATERS';
    if (key.includes('jacket') || key.includes('khoac') || key.includes('outer')) return 'JACKETS';
    if (key.includes('tee') || key.includes('thun') || key.includes('t-shirt')) return 'TEES';
    if (key.includes('shirt') || key.includes('so mi') || key.includes('polo')) return 'SHIRTS';

    return category.toUpperCase();
}

function getImageClassName(category: string) {
    const key = category.toLowerCase();

    if (key.includes('jacket') || key.includes('khoac') || key.includes('outer')) {
        return 'object-cover object-[78%_center] transition duration-500 group-hover:scale-105';
    }

    return 'object-cover object-center transition duration-500 group-hover:scale-105';
}

async function getFeaturedProductsServer(limit = 10) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            category:categories(id, name),
            variants:product_variants(*),
            images:product_images(*)
        `)
        .eq('featured', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

    return { data: data || [], error };
}

async function getCategoryCountsServer(): Promise<Map<string, number>> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('products')
        .select('category:categories(name)')
        .eq('status', 'active');

    const counts = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data || []).forEach((p: any) => {
        const cat = p.category;
        const name = (Array.isArray(cat) ? cat[0]?.name : cat?.name)?.trim();
        if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return counts;
}

export default async function FeaturedCollection() {
    const [{ data, error }, categoryCounts] = await Promise.all([
        getFeaturedProductsServer(10),
        getCategoryCountsServer(),
    ]);

    if (error) {
        console.error('Error loading featured products:', error);
        return null;
    }

    const featuredProducts = adaptProductsToUI(data);

    if (featuredProducts.length === 0) {
        return null;
    }

    const categoryMap = new Map<string, CategoryCard>();

    featuredProducts.forEach((product) => {
        const categoryName = product.category?.trim();
        if (!categoryName) return;

        if (categoryMap.has(categoryName)) return;

        categoryMap.set(categoryName, {
            name: categoryName,
            count: categoryCounts.get(categoryName) ?? 0,
            image: pickLifestyleImage(categoryName, product.image),
            overlayLabel: getOverlayLabel(categoryName),
            imageClassName: getImageClassName(categoryName),
        });
    });

    const categoryCards = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);

    if (categoryCards.length === 0) {
        return null;
    }

    return (
        <section className="bg-[#f8f8f6] py-14 md:py-20 lg:py-24">
            <div className="container-custom">
                <ScrollAnimationWrapper>
                    <div className="mx-auto mb-12 max-w-7xl md:mb-14">
                        <div className="grid grid-cols-1 items-center gap-9 md:grid-cols-[640px_1fr] md:gap-20 lg:gap-24">
                            <div className="grid grid-cols-[0.95fr_1.05fr] items-stretch gap-4 md:gap-5">
                                <div className="bg-[#ebe7e1] p-3 sm:p-4">
                                    <div className="relative h-[250px] overflow-hidden bg-[#f6f3ef] ring-1 ring-black/6 sm:h-[300px] md:h-[340px]">
                                        <Image
                                            src="/banners/Phoi-do-phong-cach-streetwear_Img8.png"
                                            alt="Streetwear outfit styling collage"
                                            fill
                                            sizes="(max-width: 768px) 50vw, 320px"
                                            className="object-cover object-center"
                                        />
                                    </div>
                                </div>
                                <div className="bg-[#e7e2db] p-3 sm:p-4">
                                    <div className="relative h-[250px] overflow-hidden bg-[#f6f3ef] ring-1 ring-black/6 sm:h-[300px] md:h-[340px]">
                                        <Image
                                            src="/banners/Phong_cach.png"
                                            alt="Streetwear styling moodboard"
                                            fill
                                            sizes="(max-width: 768px) 50vw, 320px"
                                            className="object-cover object-center"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="max-w-md md:max-w-none">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    Street Series 01
                                </p>
                                <div className="space-y-1">
                                    <BlurText
                                        text="CONCRETE"
                                        delay={80}
                                        animateBy="letters"
                                        direction="top"
                                        className="text-5xl font-black uppercase leading-[0.87] tracking-tight text-slate-950 md:text-6xl lg:text-7xl"
                                    />
                                    <BlurText
                                        text="JUNGLE."
                                        delay={120}
                                        animateBy="letters"
                                        direction="top"
                                        className="text-5xl font-black uppercase leading-[0.87] tracking-tight text-slate-950 md:text-6xl lg:text-7xl"
                                    />
                                </div>
                                <p className="mt-5 max-w-[460px] text-base leading-relaxed text-slate-600 md:text-lg md:leading-[1.65]">
                                    Utility silhouettes and city-worn essentials,
                                    <br className="hidden md:block" />
                                    built for everyday movement in the concrete jungle.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollAnimationWrapper>

                <ScrollAnimationWrapper delay={0.35}>
                    <div className="mb-8 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/streetwear"
                            className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white"
                        >
                            All Streetwear
                        </Link>
                        {categoryCards.slice(0, 5).map((card) => (
                            <Link
                                key={`tab-${card.name}`}
                                href={`/streetwear?category=${encodeURIComponent(card.name)}`}
                                className="rounded-full bg-slate-200 px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-slate-300"
                            >
                                {card.overlayLabel}
                            </Link>
                        ))}
                    </div>
                </ScrollAnimationWrapper>

                <ScrollAnimationWrapper delay={0.4}>
                    <div className="mb-16 md:mb-20">
                        <div className="overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="mx-auto flex w-max min-w-full gap-5 px-2 sm:px-4 md:gap-6">
                                {categoryCards.map((card) => (
                                    <Link
                                        key={card.name}
                                        href={`/streetwear?category=${encodeURIComponent(card.name)}`}
                                        className="group block w-[220px] shrink-0 sm:w-[245px] lg:w-[270px]"
                                    >
                                        <div className="relative overflow-hidden rounded-[24px] border border-slate-300 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                                            <div className="relative aspect-[3/4]">
                                                <Image
                                                    src={card.image}
                                                    alt={card.name}
                                                    fill
                                                    sizes="(max-width: 640px) 220px, (max-width: 1024px) 245px, 270px"
                                                    className={card.imageClassName}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                                <div className="absolute inset-x-0 bottom-0 translate-y-5 p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                                    <p className="text-2xl font-black uppercase tracking-tight text-white">
                                                        {card.overlayLabel}
                                                    </p>
                                                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/80">
                                                        {card.count} items in streetwear
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-center text-xl font-semibold uppercase tracking-tight text-slate-900">
                                            {card.name}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollAnimationWrapper>

                <ScrollAnimationWrapper delay={0.5}>
                    <div className="mx-auto max-w-6xl">
                        <div className="relative overflow-hidden rounded-[32px] border border-slate-300 bg-slate-900 px-6 py-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)] md:px-10 md:py-9">
                            <div className="absolute inset-0">
                                <Image
                                    src="/banners/concrete-jungle.jpg"
                                    alt="Streetwear collection background"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 1200px"
                                    className="object-cover object-center"
                                />
                            </div>
                            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(2,6,23,0.88)_18%,rgba(2,6,23,0.72)_48%,rgba(2,6,23,0.84)_100%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_34%)]" />

                            <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
                                        Full Collection Access
                                    </p>
                                    <h3 className="mt-3 text-3xl font-black uppercase leading-none tracking-tight text-white md:text-4xl">
                                        See the complete streetwear edit.
                                    </h3>
                                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base md:leading-7">
                                        Don&apos;t leave this section with only one click. Browse every category,
                                        every featured pick, and the newest city-ready essentials in one place.
                                    </p>

                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/78">
                                            {featuredProducts.length} featured picks
                                        </div>
                                        <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/78">
                                            {categoryCards.length} streetwear lanes
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href="/streetwear"
                                    className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-950 transition hover:bg-slate-200"
                                >
                                    Explore All Products
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </ScrollAnimationWrapper>
            </div>
        </section>
    );
}














