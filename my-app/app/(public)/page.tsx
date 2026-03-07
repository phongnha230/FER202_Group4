import Hero from '@/components/homepage/Hero';
import FeaturedCollection from '@/components/homepage/FeaturedCollection';
import WinterDropBanner from '@/components/homepage/WinterDropBanner';
import StyleInspiration from '@/components/homepage/StyleInspiration';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Featured Collection */}
      <FeaturedCollection />

      {/* Winter Campaign Banner */}
      <WinterDropBanner />

      {/* Style Inspiration */}
      <StyleInspiration />
    </>
  );
}
