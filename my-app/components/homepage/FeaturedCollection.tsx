import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
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
};

function pickLifestyleImage(category: string, fallbackImage: string) {
    const key = category.toLowerCase();

    if (key.includes('hood') || key.includes('sweater')) return '/banners/style-inspiration.jpg';
    if (key.includes('jacket') || key.includes('khoac') || key.includes('outer')) return '/banners/concrete-jungle.jpg';
    if (key.includes('tee') || key.includes('thun') || key.includes('t-shirt')) return '/banners/hero-model.jpg';
    if (key.includes('shirt') || key.includes('so mi') || key.includes('polo')) return '/banners/neon-nights.jpg';

    return fallbackImage || '/banners/hero-model.jpg';
}

function getOverlayLabel(category: string) {
    const key = category.toLowerCase();

    if (key.includes('hood') || key.includes('sweater')) return 'HOODIES';
    if (key.includes('jacket') || key.includes('khoac') || key.includes('outer')) return 'JACKETS';
    if (key.includes('tee') || key.includes('thun') || key.includes('t-shirt')) return 'TEES';
    if (key.includes('shirt') || key.includes('so mi') || key.includes('polo')) return 'SHIRTS';

    return category.toUpperCase();
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

export default async function FeaturedCollection() {
    const { data, error } = await getFeaturedProductsServer(10);

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

        const existing = categoryMap.get(categoryName);
        if (existing) {
            existing.count += 1;
            return;
        }

        categoryMap.set(categoryName, {
            name: categoryName,
            count: 1,
            image: pickLifestyleImage(categoryName, product.image),
            overlayLabel: getOverlayLabel(categoryName),
        });
    });

    const categoryCards = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);

    if (categoryCards.length === 0) {
        return null;
    }

    return (
        <section className="py-14 md:py-20 lg:py-24 bg-[#f8f8f6]">
            <div className="container-custom">
                <ScrollAnimationWrapper>
                    <div className="mx-auto mb-12 max-w-7xl md:mb-14">
                        <div className="grid grid-cols-1 items-center gap-9 md:grid-cols-[640px_1fr] md:gap-20 lg:gap-24">
                            <div className="grid grid-cols-2 gap-4 md:gap-5">
                                <div className="relative h-[250px] overflow-hidden bg-slate-200 sm:h-[300px] md:h-[340px]">
                                    <Image
                                        src="/banners/concrete-jungle.jpg"
                                        alt="Concrete architecture streetwear mood"
                                        fill
                                        sizes="(max-width: 768px) 50vw, 320px"
                                        className="object-cover grayscale contrast-110"
                                    />
                                </div>
                                <div className="relative h-[250px] overflow-hidden bg-slate-300 sm:h-[300px] md:h-[340px]">
                                    <Image
                                        src="/banners/neon-nights.jpg"
                                        alt="Urban street scene with motion blur"
                                        fill
                                        sizes="(max-width: 768px) 50vw, 320px"
                                        className="object-cover grayscale"
                                    />
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
                                                    className="object-cover object-center transition duration-500 group-hover:scale-105"
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
                    <div className="text-center">
                        <Button asChild size="lg" className="btn-primary group">
                            <Link href="/streetwear">
                                VIEW ALL PRODUCTS
                                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                </ScrollAnimationWrapper>
            </div>
        </section>
    );
}
