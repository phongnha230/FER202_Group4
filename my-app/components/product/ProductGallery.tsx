'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

import type { UIProduct } from '@/lib/adapters/product.adapter';

interface ProductGalleryProps {
    product: UIProduct;
    activeImage?: string;
    selectedColor?: string;
}

export default function ProductGallery({ product, activeImage, selectedColor }: ProductGalleryProps) {
    const defaultImage = activeImage || product.image;
    const [selectedImage, setSelectedImage] = useState(defaultImage);

    // Sync selectedImage if color changes
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (selectedColor && product.colorImages && product.colorImages[selectedColor]) {
            timer = setTimeout(() => setSelectedImage(product.colorImages![selectedColor]), 0);
        } else {
            timer = setTimeout(() => setSelectedImage(defaultImage), 0);
        }
        return () => clearTimeout(timer);
    }, [selectedColor, product.colorImages, defaultImage]);

    // Build the gallery list
    const galleryImages = [product.image];
    if (product.colorImages) {
        Object.values(product.colorImages).forEach(img => {
            if (!galleryImages.includes(img)) {
                galleryImages.push(img);
            }
        });
    }

    return (
        <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
            {/* Thumbnails */}
            {galleryImages.length > 1 && (
                <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 shrink-0 no-scrollbar">
                    {galleryImages.map((img, idx) => (
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
                                sizes="80px"
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main Image */}
            <div className="relative flex-1 aspect-[3/4] md:aspect-square bg-gray-100 rounded-lg overflow-hidden transition-all duration-300 group">
                {/* Layer 1: Base Image (Real variant image, no filters) */}
                <Image
                    src={selectedImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                    priority
                    className="object-cover"
                />


            </div>
        </div>
    );
}
