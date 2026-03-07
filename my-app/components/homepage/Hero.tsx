'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

type HeroSlide = {
    image: string;
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    tintClass: string;
};

const HERO_SLIDES: HeroSlide[] = [
    {
        image: '/banners/concrete-jungle.jpg',
        badge: 'Streetwear Collection',
        title: 'BUILT FOR CITY NIGHTS',
        subtitle: 'Wear loud. Move free.',
        description: 'Heavy textures, clean silhouettes, and sharp contrast made for urban lifestyle.',
        tintClass: 'bg-[radial-gradient(circle_at_70%_50%,rgba(34,211,238,0.20),transparent_55%)]',
    },
    {
        image: '/banners/neon-nights.jpg',
        badge: 'Night Drop',
        title: 'NEON GRIT DROP',
        subtitle: 'Own every corner.',
        description: 'Layered fits with modern cuts and street-ready comfort for all-day wear.',
        tintClass: 'bg-[radial-gradient(circle_at_65%_50%,rgba(59,130,246,0.25),transparent_55%)]',
    },
    {
        image: '/banners/style-inspiration.jpg',
        badge: 'Style Inspiration',
        title: 'STACK YOUR STREET FIT',
        subtitle: 'From campus to downtown.',
        description: 'Mix essentials and statement pieces to keep your look fresh from day to night.',
        tintClass: 'bg-[radial-gradient(circle_at_65%_45%,rgba(248,250,252,0.14),transparent_50%)]',
    },
];

export default function Hero() {
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 6500);

        return () => window.clearInterval(timer);
    }, []);

    const goToPrev = () => {
        setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    };

    const goToNext = () => {
        setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    };

    return (
        <section className="relative w-full overflow-hidden bg-slate-950">
            <div className="relative h-[68vh] min-h-[500px] w-full">
                <div className="absolute inset-0">
                    {HERO_SLIDES.map((slide, index) => (
                        <div
                            key={slide.image}
                            className={`absolute inset-0 transition-opacity duration-700 ${index === activeSlide ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                        >
                            <Image
                                src={slide.image}
                                alt={slide.title}
                                fill
                                sizes="100vw"
                                className="object-cover object-center"
                                priority={index === 0}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-slate-900/25" />
                            <div className={`absolute inset-0 ${slide.tintClass}`} />
                        </div>
                    ))}
                </div>

                <div className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] items-center px-6 py-10 sm:px-10 lg:px-16">
                    <div className="max-w-2xl text-white">
                        <p className="mb-5 inline-flex rounded-full border border-white/30 bg-white/12 px-5 py-2 text-sm font-semibold uppercase tracking-wide backdrop-blur-sm">
                            {HERO_SLIDES[activeSlide].badge}
                        </p>
                        <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-7xl">
                            {HERO_SLIDES[activeSlide].title}
                        </h1>
                        <p className="mt-3 text-2xl font-semibold text-cyan-300 sm:text-3xl lg:text-4xl">
                            {HERO_SLIDES[activeSlide].subtitle}
                        </p>
                        <p className="mt-6 max-w-xl text-base text-slate-100/90 sm:text-lg">
                            {HERO_SLIDES[activeSlide].description}
                        </p>

                        <div className="mt-9 flex flex-wrap items-center gap-4">
                            <Button
                                asChild
                                size="lg"
                                className="rounded-full bg-white px-9 text-sm font-bold uppercase tracking-wider text-slate-950 hover:bg-cyan-100"
                            >
                                <Link href="/streetwear">
                                    Mua ngay
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={goToPrev}
                    aria-label="Previous banner"
                    className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-slate-900/45 p-2.5 text-white backdrop-blur transition hover:bg-slate-800/70 sm:left-6"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                    type="button"
                    onClick={goToNext}
                    aria-label="Next banner"
                    className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-slate-900/45 p-2.5 text-white backdrop-blur transition hover:bg-slate-800/70 sm:right-6"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>

                <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 sm:bottom-8">
                    {HERO_SLIDES.map((slide, index) => (
                        <button
                            key={slide.image}
                            type="button"
                            aria-label={`Go to banner ${index + 1}`}
                            onClick={() => setActiveSlide(index)}
                            className={`h-2.5 rounded-full transition-all ${index === activeSlide ? 'w-8 bg-cyan-300' : 'w-2.5 bg-white/60 hover:bg-white'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
