'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cn, getColorFilter } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { UIProduct } from '@/lib/adapters/product.adapter';

interface ProductGalleryProps {
    product: UIProduct;
    activeImage?: string;
    selectedColor?: string;
    onSelectColor?: (color: string) => void;
}

export default function ProductGallery({ product, activeImage, selectedColor, onSelectColor }: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(activeImage || product.image);

    // Sync selectedImage if activeImage prop changes (though we're moving away from this)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeImage) {
                setSelectedImage(activeImage);
            } else {
                setSelectedImage(product.image);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [activeImage, product.image]);

    // Helper to get CSS filter based on color
    const getFilter = (color: string | undefined): React.CSSProperties => {
        // Use the shared utility, passing the base color (first color in list)
        return getColorFilter(color, product.colors?.[0]);
    };

    const imageStyle = getFilter(selectedColor);

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
            <div className="relative flex-1 aspect-[3/4] md:aspect-square bg-gray-100 rounded-lg overflow-hidden transition-all duration-300 group">
                {/* Layer 1: Base Image (Unchanged) */}
                <Image
                    src={selectedImage}
                    alt={product.name}
                    fill
                    priority
                    className="object-cover"
                />

                {/* Layer 2: Filtered Image (Masked to center) */}
                {selectedColor && selectedColor !== product.colors?.[0] && (
                    <Image
                        src={selectedImage}
                        alt={`${product.name} - ${selectedColor}`}
                        fill
                        className="object-cover transition-all duration-500 ease-in-out opacity-100 z-10"
                        style={{
                            ...imageStyle,
                            // Radial mask: Center is visible (opaque), edges fade to transparent
                            maskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)',
                            WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)',
                        }}
                    />
                )}

                {/* Color Thumbnails List (Bottom Left) */}
                {product.colors && product.colors.length > 0 && (
                    <div className="absolute bottom-4 left-4 z-20 flex gap-2 overflow-x-auto max-w-[calc(100%-2rem)] no-scrollbar p-1">
                        {product.colors.map((color) => (
                            <button
                                key={color}
                                onClick={() => onSelectColor?.(color)}
                                className={cn(
                                    "relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-md border-2 shadow-sm overflow-hidden bg-white hover:border-black/50 transition-all",
                                    selectedColor === color ? "border-black ring-1 ring-black scale-105 z-30 shadow-md" : "border-white/80 opacity-90 hover:opacity-100"
                                )}
                                title={color}
                            >
                                <Image
                                    src={product.image} // Always use base image for thumbnails to ensure filter works correctly
                                    alt={`Preview ${color}`}
                                    fill
                                    className="object-cover"
                                    // Apply filter unless it's the base color (assuming first color is base)
                                    style={color !== product.colors?.[0] ? getColorFilter(color, product.colors?.[0]) : undefined}
                                />
                            </button>
                        ))}
                    </div>
                )}
                {/* Navigation Arrows */}
                {product.colors && product.colors.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!onSelectColor || !product.colors) return;
                                const currentIndex = product.colors.indexOf(selectedColor || '');
                                const prevIndex = (currentIndex - 1 + product.colors.length) % product.colors.length;
                                onSelectColor(product.colors[prevIndex]);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!onSelectColor || !product.colors) return;
                                const currentIndex = product.colors.indexOf(selectedColor || '');
                                const nextIndex = (currentIndex + 1) % product.colors.length;
                                onSelectColor(product.colors[nextIndex]);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
