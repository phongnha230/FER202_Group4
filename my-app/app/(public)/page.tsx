import Hero from '@/components/homepage/Hero';
import FeaturedCollection from '@/components/homepage/FeaturedCollection';
import PromoBanner from '@/components/homepage/PromoBanner';
import StyleInspiration from '@/components/homepage/StyleInspiration';

export default function HomePage() {
    return (
        <>
            {/* Hero Section */}
            <Hero />

            {/* Featured Collection */}
            <FeaturedCollection />

            {/* Concrete Jungle Banner */}
            <PromoBanner
                title="CONCRETE JUNGLE"
                description="Embrace the urban landscape with our rugged, military-inspired collection. Built for the streets, designed for adventure."
                image="/banners/concrete-jungle.jpg"
                ctaText="EXPLORE COLLECTION"
                ctaLink="/streetwear"
                imagePosition="left"
                theme="dark"
                backgroundColor="bg-[#5A6F4C]"
            />

            {/* Neon Nights Banner */}
            <PromoBanner
                title="NEON NIGHTS"
                description="Light up the night with our bold, contemporary pieces. Perfect for those who dare to stand out in the crowd."
                image="/banners/neon-nights.jpg"
                ctaText="SHOP NOW"
                ctaLink="/new-arrivals"
                imagePosition="right"
                theme="dark"
                backgroundColor="bg-slate-900"
            />

            {/* Style Inspiration */}
            <StyleInspiration />
        </>
    );
}
