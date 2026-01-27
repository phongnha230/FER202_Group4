'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { getCart } from '@/lib/cart';
import { CartItemType } from '@/components/cart/cart-types';

export default function OrderSummary() {
    const [cartItems, setCartItems] = useState<CartItemType[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setCartItems(getCart());
        setIsLoaded(true);
    }, []);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 150 ? 0 : 15.00;
    const taxes = subtotal * 0.08;
    const total = subtotal + shipping + taxes;

    if (!isLoaded) return <div className="bg-gray-50 p-6 rounded-lg h-full">Loading summary...</div>;

    return (
        <div className="bg-gray-50 p-6 md:p-8 rounded-lg h-full">
            <h2 className="text-lg font-semibold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                        <div className="relative w-16 h-16 bg-white rounded-md border border-gray-200 overflow-hidden shrink-0">
                            <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                            />
                            <span className="absolute top-0 right-0 bg-gray-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-bl-md">
                                {item.quantity}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                            <p className="text-xs text-gray-500">{item.color} / {item.size}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">${item.price.toFixed(2)}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mb-6">
                <Input placeholder="Gift card or discount code" className="bg-white" />
                <Button variant="outline">Apply</Button>
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes (estimated)</span>
                    <span className="font-medium text-gray-900">${taxes.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex justify-between items-baseline pt-6 mt-6 border-t border-gray-200">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-500">USD</span>
                    <span className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</span>
                </div>
            </div>

            <Button className="w-full mt-6 h-12 text-base" asChild>
                {/* Normally acts as form submit, but for link purposes: */}
                <a href="/order-confirmation">Place Order →</a>
            </Button>

            <p className="text-xs text-gray-400 text-center mt-4">
                By placing your order you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    );
}
