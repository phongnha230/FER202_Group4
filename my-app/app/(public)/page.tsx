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
        collectionNumber="COLLECTION 01"
        title="CONCRETE"
        subtitle="JUNGLE"
        description="Hard-wearing utilitarian pieces designed for the daily grind. Featuring ripstop fabrics and modular pocket systems."
        image="/banners/concrete-jungle.jpg"
        ctaText="VIEW COLLECTION"
        ctaLink="/streetwear"
        imagePosition="right"
        theme="dark-teal"
      />

      {/* Neon Nights Banner */}
      <PromoBanner
        collectionNumber="COLLECTION 02"
        title="NEON"
        subtitle="NIGHTS"
        description="Reflective details and cyber-inspired graphics for those who come alive when the sun goes down."
        image="/banners/neon-nights.jpg"
        ctaText="VIEW COLLECTION"
        ctaLink="/new-arrivals"
        imagePosition="left"
        theme="light"
      />

      {/* Style Inspiration */}
      <StyleInspiration />
    </>
  );
}
