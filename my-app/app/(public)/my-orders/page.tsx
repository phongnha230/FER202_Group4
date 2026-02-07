"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useUserStore } from '@/store/user.store';
import { supabase } from '@/lib/supabase/client';
import Image from "next/image";
import Link from "next/link";
import { Package, PenLine, RefreshCcw, Truck, X, MapPin, Phone, User, Calendar, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import clsx from "clsx";

type OrderStatus = 'ordered' | 'shipped' | 'delivered' | 'returned';

interface Product {
    id: string;
    name: string;
    image: string;
    price: number;
    slug?: string;
}

interface ShippingInfo {
    receiver_name: string;
    receiver_phone: string;
    receiver_address: string;
    provider: string;
    shipping_code?: string;
    status: string;
}

interface Order {
    id: string;
    orderNumber: string;
    date: string; // ISO format
    status: OrderStatus;
    dbStatus: string; // Original DB status for cancel logic
    hasReview?: boolean;
    product: Product;
    size: string;
    color: string;
    quantity: number;
    deliveryEstimate?: string;
    totalPrice: number;
    paymentMethod: string;
    paymentStatus: string;
    shipping?: ShippingInfo;
}

export default function MyOrdersPage() {
    const [activeTab, setActiveTab] = useState<'ALL' | 'ON THE WAY' | 'RETURNS'>('ALL');
    const [selectedYear, setSelectedYear] = useState<string>("all");

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useUserStore();

    // Modal states
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingOrder, setCancellingOrder] = useState(false);

    // Function to fetch orders (extracted for reuse with realtime)
    const fetchOrders = useCallback(async () => {
        if (!isAuthenticated || !user) {
            setOrders([]);
            setLoading(false);
            return;
        }

        try {
            const [{ getUserOrders }, { getUserReviews }] = await Promise.all([
                import('@/services/order.service'),
                import('@/services/review.service'),
            ]);

            const [
                { data, error },
                { data: userReviews, error: reviewError },
            ] = await Promise.all([
                getUserOrders(user.id),
                getUserReviews(user.id),
            ]);
            
            if (error) {
                console.error("Error fetching orders:", error);
                return;
            }

            if (reviewError) {
                console.error("Error fetching user reviews:", reviewError);
            }

            const reviews = userReviews || [];

            // Map DB orders to UI Order format
            // Flattening items to match the current UI design (one card per item)
            const mappedOrders: Order[] = [];
            
            data.forEach(dbOrder => {
                dbOrder.items?.forEach((item) => { 
                     let uiStatus: OrderStatus = 'ordered';
                     if (dbOrder.order_status === 'shipping') uiStatus = 'shipped';
                     if (dbOrder.order_status === 'delivered' || dbOrder.order_status === 'completed') uiStatus = 'delivered';
                     if (dbOrder.order_status === 'returned' || dbOrder.order_status === 'cancelled') uiStatus = 'returned';

                     // Check item.product (mapped in service) or item.variant.product
                     // The type definition from getUserOrders ensures item has variant and product structure
                     // We cast to specific type to avoid TS error about missing 'product' on base ProductVariant type
                     const variantWithProduct = item.variant as (import('@/types/database.types').ProductVariant & { product: Product }) | null;
                     const productData = item.product || variantWithProduct?.product;

                     const productId = productData?.id || item.variant_id || 'unknown';

                     const hasReview = reviews.some((review) => 
                        review.order_id === dbOrder.id && 
                        review.product_id === productId
                     );

                     // Map shipping info
                     const shippingInfo: ShippingInfo | undefined = dbOrder.shipping ? {
                         receiver_name: dbOrder.shipping.receiver_name,
                         receiver_phone: dbOrder.shipping.receiver_phone,
                         receiver_address: dbOrder.shipping.receiver_address,
                         provider: dbOrder.shipping.provider,
                         shipping_code: dbOrder.shipping.shipping_code || undefined,
                         status: dbOrder.shipping.status,
                     } : undefined;

                     mappedOrders.push({
                         id: dbOrder.id, // Keeping order ID for review link
                         orderNumber: dbOrder.id.substring(0, 8).toUpperCase(), 
                         date: dbOrder.created_at,
                         status: uiStatus,
                         dbStatus: dbOrder.order_status, // Keep original status for cancel logic
                         product: {
                             id: productId, // Need product ID for review
                             name: productData?.name || 'Unknown Product',
                             image: productData?.image || '/images/product-mock.jpg',
                             price: item.price,
                             slug: (productData as { slug?: string })?.slug,
                         },
                         size: item.variant?.size || '',
                         color: item.variant?.color || '',
                         quantity: item.quantity,
                         deliveryEstimate: dbOrder.shipping?.provider === 'manual' ? 'TBD' : undefined,
                         totalPrice: dbOrder.total_price,
                         paymentMethod: dbOrder.payment_method,
                         paymentStatus: dbOrder.payment_status,
                         shipping: shippingInfo,
                         hasReview,
                     });
                });
            });

            setOrders(mappedOrders);
        } catch (err) {
            console.error("Failed to load orders", err);
        } finally {
            setLoading(false);
        }
    }, [user, isAuthenticated]);

    useEffect(() => {
        // Initial fetch
        fetchOrders();
    }, [fetchOrders]);

    // Realtime subscription for order updates
    useEffect(() => {
        if (!user) return;

        // Subscribe to order changes for this user
        const channel = supabase
            .channel('user-orders-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Order updated:', payload);
                    const updatedOrder = payload.new as { 
                        id: string; 
                        order_status: string; 
                        payment_status: string;
                    };
                    
                    // Map DB status to UI status
                    let uiStatus: OrderStatus = 'ordered';
                    if (updatedOrder.order_status === 'shipping') uiStatus = 'shipped';
                    if (updatedOrder.order_status === 'delivered' || updatedOrder.order_status === 'completed') uiStatus = 'delivered';
                    if (updatedOrder.order_status === 'returned' || updatedOrder.order_status === 'cancelled') uiStatus = 'returned';
                    
                    // Update local state
                    setOrders(prev => prev.map(order => 
                        order.id === updatedOrder.id
                            ? { 
                                ...order, 
                                status: uiStatus,
                                dbStatus: updatedOrder.order_status,
                                paymentStatus: updatedOrder.payment_status
                            }
                            : order
                    ));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    // New order created - refetch to get full data
                    fetchOrders();
                }
            )
            .subscribe((status) => {
                console.log('User orders realtime status:', status);
            });

        // Cleanup on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchOrders]);

    // Handle cancel order
    const handleCancelOrder = async () => {
        if (!selectedOrder || !user) return;
        
        console.log('Cancelling order:', {
            orderId: selectedOrder.id,
            userId: user.id,
            dbStatus: selectedOrder.dbStatus,
            uiStatus: selectedOrder.status
        });
        
        setCancellingOrder(true);
        try {
            const { cancelOrder } = await import('@/services/order.service');
            const { error } = await cancelOrder(selectedOrder.id, user.id);
            
            if (error) {
                console.error('Cancel order error details:', error);
                const errorMsg = error instanceof Error 
                    ? error.message 
                    : (error as { message?: string })?.message || 'Không thể hủy đơn hàng';
                alert(`Lỗi: ${errorMsg}`);
                return;
            }

            // Update local state
            setOrders(prev => prev.map(order => 
                order.id === selectedOrder.id 
                    ? { ...order, status: 'returned' as OrderStatus, dbStatus: 'cancelled' }
                    : order
            ));
            
            alert('Đơn hàng đã được hủy thành công!');
            setShowCancelModal(false);
            setSelectedOrder(null);
        } catch (err) {
            console.error('Cancel order error:', err);
            alert('Đã có lỗi xảy ra khi hủy đơn hàng');
        } finally {
            setCancellingOrder(false);
        }
    };

    // Check if order can be cancelled
    const canCancelOrder = (order: Order) => {
        return ['pending_payment', 'paid', 'processing'].includes(order.dbStatus);
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // Filter by Tab
            if (activeTab === 'ON THE WAY') {
                if (order.status !== 'ordered' && order.status !== 'shipped') return false;
            } else if (activeTab === 'RETURNS') {
                if (order.status !== 'returned') return false;
            }

            // Filter by Year
            if (selectedYear !== 'all') {
                const orderYear = new Date(order.date).getFullYear().toString();
                if (orderYear !== selectedYear) return false;
            }

            return true;
        });
    }, [activeTab, selectedYear, orders]);

    const activeOrders = filteredOrders.filter(o => o.status === 'ordered' || o.status === 'shipped');
    const pastOrders = filteredOrders.filter(o => o.status === 'delivered' || o.status === 'returned');


    return (
        <div className="container-custom py-10">
            {loading && (
                 <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                 </div>
            )}
            {!loading && (
                <>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">MY ORDERS</h1>
                    <p className="text-muted-foreground">Manage your purchases and returns</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-md">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={clsx(
                                "rounded-sm px-4 transition-all",
                                activeTab === 'ALL' ? "bg-black text-white hover:bg-black/90 hover:text-white" : "text-gray-600 hover:bg-gray-200"
                            )}
                            onClick={() => setActiveTab('ALL')}
                        >
                            ALL ORDERS
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={clsx(
                                "rounded-sm px-4 transition-all",
                                activeTab === 'ON THE WAY' ? "bg-black text-white hover:bg-black/90 hover:text-white" : "text-gray-600 hover:bg-gray-200"
                            )}
                            onClick={() => setActiveTab('ON THE WAY')}
                        >
                            ON THE WAY
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={clsx(
                                "rounded-sm px-4 transition-all",
                                activeTab === 'RETURNS' ? "bg-black text-white hover:bg-black/90 hover:text-white" : "text-gray-600 hover:bg-gray-200"
                            )}
                            onClick={() => setActiveTab('RETURNS')}
                        >
                            RETURNS
                        </Button>
                    </div>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[120px] h-9 bg-white">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Select All</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <hr className="mb-8" />

            {/* Active Orders Section */}
            {activeOrders.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">Active Order</h2>
                    </div>

                    <div className="space-y-6">
                        {activeOrders.map((order) => (
                            <div key={order.id} className="bg-white border rounded-lg p-6 md:p-8 flex flex-col md:flex-row gap-8">
                                {/* Product Image */}
                                <div className="relative aspect-square w-full md:w-48 bg-gray-50 rounded-md overflow-hidden flex-shrink-0">
                                    <Image
                                        src={order.product.image}
                                        alt={order.product.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 192px"
                                        className="object-cover"
                                    />
                                </div>

                                {/* Order Details & Progress */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={clsx(
                                                "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                                order.status === 'shipped' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {order.status}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-bold">${order.product.price.toFixed(2)}</span>
                                            {order.deliveryEstimate && (
                                                <p className="text-[10px] text-red-500 font-medium">Est. Delivery {order.deliveryEstimate}</p>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold mb-1">{order.product.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-8">
                                        Order #{order.orderNumber} • Size {order.size} • {order.color}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="relative mt-auto">
                                        <div className="h-0.5 w-full bg-gray-200 absolute top-1/2 -translate-y-1/2" />
                                        <div className={clsx(
                                            "h-0.5 absolute top-1/2 -translate-y-1/2 bg-red-500 transition-all duration-500",
                                            order.status === 'ordered' ? "w-0" : "w-2/3"
                                        )} />

                                        <div className="relative flex justify-between">
                                            <div className="flex flex-col items-center">
                                                <div className={clsx("h-3 w-3 rounded-full z-10 transition-colors", order.status === 'ordered' || order.status === 'shipped' ? "bg-red-500" : "bg-gray-300")} />
                                                <span className={clsx("text-[10px] font-bold mt-2", order.status === 'ordered' || order.status === 'shipped' ? "text-red-500" : "text-gray-400")}>ORDERED</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className={clsx("h-3 w-3 rounded-full z-10 transition-colors", order.status === 'shipped' ? "bg-red-500" : "bg-gray-300")} />
                                                <span className={clsx("text-[10px] font-bold mt-2", order.status === 'shipped' ? "text-red-500" : "text-gray-400")}>SHIPPED</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="h-3 w-3 rounded-full bg-gray-300 z-10" />
                                                <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase">Delivered</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 mt-8">
                                        <Button 
                                            className="bg-black text-white hover:bg-black/90 h-10 px-6 rounded-sm text-xs font-bold"
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setShowTrackingModal(true);
                                            }}
                                        >
                                            <Truck className="w-4 h-4 mr-2" />
                                            TRACK PACKAGE
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="h-10 px-6 rounded-sm text-xs font-bold border-gray-300"
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            VIEW DETAILS
                                        </Button>
                                        {canCancelOrder(order) && (
                                            <Button 
                                                variant="outline" 
                                                className="h-10 px-6 rounded-sm text-xs font-bold border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowCancelModal(true);
                                                }}
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                CANCEL ORDER
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Past Purchases Section */}
            {pastOrders.length > 0 && (
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-4">Past Purchases</h2>
                    <div className="space-y-4">
                        {pastOrders.map((order) => (
                            <div key={order.id} className="bg-white border rounded-lg p-4 flex items-center gap-4">
                                <div className="relative h-20 w-16 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                        src={order.product.image}
                                        alt={order.product.name}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={clsx(
                                            "h-1.5 w-1.5 rounded-full",
                                            order.status === 'delivered' ? "bg-emerald-500" : "bg-red-500"
                                        )} />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                                            {order.status === 'delivered' ? 'DELIVERED' : 'RETURNED'} {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-base">{order.product.name}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Order #{order.orderNumber} • {order.quantity} Items • ${order.product.price.toFixed(2)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {order.status === 'delivered' && !order.hasReview && (
                                        <Button variant="outline" className="h-10 px-4 rounded-sm text-xs font-bold text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600" asChild>
                                            <Link href={`/write-review/${order.id}`}>
                                                <PenLine className="w-3.5 h-3.5 mr-2" />
                                                WRITE A REVIEW
                                            </Link>
                                        </Button>
                                    )}
                                    {order.status === 'delivered' && order.hasReview && order.product.slug && (
                                        <Button variant="outline" className="h-10 px-4 rounded-sm text-xs font-bold border-gray-300" asChild>
                                            <Link href={`/product/${order.product.slug}#reviews-section`}>
                                                VIEW REVIEW
                                            </Link>
                                        </Button>
                                    )}
                                    {order.status === 'returned' && order.dbStatus !== 'cancelled' && (
                                        <Button variant="outline" className="h-10 px-4 rounded-sm text-xs font-bold border-gray-300">
                                            <RefreshCcw className="w-3.5 h-3.5 mr-2" />
                                            BUY AGAIN
                                        </Button>
                                    )}
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-10 w-10 border-gray-300"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowDetailsModal(true);
                                        }}
                                        title="View Details"
                                    >
                                        <Package className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {filteredOrders.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or year selection.</p>
                </div>
            )}
            </>
            )}

            {/* Order Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Order Details</DialogTitle>
                        <DialogDescription>
                            Order #{selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedOrder && (
                        <div className="space-y-4">
                            {/* Product Info */}
                            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="relative h-20 w-16 bg-white rounded overflow-hidden flex-shrink-0">
                                    <Image
                                        src={selectedOrder.product.image}
                                        alt={selectedOrder.product.name}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold">{selectedOrder.product.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Size: {selectedOrder.size} • Color: {selectedOrder.color}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Qty: {selectedOrder.quantity}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold">${selectedOrder.product.price.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-muted-foreground">Order Date:</span>
                                    <span className="font-medium">
                                        {new Date(selectedOrder.date).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit', 
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-3 text-sm">
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                    <span className="text-muted-foreground">Payment:</span>
                                    <span className="font-medium uppercase">{selectedOrder.paymentMethod}</span>
                                    <span className={clsx(
                                        "text-xs px-2 py-0.5 rounded",
                                        selectedOrder.paymentStatus === 'paid' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                    )}>
                                        {selectedOrder.paymentStatus}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <Package className="w-4 h-4 text-gray-400" />
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className={clsx(
                                        "text-xs font-bold px-2 py-0.5 rounded uppercase",
                                        selectedOrder.status === 'ordered' && "bg-blue-100 text-blue-700",
                                        selectedOrder.status === 'shipped' && "bg-orange-100 text-orange-700",
                                        selectedOrder.status === 'delivered' && "bg-green-100 text-green-700",
                                        selectedOrder.status === 'returned' && "bg-red-100 text-red-700"
                                    )}>
                                        {selectedOrder.dbStatus}
                                    </span>
                                </div>
                            </div>

                            {/* Shipping Info */}
                            {selectedOrder.shipping && (
                                <div className="border-t pt-4">
                                    <h5 className="font-bold text-sm mb-3">Shipping Information</h5>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-3">
                                            <User className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <span>{selectedOrder.shipping.receiver_name}</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <span>{selectedOrder.shipping.receiver_phone}</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <span>{selectedOrder.shipping.receiver_address}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Total */}
                            <div className="border-t pt-4 flex justify-between items-center">
                                <span className="font-bold">Total</span>
                                <span className="text-xl font-bold">${selectedOrder.totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tracking Modal */}
            <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Truck className="w-5 h-5" />
                            Track Package
                        </DialogTitle>
                        <DialogDescription>
                            Order #{selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedOrder && (
                        <div className="space-y-4">
                            {/* Shipping Status */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground">Shipping Status</span>
                                    <span className={clsx(
                                        "text-xs font-bold px-2 py-1 rounded uppercase",
                                        selectedOrder.status === 'ordered' && "bg-blue-100 text-blue-700",
                                        selectedOrder.status === 'shipped' && "bg-orange-100 text-orange-700",
                                        selectedOrder.status === 'delivered' && "bg-green-100 text-green-700"
                                    )}>
                                        {selectedOrder.shipping?.status || selectedOrder.status}
                                    </span>
                                </div>

                                {/* Progress Timeline */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-3 h-3 rounded-full",
                                            selectedOrder.status !== 'returned' ? "bg-green-500" : "bg-gray-300"
                                        )} />
                                        <div>
                                            <p className="font-medium text-sm">Order Placed</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(selectedOrder.date).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-3 h-3 rounded-full",
                                            (selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered') 
                                                ? "bg-green-500" 
                                                : "bg-gray-300"
                                        )} />
                                        <div>
                                            <p className={clsx(
                                                "font-medium text-sm",
                                                selectedOrder.status === 'ordered' && "text-muted-foreground"
                                            )}>Shipped</p>
                                            {selectedOrder.status === 'shipped' && (
                                                <p className="text-xs text-muted-foreground">In transit</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-3 h-3 rounded-full",
                                            selectedOrder.status === 'delivered' ? "bg-green-500" : "bg-gray-300"
                                        )} />
                                        <div>
                                            <p className={clsx(
                                                "font-medium text-sm",
                                                selectedOrder.status !== 'delivered' && "text-muted-foreground"
                                            )}>Delivered</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Details */}
                            {selectedOrder.shipping && (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Carrier</span>
                                        <span className="font-medium uppercase">{selectedOrder.shipping.provider}</span>
                                    </div>
                                    {selectedOrder.shipping.shipping_code && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Tracking Number</span>
                                            <span className="font-medium font-mono">{selectedOrder.shipping.shipping_code}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Deliver to</span>
                                        <span className="font-medium text-right max-w-[200px]">
                                            {selectedOrder.shipping.receiver_address}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!selectedOrder.shipping?.shipping_code && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                    Tracking information will be available once your order has been shipped.
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTrackingModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Order Confirmation Modal */}
            <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Cancel Order
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this order?
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex gap-4">
                                    <div className="relative h-16 w-12 bg-white rounded overflow-hidden flex-shrink-0">
                                        <Image
                                            src={selectedOrder.product.image}
                                            alt={selectedOrder.product.name}
                                            fill
                                            sizes="48px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">{selectedOrder.product.name}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Order #{selectedOrder.orderNumber}
                                        </p>
                                        <p className="font-bold mt-1">${selectedOrder.product.price.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                <p className="mb-2">By cancelling this order:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>The order will be marked as cancelled</li>
                                    <li>If you already paid, a refund will be processed</li>
                                    <li>Stock will be restored for other customers</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowCancelModal(false)}
                            disabled={cancellingOrder}
                        >
                            Keep Order
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleCancelOrder}
                            disabled={cancellingOrder}
                        >
                            {cancellingOrder ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Cancelling...
                                </>
                            ) : (
                                'Yes, Cancel Order'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
