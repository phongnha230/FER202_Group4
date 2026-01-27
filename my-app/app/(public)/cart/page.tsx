'use client';

import { useState, useEffect } from 'react';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import { CartItemType } from '@/components/cart/cart-types';
import Link from 'next/link';
import { getCart, updateCartItem, removeCartItem } from '@/lib/cart';

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItemType[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setCartItems(getCart());
        setIsLoaded(true);
    }, []);

    const updateQuantity = (id: string, newQty: number) => {
        const updated = updateCartItem(id, newQty);
        setCartItems(updated);
    };

    const removeItem = (id: string) => {
        const updated = removeCartItem(id);
        setCartItems(updated);
    };

    // Calculations
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingEstimate = subtotal > 150 ? 0 : 15.00; // Free shipping over $150
    const taxRate = 0.08; // 8% tax example
    const tax = subtotal * taxRate;
    const total = subtotal + shippingEstimate + tax;

    if (!isLoaded) return <div className="p-8 text-center bg-white min-h-[50vh] flex items-center justify-center">Loading cart...</div>;

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Your Cart</h1>
            <p className="text-gray-500 mb-8">
                {subtotal > 150
                    ? "Free shipping on orders over $150"
                    : `Add $${(150 - subtotal).toFixed(2)} more for free shipping`}
            </p>

            <div className="flex flex-col lg:flex-row gap-12">
                {/* Cart Items List */}
                <div className="flex-1">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-lg text-gray-500 mb-4">Your cart is empty</p>
                            <Link href="/" className="text-black font-semibold hover:underline">
                                Continue Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="border-t border-gray-100">
                            {cartItems.map((item) => (
                                <CartItem
                                    key={item.id}
                                    item={item}
                                    onUpdateQuantity={updateQuantity}
                                    onRemove={removeItem}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Summary Sidebar */}
                <div className="w-full lg:w-[380px] shrink-0">
                    <CartSummary
                        subtotal={subtotal}
                        shippingEstimate={shippingEstimate}
                        tax={tax}
                        total={total}
                    />
                </div>
            </div>
        </div>
    );
}
