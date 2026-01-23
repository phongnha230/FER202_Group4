import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PromoBannerProps {
    collectionNumber: string;
    title: string;
    subtitle?: string;
    description: string;
    image: string;
    ctaText: string;
    ctaLink: string;
    imagePosition?: 'left' | 'right';
    theme?: 'dark-teal' | 'light' | 'dark';
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

    return (
        <section className="relative">
            <div className={`grid grid-cols-1 lg:grid-cols-2 min-h-[500px] md:min-h-[600px]`}>
                {/* Content Side */}
                <div
                    className={`${styles.bg} ${isImageRight ? 'order-1' : 'order-2 lg:order-2'} 
            flex items-center justify-center p-8 md:p-12 lg:p-16`}
                >
                    <div className="max-w-md">
                        {/* Collection Label */}
                        <p className={`text-xs tracking-[0.2em] uppercase ${styles.label} mb-6`}>
                            {collectionNumber}
                        </p>

                        {/* Title */}
                        <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold ${styles.text} leading-tight mb-6`}>
                            {title}
                            {subtitle && (
                                <>
                                    <br />
                                    {subtitle}
                                </>
                            )}
                        </h2>

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
                <div className={`relative ${isImageRight ? 'order-2' : 'order-1 lg:order-1'} min-h-[400px] lg:min-h-full`}>
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover object-center"
                    />
                </div>
            </div>
        </section>
    );
}
