import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function StyleInspiration() {
    return (
        <section className="relative">
            {/* Hero Image Section */}
            <div className="relative">
                {/* Main Image Container */}
                <div className="relative aspect-[16/10] md:aspect-[16/9] lg:aspect-[21/9]">
                    {/* Background Image */}
                    <Image
                        src="/banners/style-inspiration.jpg"
                        alt="Group of people in streetwear fashion"
                        fill
                        sizes="100vw"
                        className="object-cover object-center"
                        priority
                    />

                    {/* Dark Gradient Overlay from bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a] via-[#0d1b2a]/60 to-transparent" />

                    {/* Content Overlay - Centered */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        {/* Main Heading */}
                        <h2 className="text-4xl md:text-6xl lg:text-8xl font-extrabold text-white tracking-tight mb-6 md:mb-8 text-center drop-shadow-lg">
                            <span className="italic font-bold">STYLE</span>{' '}
                            <span className="font-extrabold">INSPIRATION</span>
                        </h2>

                        {/* CTA Button */}
                        <Button
                            asChild
                            size="lg"
                            className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-8 py-3 rounded uppercase tracking-wider"
                        >
                            <Link href="/lookbook">
                                GET THE LOOK
                            </Link>
                        </Button>
                    </div>

                    {/* Floating Badge on Right */}
                    <div className="absolute bottom-1/4 right-6 md:right-12">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
