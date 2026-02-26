'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import BlurText from '@/components/ui/BlurText';

interface PromoBannerProps {
    collectionNumber?: string;
    title: string;
    subtitle?: string;
    description: string;
    image: string;
    ctaText: string;
    ctaLink: string;
    imagePosition?: 'left' | 'right';
    theme?: 'dark-teal' | 'light' | 'dark';
    backgroundColor?: string;
    imageEntrance?: 'left' | 'right' | 'none';
}

export default function PromoBanner({
    collectionNumber,
    title,
    subtitle,
    description,
    image,
    ctaText,
    ctaLink,
    imagePosition = 'right',
    theme = 'dark-teal',
    backgroundColor,
    imageEntrance = 'none',
}: PromoBannerProps) {
    const isImageRight = imagePosition === 'right';

    // Theme configurations
    const themeStyles = {
        'dark-teal': {
            bg: 'bg-[#1a3a3a]',
            text: 'text-white',
            subtext: 'text-white/70',
            label: 'text-white/50',
        },
        'light': {
            bg: 'bg-[#f5f5f5]',
            text: 'text-slate-900',
            subtext: 'text-slate-600',
            label: 'text-slate-400',
        },
        'dark': {
            bg: 'bg-slate-900',
            text: 'text-white',
            subtext: 'text-slate-300',
            label: 'text-slate-500',
        },
    };

    const styles = themeStyles[theme];

    // Animation variants
    const imageVariants = {
        hidden: { 
            opacity: 0, 
            x: imageEntrance === 'left' ? -100 : imageEntrance === 'right' ? 100 : 0 
        },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: {
                duration: 0.8,
                ease: [0.25, 0.4, 0.25, 1] as const,
                delay: 0.2
            }
        }
    };

    return (
        <section className="relative overflow-hidden">
            <div className={`grid grid-cols-1 lg:grid-cols-2 min-h-[500px] md:min-h-[600px]`}>
                {/* Content Side */}
                <div
                    className={`${backgroundColor || styles.bg} ${isImageRight ? 'order-1' : 'order-2 lg:order-2'} 
            flex items-center justify-center p-8 md:p-12 lg:p-16 relative z-10`}
                >
                    <div className="max-w-md">
                        {/* Collection Label */}
                        {collectionNumber && (
                            <p className={`text-xs tracking-[0.2em] uppercase ${styles.label} mb-6`}>
                                {collectionNumber}
                            </p>
                        )}

                        {/* Animated Title with BlurText */}
                        <div className="mb-6">
                            <BlurText
                                text={subtitle ? `${title} ${subtitle}` : title}
                                delay={100}
                                animateBy="words"
                                direction="top"
                                className={`text-4xl md:text-5xl lg:text-6xl font-bold ${styles.text} leading-tight`}
                            />
                        </div>

                        {/* Description */}
                        <p className={`text-sm md:text-base ${styles.subtext} leading-relaxed mb-8 max-w-sm`}>
                            {description}
                        </p>

                        {/* CTA Link */}
                        <Link
                            href={ctaLink}
                            className={`inline-flex items-center text-sm font-semibold ${styles.text} 
                hover:opacity-80 transition-opacity group uppercase tracking-wider`}
                        >
                            {ctaText}
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* Image Side */}
                <motion.div 
                    className={`relative ${isImageRight ? 'order-2' : 'order-1 lg:order-1'} min-h-[400px] lg:min-h-full`}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.3 }}
                    variants={imageEntrance !== 'none' ? imageVariants : undefined}
                >
                    <Image
                        src={image}
                        alt={title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover object-center"
                    />
                </motion.div>
            </div>
        </section>
    );
}
