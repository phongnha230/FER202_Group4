import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { adaptProductsToUI } from '@/lib/adapters/product.adapter';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import CircularGallery from '@/components/ui/CircularGallery';
import BlurText from '@/components/ui/BlurText';
import ScrollAnimationWrapper from '@/components/ui/ScrollAnimationWrapper';

async function getFeaturedProductsServer(limit = 8) {
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
    const { data, error } = await getFeaturedProductsServer(8);

    if (error) {
        console.error('Error loading featured products:', error);
        return null;
    }

    const featuredProducts = adaptProductsToUI(data);

    if (featuredProducts.length === 0) {
        return null;
    }

    // Transform products to gallery format
    const galleryItems = featuredProducts.map(product => ({
        image: product.image || '/placeholder-product.jpg',
        text: product.name
    }));

    return (
        <section className="py-20 md:py-28 lg:py-36 bg-[#f8f8f6]">
            <div className="container-custom">
                {/* Section Header - Manifesto Style */}
                <div className="text-center mb-16 md:mb-20 lg:mb-24">
                    {/* Subtitle */}
                    <ScrollAnimationWrapper>
                        <p className="text-xs md:text-sm font-medium tracking-[0.3em] text-muted-foreground mb-6 md:mb-8">
                            MANIFESTO / 001
                        </p>
                    </ScrollAnimationWrapper>

                    {/* Main Heading with BlurText */}
                    <div className="mb-2 md:mb-3">
                        <BlurText
                            text="ESSENTIAL COMFORT."
                            delay={100}
                            animateBy="words"
                            direction="top"
                            className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight justify-center"
                        />
                    </div>
                    <div className="mb-8 md:mb-10">
                        <BlurText
                            text="URBAN SOUL."
                            delay={120}
                            animateBy="words"
                            direction="top"
                            className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#7CB342] justify-center"
                        />
                    </div>

                    {/* Separator Line */}
                    <ScrollAnimationWrapper delay={0.2}>
                        <div className="w-16 md:w-20 h-1 bg-[#7CB342] mx-auto mb-8 md:mb-10" />
                    </ScrollAnimationWrapper>

                    {/* Description */}
                    <ScrollAnimationWrapper delay={0.3}>
                        <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            Minimalist designs with an industrial edge. Quality basics that define your
                            style without trying too hard. Engineered for the street, tailored for comfort.
                        </p>
                    </ScrollAnimationWrapper>
                </div>

                {/* 3D Circular Gallery */}
                <ScrollAnimationWrapper delay={0.4}>
                    <div className="w-full h-[500px] md:h-[600px] lg:h-[700px] mb-16 md:mb-20 relative">
                        <CircularGallery
                            items={galleryItems}
                            bend={3}
                            textColor="#1a1a1a"
                            borderRadius={0.08}
                            font="bold 24px sans-serif"
                            scrollSpeed={1.5}
                            scrollEase={0.08}
                        />
                        {/* Instruction hint */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                            <p className="text-sm text-muted-foreground animate-pulse">
                                ← Drag or scroll to explore →
                            </p>
                        </div>
                    </div>
                </ScrollAnimationWrapper>

                {/* View All Button */}
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
