'use client';

import { useState } from 'react';
import { Product } from '@/mock/products';
import { Button } from '@/components/ui/button';
import { Heart, Truck, RefreshCw, ShieldCheck } from 'lucide-react';
import VariantSelector from './VariantSelector';
import { useRouter } from 'next/navigation';
import { addToCart as addItemToCart } from '@/lib/cart';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';

interface ProductInfoProps {
    product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
    const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
    const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
    const router = useRouter();

    const handleAddToCart = () => {
        addItemToCart({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            productId: product.id,
            name: product.name,
            price: product.salePrice || product.price,
            image: product.image,
            color: selectedColor,
            size: selectedSize,
            quantity: 1,
        });
        router.push('/cart');
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                    {product.name}
                </h1>

                <div className="flex items-center gap-4 mb-4">
                    {product.salePrice ? (
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                                ${product.salePrice.toFixed(2)}
                            </span>
                            <span className="text-lg text-gray-500 line-through">
                                ${product.price.toFixed(2)}
                            </span>
                            <Badge variant="destructive" className="ml-2">
                                SAVE {Math.round((1 - product.salePrice / product.price) * 100)}%
                            </Badge>
                        </div>
                    ) : (
                        <span className="text-2xl font-bold text-gray-900">
                            ${product.price.toFixed(2)}
                        </span>
                    )}

                    {product.isNew && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            NEW ARRIVAL
                        </Badge>
                    )}
                </div>
            </div>

            {/* Variants */}
            <div>
                {product.colors && (
                    <VariantSelector
                        type="color"
                        variants={product.colors}
                        selected={selectedColor}
                        onSelect={setSelectedColor}
                    />
                )}

                {product.sizes && (
                    <VariantSelector
                        type="size"
                        variants={product.sizes}
                        selected={selectedSize}
                        onSelect={setSelectedSize}
                    />
                )}

                {product.inStock && product.sizes && (
                    <p className="text-xs text-orange-600 font-medium mt-1 mb-4 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-orange-600 mr-2 animate-pulse"></span>
                        Only 3 left in stock (mock)
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-2">
                <Button className="flex-1 h-12 text-base" size="lg" onClick={handleAddToCart}>
                    Add to Bag
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 shrink-0">
                    <Heart className="h-5 w-5" />
                </Button>
            </div>

            <p className="text-sm text-gray-500 mt-2">
                Engineered for ultimate comfort and durability. This heavyweight French terry hoodie features a modern boxy cut, drop shoulders, and reinforced stitching. The perfect everyday essential for your rotation.
            </p>

            {/* Accordions */}
            <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="description">
                    <AccordionTrigger>Description & Fit</AccordionTrigger>
                    <AccordionContent>
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>{product.description}</p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li>Boxy, oversized fit</li>
                                <li>Heavyweight 400gsm cotton</li>
                                <li>Pre-shrunk to minimize shrinkage</li>
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="material">
                    <AccordionTrigger>Material & Care</AccordionTrigger>
                    <AccordionContent>
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>100% Cotton French Terry</p>
                            <div className="flex gap-2 items-center mt-2">
                                <RefreshCw className="h-4 w-4" />
                                <span>Machine wash cold, tumble dry low</span>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="shipping">
                    <AccordionTrigger>Shipping & Returns</AccordionTrigger>
                    <AccordionContent>
                        <div className="text-sm text-gray-600 space-y-2">
                            <div className="flex gap-2 items-center">
                                <Truck className="h-4 w-4" />
                                <span>Free shipping on orders over $150</span>
                            </div>
                            <div className="flex gap-2 items-center">
                                <ShieldCheck className="h-4 w-4" />
                                <span>30-day return policy</span>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
