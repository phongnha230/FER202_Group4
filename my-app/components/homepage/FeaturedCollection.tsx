import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/product/ProductCard';
import { getFeaturedProducts } from '@/mock/products';
import { ArrowRight } from 'lucide-react';

export default function FeaturedCollection() {
    const featuredProducts = getFeaturedProducts();

    return (
        <section className="py-20 md:py-28 lg:py-36 bg-[#f8f8f6] animate-scale-up-bottom">
            <div className="container-custom">
                {/* Section Header - Manifesto Style */}
                <div className="text-center mb-16 md:mb-20 lg:mb-24 animate-fade-in-up">
                    {/* Subtitle */}
                    <p className="text-xs md:text-sm font-medium tracking-[0.3em] text-muted-foreground mb-6 md:mb-8">
                        MANIFESTO / 001
                    </p>

                    {/* Main Heading */}
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-2 md:mb-3">
                        ESSENTIAL COMFORT.
                    </h2>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#7CB342] mb-8 md:mb-10">
                        URBAN SOUL.
                    </h2>

                    {/* Separator Line */}
                    <div className="w-16 md:w-20 h-1 bg-[#7CB342] mx-auto mb-8 md:mb-10" />

                    {/* Description */}
                    <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        Minimalist designs with an industrial edge. Quality basics that define your
                        style without trying too hard. Engineered for the street, tailored for comfort.
                    </p>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16 md:mb-20">
                    {featuredProducts.map((product, index) => (
                        <div
                            key={product.id}
                            className={`animate-fade-in-up stagger-${Math.min(index + 1, 4)}`}
                        >
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>

                {/* View All Button */}
                <div className="text-center animate-fade-in-up">
                    <Button asChild size="lg" className="btn-primary group">
                        <Link href="/streetwear">
                            VIEW ALL PRODUCTS
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
