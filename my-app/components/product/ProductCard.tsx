'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UIProduct } from '@/lib/adapters/product.adapter';
import { addToCart as addItemToCart } from '@/lib/cart';

interface ProductCardProps {
    product: UIProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <Card className="group overflow-hidden border-none shadow-md hover-lift">
            <Link href={`/product/${product.slug}`}>
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    <div className="absolute top-2 left-2 flex flex-col gap-2">
                        {product.salePrice && (
                            <Badge className="bg-red-600 text-white">SALE</Badge>
                        )}
                        {product.isNew && (
                            <Badge className="bg-blue-600 text-white">NEW</Badge>
                        )}
                        {!product.inStock && (
                            <Badge className="bg-red-500 text-white">Out of Stock</Badge>
                        )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-100"
                        onClick={(e) => {
                            e.preventDefault();
                            // Add to wishlist logic
                        }}
                        aria-label="Add to wishlist"
                    >
                        <Heart className="h-4 w-4" />
                    </button>
                </div>
            </Link>

            <CardContent className="p-4">
                <Link href={`/product/${product.slug}`}>
                    <p className="text-xs text-muted-foreground mb-1">
                        {product.category}
                    </p>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                        {product.name}
                    </h3>
                    {product.salePrice ? (
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-red-600">
                                ${product.salePrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                                ${product.price.toFixed(2)}
                            </span>
                        </div>
                    ) : (
                        <p className="text-xl font-bold">
                            ${product.price.toFixed(2)}
                        </p>
                    )}
                </Link>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Button
                    className="w-full btn-primary"
                    disabled={!product.inStock}
                    onClick={(e) => {
                        e.preventDefault(); // Prevent navigating to product page
                        addItemToCart({
                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            productId: product.id,
                            name: product.name,
                            price: product.salePrice || product.price,
                            image: product.image,
                            color: product.colors?.[0] || 'Default',
                            size: product.sizes?.[0] || 'Default',
                            quantity: 1,
                        });
                        // Optional: Show toast or feedback
                    }}
                >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
            </CardFooter>
        </Card>
    );
}
