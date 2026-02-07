'use client';

import { useState, useEffect } from 'react';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import { CartItemType } from '@/components/cart/cart-types';
import Link from 'next/link';
import { getCartWithItems, updateCartItem as updateServerCartItem, removeFromCart as removeServerCartItem } from '@/services/cart.service';
import { useUserStore } from '@/store/user.store';
import { getCart, updateCartItem, removeCartItem } from '@/lib/cart';
// import DebugCart from '@/components/DebugCart';

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItemType[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { user, isAuthenticated, isLoading: isAuthLoading } = useUserStore();

    useEffect(() => {
        const fetchCart = async () => {
            if (isAuthLoading) return; // Wait for auth check to complete

            try {
                if (isAuthenticated && user) {
                    // Fetch from Supabase
                    const { data, error } = await getCartWithItems(user.id);
                    if (data && data.items) {
                        // Map server items to CartItemType
                        const mappedItems: CartItemType[] = data.items.map(item => ({
                            id: item.id,
                            productId: item.variant?.product_id || '',
                            name: item.product?.name || 'Unknown Product',
                            price: item.variant?.price || 0,
                            image: item.product?.images?.find(img => img.is_main)?.image_url || item.product?.image || '',
                            color: item.variant?.color || '',
                            size: item.variant?.size || '',
                            quantity: item.quantity,
                            maxStock: item.variant?.stock,
                        }));
                        setCartItems(mappedItems);
                    } else if (error) {
                        console.error('Error fetching cart:', error);
                        // Fallback empty or handle error?
                    }
                } else {
                    // Fetch from Local Storage
                    setCartItems(getCart());
                }
            } catch (err) {
                console.error('Failed to load cart:', err);
                setCartItems(getCart()); // Fallback to local on crash
            } finally {
                setIsLoaded(true);
            }
        };

        fetchCart();

        // Listen for local updates if likely guest
        if (!isAuthenticated && !isAuthLoading) {
             const handleUpdate = () => setCartItems(getCart());
             window.addEventListener('cart-updated', handleUpdate);
             return () => window.removeEventListener('cart-updated', handleUpdate);
        }
    }, [isAuthenticated, user, isAuthLoading]);

    const updateQuantity = async (id: string, newQty: number) => {
        if (isAuthenticated && user) {
             // Update server
             const { error } = await updateServerCartItem(id, { quantity: newQty });
             if (!error) {
                 setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
             }
        } else {
            // Update local
            const updated = updateCartItem(id, newQty);
            setCartItems(updated);
        }
    };

    const removeItem = async (id: string) => {
        if (isAuthenticated && user) {
            // Remove server
            const { error } = await removeServerCartItem(id);
             if (!error) {
                 setCartItems(prev => prev.filter(item => item.id !== id));
             }
        } else {
            // Remove local
            const updated = removeCartItem(id);
            setCartItems(updated);
        }
    };

    // Calculations
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingEstimate = subtotal > 150 ? 0 : 15.00; // Free shipping over $150
    const taxRate = 0.08; // 8% tax example
    const tax = subtotal * taxRate;
    const total = subtotal + shippingEstimate + tax;

    if (!isLoaded) return <div className="p-8 text-center bg-white min-h-[50vh] flex items-center justify-center">Loading cart...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* <DebugCart /> */}
            <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
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
