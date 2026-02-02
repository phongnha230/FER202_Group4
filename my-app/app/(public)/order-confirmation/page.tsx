'use client';

import { Button } from '@/components/ui/button';
import { Check, Truck, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart, clearCart } from '@/lib/cart';
import { CartItemType } from '@/components/cart/cart-types';
import { getColorFilter } from '@/lib/utils';

export default function OrderConfirmationPage() {
    const [cartItems, setCartItems] = useState<CartItemType[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');

    useEffect(() => {
        // Use setTimeout to move state updates to the next tick to avoid "synchronous setState in effect" warnings
        // and ensure smooth rendering after hydration.
        const timer = setTimeout(() => {
            const items = getCart();
            setCartItems(items);
            setOrderNumber(`UN${Math.floor(Math.random() * 100000)}`);
            setIsLoaded(true);
        }, 0);

        return () => clearTimeout(timer);
        
        // Optional: Clear cart logic - normally done upon successful API response
        // clearCart(); 
    }, []);

    // Calculations
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 150 ? 0 : 15.00;
    const taxes = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + taxes;

    if (!isLoaded) return <div className="p-8 text-center min-h-[50vh] flex items-center justify-center">Loading order details...</div>;

    // Use mocked items if cart is empty (e.g. direct navigation), or handle empty state
    const displayItems = cartItems.length > 0 ? cartItems : [];

    return (
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-2xl">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">ORDER CONFIRMED</h1>
                <p className="text-gray-600">
                    Thanks for shopping with the Nest, Alex.<br />
                    Your order <span className="font-semibold text-gray-900">#{orderNumber}</span> is being prepped.
                </p>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden mb-8">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-sm text-gray-900">ORDER SUMMARY</h3>
                </div>

                <div className="p-6 space-y-6">
                    {displayItems.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No items in this order preview.</p>
                    ) : (
                        displayItems.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden shrink-0">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        style={
                                            item.color !== item.baseColor
                                                ? getColorFilter(item.color, item.baseColor)
                                                : undefined
                                        }
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                                    <p className="text-sm text-gray-500">{item.color} / {item.size}</p>
                                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))
                    )}

                    <div className="h-px bg-gray-100" />

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Shipping</span>
                            <span className="font-medium text-gray-900">
                                {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Taxes</span>
                            <span className="font-medium text-gray-900">${taxes.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Truck className="h-4 w-4" /> SHIPPING ADDRESS
                        </h4>
                        <p className="text-gray-600">
                            Alex Doe<br />
                            123 Fashion Ave, Apt 4B<br />
                            New York, NY 10012<br />
                            United States
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> EST. DELIVERY
                        </h4>
                        <p className="text-gray-600">
                            Oct 24 - Oct 26<br />
                            Via Standard Ground
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-center space-y-4">
                <Button className="w-full sm:w-auto min-w-[200px]" size="lg" asChild>
                    <Link href="/my-orders">
                        Track Your Order
                    </Link>
                </Button>
                <div className="flex justify-center gap-6 text-xs text-gray-500">
                    <Link href="#" className="hover:underline">Help Center</Link>
                    <Link href="#" className="hover:underline">Instagram</Link>
                    <Link href="/" className="hover:underline" onClick={() => clearCart()}>
                        Continue Shopping (Clears Cart)
                    </Link>
                </div>
                <p className="text-xs text-gray-400 mt-8">
                    © 2024 UrbanNest Inc. 123 Streetwear Blvd, Los Angeles, CA 90210. All rights reserved.
                </p>
            </div>
        </div>
    );
}
