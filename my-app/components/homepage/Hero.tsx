import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative w-full overflow-hidden">
            <div className="flex flex-col lg:flex-row h-auto lg:h-[85vh] min-h-[600px]">
                {/* Left Side - Image */}
                <div className="w-full lg:w-1/2 relative h-[50vh] lg:h-full order-1">
                    <Image
                        src="/banners/hero-model.jpg"
                        alt="Fashion model wearing casual streetwear"
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover object-center"
                        priority
                    />
                </div>

                {/* Right Side - Content */}
                <div className="w-full lg:w-1/2 bg-[#efede6] flex flex-col justify-center px-8 sm:px-12 md:px-20 py-20 relative order-2">
                    {/* Watermark 24/7 */}
                    <div className="absolute top-0 right-0 p-4 select-none pointer-events-none opacity-20">
                        <span className="text-[120px] md:text-[180px] lg:text-[220px] font-bold text-gray-400 leading-none">
                            24/7
                        </span>
                    </div>

                    <div className="relative z-10 max-w-xl">
                        {/* Heading */}
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.9] tracking-tight mb-8">
                            WEAR
                            <br />
                            CHILL.
                            <br />
                            <span className="text-cyan-500 italic">LIVE</span>
                            <br />
                            FREE.
                        </h1>

                        {/* Description */}
                        <p className="text-base md:text-lg text-slate-600 mb-10 max-w-md font-medium leading-relaxed">
                            The drop you&apos;ve been waiting for. Built for the streets. Designed for the dorms.
                        </p>

                        {/* CTA Button */}
                        <div className="flex flex-wrap gap-4 mb-12">
                            <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-none px-10 py-7 text-sm font-bold tracking-widest uppercase">
                                <Link href="/streetwear">
                                    Shop The Drop
                                    <ArrowRight className="ml-3 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 border-t border-slate-300 pt-8 max-w-md">
                            <div>
                                <p className="text-3xl font-black text-slate-900">500+</p>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Products</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">10K+</p>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Customers</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">4.9</p>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Rating</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
