'use client';

import { useState, useEffect } from 'react';
import { UIProduct } from '@/lib/adapters/product.adapter';
import { Button } from '@/components/ui/button';
import { Heart, Truck, RefreshCw, ShieldCheck } from 'lucide-react';
import VariantSelector from './VariantSelector';
import { useRouter } from 'next/navigation';
import { getCart } from '@/lib/cart'; // Added getCart
import CartSuccessModal from '../cart/CartSuccessModal'; // Import Modal
import { CartItemType } from '@/components/cart/cart-types';
import { useUserStore } from '@/store/user.store';
import { addToCart as apiAddToCart } from '@/services/cart.service';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';

interface ProductInfoProps {
    product: UIProduct;
    selectedColor: string;
    onColorChange: (color: string) => void;
}

export default function ProductInfo({ product, selectedColor, onColorChange }: ProductInfoProps) {
    // const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || ''); // Lifted up
    const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
    const router = useRouter();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lastAddedItem, setLastAddedItem] = useState<CartItemType | null>(null);
    const [cartCount, setCartCount] = useState(0);
    const [cartTotal, setCartTotal] = useState(0);

    // New state for variants and stock
    const [variants, setVariants] = useState<import('@/types/database.types').ProductVariant[]>([]);
    const [currentStock, setCurrentStock] = useState<number | null>(null);

    // Fetch variants to get real stock info
    useEffect(() => {
        const fetchVariants = async () => {
            const { getProductVariants } = await import('@/services/product.service');
            const { data } = await getProductVariants(product.id);
            if (data) {
                setVariants(data);
            }
        };
        fetchVariants();
    }, [product.id]);

    // Update stock when selection changes
    useEffect(() => {
        if (!variants.length) return;
        
        const matchingVariant = variants.find(v => 
            v.color === selectedColor && v.size === selectedSize
        );
        
        setCurrentStock(matchingVariant ? matchingVariant.stock : null);
    }, [selectedColor, selectedSize, variants]);

    const updateCartData = () => {
        if (typeof window === 'undefined') return;
        const cart = getCart();
        setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
        setCartTotal(cart.reduce((total, item) => total + (item.price * item.quantity), 0));
    };

    useEffect(() => {
        // Use setTimeout to avoid "synchronous setState in effect" warning
        const timer = setTimeout(() => {
            updateCartData();
        }, 0);

        const handleCartUpdate = () => updateCartData();
        window.addEventListener('cart-updated', handleCartUpdate);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('cart-updated', handleCartUpdate);
        };
    }, []);




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
                        onSelect={onColorChange}
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

                {currentStock !== null && currentStock > 0 && (
                    <p className="text-xs text-orange-600 font-medium mt-1 mb-4 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-orange-600 mr-2 animate-pulse"></span>
                        Stock: {currentStock}
                    </p>
                )}
                {currentStock === 0 && (
                     <p className="text-xs text-red-600 font-medium mt-1 mb-4">
                        Out of stock
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-2">
                <Button
                    variant="outline"
                    className="flex-1 h-12 text-base border-black hover:bg-black hover:text-white transition-colors"
                    size="lg"
                    onClick={async () => {
                        const { user, isAuthenticated } = useUserStore.getState();
                        
                        if (!isAuthenticated || !user) {
                            router.push('/login');
                            return;
                        }

                        // Find matching variant
                        const matchingVariant = variants.find(v => 
                            v.color === selectedColor && v.size === selectedSize
                        );

                        if (!matchingVariant) {
                             alert("Please select a valid size and color");
                             return;
                        }

                        try {
                             const { data, error } = await apiAddToCart(user.id, {
                                 variant_id: matchingVariant.id,
                                 quantity: 1
                             });

                             if (error) {
                                 console.error("Failed to add to cart", error);
                                 alert("Failed to add to cart");
                                 return;
                             }

                            const newItem: CartItemType = {
                                id: data?.id || matchingVariant.id, // Use DB ID
                                productId: product.id,
                                name: product.name,
                                price: product.salePrice || product.price,
                                image: product.image,
                                color: selectedColor,
                                baseColor: product.colors?.[0], 
                                size: selectedSize,
                                quantity: 1,
                            };
                            
                            // For modal display (optimistic or actual)
                            setLastAddedItem(newItem);
                            setIsModalOpen(true);
                            
                            // Trigger global cart update event for header counters if needed
                             if (typeof window !== 'undefined') {
                                 window.dispatchEvent(new Event('cart-updated'));
                             }

                        } catch (err) {
                            console.error("Error adding to cart", err);
                        }
                    }}
                >
                    Add to Cart
                </Button>
                <Button
                    className="flex-1 h-12 text-base btn-primary"
                    size="lg"
                    onClick={async () => {
                        const { user, isAuthenticated } = useUserStore.getState();
                         if (!isAuthenticated || !user) {
                            router.push('/login');
                            return;
                        }

                         // Find matching variant
                        const matchingVariant = variants.find(v => 
                            v.color === selectedColor && v.size === selectedSize
                        );

                        if (!matchingVariant) {
                             alert("Please select a valid size and color");
                             return;
                        }

                        try {
                             await apiAddToCart(user.id, {
                                 variant_id: matchingVariant.id,
                                 quantity: 1
                             });
                             router.push('/checkout');
                        } catch(e) {
                            console.error(e);
                        }
                    }}
                >
                    Buy Now
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 border-gray-200">
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

            <CartSuccessModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={lastAddedItem}
                cartCount={cartCount}
                totalPrice={cartTotal}
            />
        </div>
    );
}
