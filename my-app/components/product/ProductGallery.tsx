'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Product } from '@/mock/products';

interface ProductGalleryProps {
    product: Product;
}

export default function ProductGallery({ product }: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(product.image);

    // Mocking additional images for the gallery since the data only has one
    // In a real app, this would be product.images
    const images = [
        product.image,
        // fallback duplicates to simulate gallery if needed, or just single image
    ];

    return (
        <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
            {/* Thumbnails (Hidden if only 1 image, but structure is here) */}
            {images.length > 1 && (
                <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 shrink-0 no-scrollbar">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedImage(img)}
                            className={cn(
                                "relative w-20 h-20 aspect-square overflow-hidden rounded-md border-2",
                                selectedImage === img ? "border-black" : "border-transparent"
                            )}
                        >
                            <Image
                                src={img}
                                alt={`Product view ${idx + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main Image */}
            <div className="relative flex-1 aspect-[3/4] md:aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                    src={selectedImage}
                    alt={product.name}
                    fill
                    priority
                    className="object-cover"
                />
            </div>
        </div>
    );
}
