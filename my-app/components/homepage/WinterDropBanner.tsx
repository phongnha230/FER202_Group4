'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function WinterDropBanner() {
    const [bannerSrc, setBannerSrc] = useState('/banners/winter-drop.png');

    return (
        <section className="relative overflow-hidden">
            <div className="relative min-h-[420px] sm:min-h-[520px] lg:min-h-[580px]">
                <Image
                    src={bannerSrc}
                    alt="Winter drop streetwear campaign"
                    fill
                    sizes="100vw"
                    priority={false}
                    className="object-cover object-[76%_24%] sm:object-[76%_20%] lg:object-[74%_18%]"
                    onError={() => setBannerSrc('/banners/style-inspiration.jpg')}
                />

                <div className="absolute inset-0 bg-gradient-to-r from-[#f2ece3]/95 via-[#f2ece3]/72 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_45%,rgba(255,255,255,0.60),transparent_52%)]" />

                <div className="relative z-10 mx-auto flex min-h-[420px] max-w-[1440px] items-center px-6 py-8 sm:min-h-[520px] sm:px-10 lg:min-h-[580px] lg:px-16">
                    <div className="max-w-xl text-[#4a4039]">
                        <p className="text-[72px] font-black uppercase leading-[0.8] tracking-tight text-white/30 sm:text-[100px] lg:text-[130px]">
                            WINTER
                        </p>
                        <h2 className="-mt-9 text-5xl font-black uppercase leading-[0.82] tracking-tight sm:-mt-12 sm:text-7xl lg:text-8xl">
                            WINTER
                            <br />
                            DROP
                        </h2>
                        <p className="mt-6 max-w-md text-2xl font-medium leading-[1.25] sm:text-3xl">
                            Street-ready layers for the concrete jungle.
                        </p>

                        <Link
                            href="/streetwear"
                            className="mt-8 inline-flex rounded-full border-2 border-[#8d7f72] bg-[#eadfcf]/95 px-10 py-3 text-2xl font-bold uppercase tracking-wide text-[#4a4039] transition hover:bg-[#efe5d7]"
                        >
                            Shop Now
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
