'use client';

import { useState } from 'react';
import { Product } from '@/mock/products';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';

interface ProductContainerProps {
    product: Product;
}

export default function ProductContainer({ product }: ProductContainerProps) {
    const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');

    // Determine the active image based on the selected color
    // If no specific image for the color, fallback to the main product image
    const activeImage = product.colorImages?.[selectedColor] || product.image;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
            <ProductGallery
                product={product}
                activeImage={activeImage}
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
            />
            <ProductInfo
                product={product}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
            />
        </div>
    );
}
