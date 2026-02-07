'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/hooks/useCart';
import { useCheckoutStore } from '@/store/checkout.store';
import { useUserStore } from '@/store/user.store';
import { createOrder, createBuyNowOrder } from '@/services/order.service';
import { initializePayment } from '@/services/payment.service';
import { getColorFilter } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Type for Buy Now item from sessionStorage
interface BuyNowItem {
    id: string;
    variant_id: string;
    product_id: string;
    product_name: string;
    product_image: string;
    variant_color: string;
    variant_size: string;
    variant_price: number;
    quantity: number;
}

export default function OrderSummary() {
    const { cart, isLoading, removeFromCart, reloadCart } = useCart();
    const { formData, getShippingInfo, setSubmitting, isSubmitting, setError, error } = useCheckoutStore();
    const { user, isAuthenticated } = useUserStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [localError, setLocalError] = useState<string | null>(null);
    const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);
    
    // Check if this is a "Buy Now" checkout
    const isBuyNowMode = searchParams.get('buyNow') === 'true';

    // Load Buy Now item from sessionStorage
    useEffect(() => {
        if (isBuyNowMode) {
            const stored = sessionStorage.getItem('buyNowItem');
            if (stored) {
                try {
                    setBuyNowItem(JSON.parse(stored));
                } catch (e) {
                    console.error('Failed to parse buyNowItem:', e);
                }
            }
        }
    }, [isBuyNowMode]);

    // Force reload cart when component mounts (only for regular cart mode)
    useEffect(() => {
        if (isBuyNowMode) return; // Skip for Buy Now mode
        
        const handleCartUpdate = () => {
            console.log('Cart update event received, reloading cart...');
            reloadCart();
        };

        window.addEventListener('cart-updated', handleCartUpdate);
        const timer = setTimeout(() => {
            console.log('OrderSummary mounted, reloading cart...');
            reloadCart();
        }, 100);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('cart-updated', handleCartUpdate);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBuyNowMode]);

    // Calculate totals based on mode
    const { subtotal, shipping, taxes, total } = useMemo(() => {
        let sub = 0;
        
        if (isBuyNowMode && buyNowItem) {
            sub = buyNowItem.variant_price * buyNowItem.quantity;
        } else {
            sub = cart?.items?.reduce((sum, item) => {
                const price = item.variant?.price || 0;
                return sum + (price * item.quantity);
            }, 0) || 0;
        }
        
        const ship = sub > 150 ? 0 : 15.00;
        const tax = sub * 0.08;
        return { subtotal: sub, shipping: ship, taxes: tax, total: sub + ship + tax };
    }, [isBuyNowMode, buyNowItem, cart?.items]);

    const handlePlaceOrder = async () => {
        if (!isAuthenticated || !user?.id) {
            setLocalError('Please log in to place an order');
            router.push('/login');
            return;
        }

        // Validate items
        if (isBuyNowMode) {
            if (!buyNowItem) {
                setLocalError('No item to purchase');
                return;
            }
        } else {
            if (!cart || !cart.items || cart.items.length === 0) {
                setLocalError('Your cart is empty');
                return;
            }
        }

        // Validate form data
        if (!formData.email || !formData.firstName || !formData.lastName || !formData.address || !formData.city) {
            setLocalError('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        setLocalError(null);
        setError(null);

        try {
            console.log('Starting order creation...');
            console.log('Payment method selected:', formData.paymentMethod);
            
            const shippingInfo = getShippingInfo();
            console.log('Shipping info:', shippingInfo);
            
            // Map payment method to order service format
            // card, vnpay, momo -> online | cod -> cod
            const paymentMethod = formData.paymentMethod === 'cod' ? 'cod' : 'online';
            console.log('Payment method for order:', paymentMethod);

            let order;
            let orderError;

            if (isBuyNowMode && buyNowItem) {
                console.log('Creating Buy Now order for variant:', buyNowItem.variant_id);
                // Create order for Buy Now item (single item, not from cart)
                const result = await createBuyNowOrder(user.id, {
                    variant_id: buyNowItem.variant_id,
                    quantity: buyNowItem.quantity,
                    total_price: total,
                    payment_method: paymentMethod,
                    payment_gateway: paymentMethod === 'online' ? (formData.paymentMethod as 'momo' | 'vnpay' | 'card') : undefined,
                    shipping_info: shippingInfo,
                });
                console.log('Buy Now order result:', result);
                order = result.data;
                orderError = result.error;
                
                // Clear the buyNowItem from sessionStorage after successful order
                if (order) {
                    sessionStorage.removeItem('buyNowItem');
                }
            } else {
                console.log('Creating cart order for cart:', cart?.id);
                // Create order from cart
                const result = await createOrder(user.id, {
                    cart_id: cart!.id,
                    total_price: total,
                    payment_method: paymentMethod,
                    payment_gateway: paymentMethod === 'online' ? (formData.paymentMethod as 'momo' | 'vnpay' | 'card') : undefined,
                    shipping_info: shippingInfo,
                });
                console.log('Cart order result:', result);
                order = result.data;
                orderError = result.error;
            }

            if (orderError || !order) {
                console.error('Order creation failed:', orderError);
                throw orderError || new Error('Failed to create order');
            }

            console.log('Order created successfully:', order.id);

            // Create in-app notification for order placed
            try {
                await fetch('/api/notifications/create-for-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: order.id,
                        title: 'Đơn hàng đã được tạo',
                        message: `Đơn hàng #${order.id.slice(0, 8).toUpperCase()} đã được đặt thành công.`,
                        type: 'success',
                    }),
                });
            } catch (e) {
                console.warn('Failed to create order notification:', e);
            }

            // Send order placed email to customer
            try {
                await fetch('/api/notifications/order-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: order.id, type: 'order_placed' }),
                });
            } catch (e) {
                console.warn('Failed to send order email:', e);
            }

            // If online payment, initialize payment gateway
            if (paymentMethod === 'online') {
                console.log('Initializing online payment...');
                const paymentMethodMap: Record<string, 'momo' | 'vnpay' | 'card'> = {
                    'momo': 'momo',
                    'vnpay': 'vnpay',
                    'card': 'card',
                };

                const gatewayMethod = paymentMethodMap[formData.paymentMethod] || 'vnpay';
                console.log('Gateway method:', gatewayMethod);
                
                const { paymentUrl, error: paymentError } = await initializePayment(order.id, gatewayMethod);
                console.log('Payment URL:', paymentUrl);

                if (paymentError) {
                    console.error('Payment initialization error:', paymentError);
                    throw paymentError;
                }

                if (paymentUrl) {
                    console.log('Redirecting to payment page:', paymentUrl);
                    window.location.href = paymentUrl;
                    return;
                }
            }

            // COD: go directly to order confirmation
            console.log('Redirecting to order confirmation...');
            router.push(`/order-confirmation?orderId=${order.id}`);
        } catch (err) {
            const errorMessage = (err as Error)?.message || 'Failed to place order. Please try again.';
            setLocalError(errorMessage);
            setError(errorMessage);
            console.error('Order creation error:', err);
        } finally {
            console.log('Order process finished, resetting submitting state');
            setSubmitting(false);
        }
    };

    if (isLoading && !isBuyNowMode) {
        return <div className="bg-gray-50 p-6 rounded-lg h-full">Loading summary...</div>;
    }

    const cartItems = cart?.items || [];
    const hasItems = isBuyNowMode ? !!buyNowItem : cartItems.length > 0;

    return (
        <div className="bg-gray-50 p-6 md:p-8 rounded-lg h-full">
            <h2 className="text-lg font-semibold mb-6">
                {isBuyNowMode ? 'Order Summary (Buy Now)' : 'Order Summary'}
            </h2>

            {(localError || error) && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{localError || error}</AlertDescription>
                </Alert>
            )}

            {!hasItems ? (
                <div className="text-center py-8 text-gray-500">
                    {isBuyNowMode ? 'No item selected' : 'Your cart is empty'}
                </div>
            ) : (
                <>
                    <div className="space-y-4 mb-6">
                        {isBuyNowMode && buyNowItem ? (
                            // Render Buy Now item
                            <div className="flex gap-4">
                                <div className="relative w-16 h-16 bg-white rounded-md border border-gray-200 overflow-hidden shrink-0">
                                    {buyNowItem.product_image && (
                                        <Image
                                            src={buyNowItem.product_image}
                                            alt={buyNowItem.product_name}
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                            style={getColorFilter(buyNowItem.variant_color, buyNowItem.variant_color)}
                                        />
                                    )}
                                    <span className="absolute top-0 right-0 bg-gray-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-bl-md">
                                        {buyNowItem.quantity}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-gray-900">{buyNowItem.product_name}</h3>
                                    <p className="text-xs text-gray-500">
                                        {buyNowItem.variant_color} / {buyNowItem.variant_size}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        ${buyNowItem.variant_price.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            // Render cart items
                            cartItems.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="relative w-16 h-16 bg-white rounded-md border border-gray-200 overflow-hidden shrink-0">
                                        {item.product?.images?.[0]?.image_url && (
                                            <Image
                                                src={item.product.images[0].image_url}
                                                alt={item.product.name || 'Product'}
                                                fill
                                                sizes="64px"
                                                className="object-cover"
                                                style={
                                                    item.variant?.color 
                                                        ? getColorFilter(item.variant.color, item.variant.color)
                                                        : undefined
                                                }
                                            />
                                        )}
                                        <span className="absolute top-0 right-0 bg-gray-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-bl-md">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-gray-900">{item.product?.name || 'Product'}</h3>
                                        <p className="text-xs text-gray-500">
                                            {item.variant?.color || ''} / {item.variant?.size || ''}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            ${(item.variant?.price || 0).toFixed(2)}
                                        </p>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await removeFromCart(item.id);
                                                } catch {
                                                    setLocalError('Failed to remove item');
                                                }
                                            }}
                                            className="text-[10px] text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider font-semibold"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
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

                    <Button 
                        className="w-full mt-6 h-12 text-base" 
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting || !hasItems}
                    >
                        {isSubmitting ? 'Processing...' : 'Place Order →'}
                    </Button>
                </>
            )}

            <p className="text-xs text-gray-400 text-center mt-4">
                By placing your order you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    );
}
