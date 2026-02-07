'use client';

import { Button } from '@/components/ui/button';
import { Check, Truck, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getOrder } from '@/services/order.service';
import { OrderWithDetails } from '@/types/order.type';
import { getColorFilter } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { Alert, AlertDescription } from '@/components/ui/alert';

function OrderConfirmationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');
    const { clearCart } = useCart();
    const [order, setOrder] = useState<OrderWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        const fetchOrder = async () => {
            if (!orderId) {
                if (isMounted) {
                    setError('Order ID is missing');
                    setIsLoading(false);
                }
                return;
            }

            try {
                const { data, error: orderError } = await getOrder(orderId);
                
                if (!isMounted) return;
                
                if (orderError || !data) {
                    throw orderError || new Error('Order not found');
                }

                setOrder(data);
                setIsLoading(false);
                
                // Clear cart after successful order fetch (only for cart orders, not buy now)
                // Check if this was a cart order by looking at sessionStorage
                const wasBuyNow = sessionStorage.getItem('buyNowItem');
                if (!wasBuyNow) {
                    try {
                        await clearCart();
                    } catch (clearError) {
                        console.warn('Failed to clear cart:', clearError);
                    }
                }
                // Clear buyNow item if it exists
                sessionStorage.removeItem('buyNowItem');
                
            } catch (err) {
                if (!isMounted) return;
                
                // Ignore abort errors (happens in React StrictMode)
                if ((err as Error)?.name === 'AbortError') {
                    return;
                }
                
                const errorMessage = (err as Error)?.message || 'Failed to load order details';
                setError(errorMessage);
                console.error('Order fetch error:', err);
                setIsLoading(false);
            }
        };

        fetchOrder();
        
        return () => {
            isMounted = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    if (isLoading) {
        return <div className="p-8 text-center min-h-[50vh] flex items-center justify-center">Loading order details...</div>;
    }

    if (error || !order) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-16 max-w-2xl">
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>
                        {error || 'Order not found'}
                    </AlertDescription>
                </Alert>
                <Button onClick={() => router.push('/my-orders')} className="mt-4">
                    View My Orders
                </Button>
            </div>
        );
    }

    // Calculations from order data
    const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const shipping = subtotal > 150 ? 0 : 15.00;
    const taxes = subtotal * 0.08;
    const total = order.total_price || (subtotal + shipping + taxes);

    const displayItems = order.items || [];

    return (
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-2xl">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">ORDER CONFIRMED</h1>
                <p className="text-gray-600">
                    Thanks for shopping with UrbanNest!<br />
                    Your order <span className="font-semibold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span> is being prepped.
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
                        displayItems.map((item) => {
                            const productImage = item.product?.images?.[0]?.image_url || item.product?.image || '/placeholder-product.jpg';
                            const productName = item.product?.name || 'Product';
                            const color = item.variant?.color || '';
                            const size = item.variant?.size || '';
                            
                            return (
                                <div key={item.id} className="flex gap-4">
                                    <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden shrink-0">
                                        <Image
                                            src={productImage}
                                            alt={productName}
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                            style={color ? getColorFilter(color, color) : undefined}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{productName}</h4>
                                        <p className="text-sm text-gray-500">{color} / {size}</p>
                                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            );
                        })
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
                        {order.shipping ? (
                            <p className="text-gray-600 whitespace-pre-line">
                                {order.shipping.receiver_name}<br />
                                {order.shipping.receiver_address}
                            </p>
                        ) : (
                            <p className="text-gray-500">Shipping information not available</p>
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> ORDER STATUS
                        </h4>
                        <p className="text-gray-600">
                            {order.order_status?.replace('_', ' ').toUpperCase() || 'PENDING'}<br />
                            Payment: {order.payment_status?.toUpperCase() || 'PENDING'}
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
                    <Link href="/" className="hover:underline">
                        Continue Shopping
                    </Link>
                </div>
                <p className="text-xs text-gray-400 mt-8">
                    © 2024 UrbanNest Inc. 123 Streetwear Blvd, Los Angeles, CA 90210. All rights reserved.
                </p>
            </div>
        </div>
    );
}

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center min-h-[50vh] flex items-center justify-center">Loading...</div>}>
            <OrderConfirmationContent />
        </Suspense>
    );
}
