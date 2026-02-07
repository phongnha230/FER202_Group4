"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import {
    Search,
    Download,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Package,
    MapPin,
    Phone,
    User,
    CreditCard,
    AlertTriangle,
    RefreshCw
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { restoreStock } from "@/services/inventory.service";

interface Order {
    id: string;
    customer_name: string;
    customer_email: string;
    date: string;
    total: number;
    status: string;
    payment_status: string;
    payment_method: string;
    items_count: number;
}

interface OrderDetail {
    id: string;
    total_price: number;
    order_status: string;
    payment_status: string;
    payment_method: string;
    created_at: string;
    customer: {
        full_name: string;
        phone: string;
        email: string;
    };
    shipping: {
        receiver_name: string;
        receiver_phone: string;
        receiver_address: string;
        status: string;
    } | null;
    items: {
        id: string;
        quantity: number;
        price: number;
        variant: {
            size: string;
            color: string;
            product: {
                name: string;
                image: string;
            };
        };
    }[];
}

// Types for Supabase query results
interface ProfileResult {
    full_name: string | null;
    phone?: string | null;
}

interface ShippingOrderResult {
    receiver_name: string;
    receiver_phone: string;
    receiver_address: string;
    status: string;
}

interface OrderItemResult {
    id: string;
    quantity: number;
    price: number;
    variant: {
        size: string;
        color: string;
        product: {
            name: string;
            image: string;
        } | null;
    } | null;
}

interface OrderListQueryResult {
    id: string;
    total_price: number;
    order_status: string;
    payment_status: string;
    payment_method: string;
    created_at: string;
    profiles: ProfileResult | null;
    order_items: { id: string }[];
}

interface OrderDetailQueryResult {
    id: string;
    total_price: number;
    order_status: string;
    payment_status: string;
    payment_method: string;
    created_at: string;
    profiles: ProfileResult | null;
    shipping_orders: ShippingOrderResult[];
    order_items: OrderItemResult[];
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending_payment':
            return 'bg-amber-100 text-amber-700';
        case 'paid':
        case 'processing':
            return 'bg-blue-100 text-blue-600';
        case 'shipping':
            return 'bg-indigo-100 text-indigo-600';
        case 'delivered':
        case 'completed':
            return 'bg-emerald-100 text-emerald-600';
        case 'cancelled':
        case 'returned':
            return 'bg-rose-100 text-rose-600';
        default:
            return 'bg-slate-100 text-slate-600';
    }
};

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

const getAvatarColor = (name: string) => {
    const colors = [
        'bg-blue-100 text-blue-600',
        'bg-pink-100 text-pink-600',
        'bg-indigo-100 text-indigo-600',
        'bg-yellow-100 text-yellow-700',
        'bg-emerald-100 text-emerald-600',
        'bg-purple-100 text-purple-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Update Status Modal states
    const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
    const [updateStatusOrderId, setUpdateStatusOrderId] = useState<string | null>(null);
    const [updateStatusCurrentStatus, setUpdateStatusCurrentStatus] = useState<string>("");
    const [updateStatusPaymentMethod, setUpdateStatusPaymentMethod] = useState<string>("");
    const [newStatus, setNewStatus] = useState<string>("");
    const [updatingStatus, setUpdatingStatus] = useState(false);
    
    // Cancel Order Modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
    const [cancelOrderCustomer, setCancelOrderCustomer] = useState<string>("");
    const [cancellingOrder, setCancellingOrder] = useState(false);

    // Load order details
    async function loadOrderDetail(orderId: string) {
        try {
            setDetailLoading(true);
            setShowDetailModal(true);

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    total_price,
                    order_status,
                    payment_status,
                    payment_method,
                    created_at,
                    profiles:user_id (
                        full_name,
                        phone
                    ),
                    shipping_orders (
                        receiver_name,
                        receiver_phone,
                        receiver_address,
                        status
                    ),
                    order_items (
                        id,
                        quantity,
                        price,
                        variant:product_variants (
                            size,
                            color,
                            product:products (
                                name,
                                image
                            )
                        )
                    )
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;

            const typedData = data as unknown as OrderDetailQueryResult;
            
            const orderDetail: OrderDetail = {
                id: typedData.id,
                total_price: typedData.total_price,
                order_status: typedData.order_status,
                payment_status: typedData.payment_status,
                payment_method: typedData.payment_method,
                created_at: typedData.created_at,
                customer: {
                    full_name: typedData.profiles?.full_name || 'Unknown',
                    phone: typedData.profiles?.phone || 'N/A',
                    email: '',
                },
                shipping: typedData.shipping_orders?.[0] || null,
                items: (typedData.order_items || []).map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    variant: {
                        size: item.variant?.size || 'N/A',
                        color: item.variant?.color || 'N/A',
                        product: {
                            name: item.variant?.product?.name || 'Unknown Product',
                            image: item.variant?.product?.image || '/products/placeholder.jpg',
                        }
                    }
                })),
            };

            setSelectedOrder(orderDetail);
        } catch (error) {
            console.error('Error loading order details:', error);
        } finally {
            setDetailLoading(false);
        }
    }

    // Function to load orders (extracted for reuse)
    async function loadOrders() {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    total_price,
                    order_status,
                    payment_status,
                    payment_method,
                    created_at,
                    profiles:user_id (
                        full_name
                    ),
                    order_items (
                        id
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const typedData = (data || []) as unknown as OrderListQueryResult[];
            
            const formattedOrders: Order[] = typedData.map(order => ({
                id: order.id,
                customer_name: order.profiles?.full_name || 'Unknown Customer',
                customer_email: '',
                date: new Date(order.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                total: order.total_price,
                status: order.order_status,
                payment_status: order.payment_status,
                payment_method: order.payment_method || 'cod',
                items_count: order.order_items?.length || 0,
            }));

            setOrders(formattedOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // Initial load
        loadOrders();

        // Set up realtime subscription for orders table
        const channel = supabase
            .channel('admin-orders-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    console.log('Order change detected:', payload);
                    
                    if (payload.eventType === 'INSERT') {
                        // New order created - reload to get full data with joins
                        loadOrders();
                    } else if (payload.eventType === 'UPDATE') {
                        // Order updated (e.g., cancelled, status changed)
                        const updatedOrder = payload.new as { id: string; order_status: string; payment_status: string };
                        setOrders(prev => prev.map(order => 
                            order.id === updatedOrder.id
                                ? { 
                                    ...order, 
                                    status: updatedOrder.order_status,
                                    payment_status: updatedOrder.payment_status
                                }
                                : order
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        // Order deleted
                        const deletedOrder = payload.old as { id: string };
                        setOrders(prev => prev.filter(order => order.id !== deletedOrder.id));
                    }
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
            });

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Open Update Status Modal
    const openUpdateStatusModal = (order: Order) => {
        setUpdateStatusOrderId(order.id);
        setUpdateStatusCurrentStatus(order.status);
        setUpdateStatusPaymentMethod(order.payment_method);
        setNewStatus(order.status);
        setShowUpdateStatusModal(true);
    };

    // Get available status options based on payment method and current status
    const getAvailableStatuses = () => {
        // For COD: pending_payment -> processing -> shipping -> delivered
        // For Online: pending_payment -> paid -> processing -> shipping -> delivered
        const allStatuses = [
            { value: 'pending_payment', label: 'Pending Payment' },
            { value: 'paid', label: 'Paid' },
            { value: 'processing', label: 'Processing' },
            { value: 'shipping', label: 'Shipping' },
            { value: 'delivered', label: 'Delivered' },
        ];
        
        return allStatuses;
    };

    // Map order status to shipping status
    const getShippingStatus = (orderStatus: string) => {
        switch (orderStatus) {
            case 'pending_payment':
            case 'paid':
            case 'processing':
                return 'created';
            case 'shipping':
                return 'shipping';
            case 'delivered':
            case 'completed':
                return 'delivered';
            default:
                return 'created';
        }
    };

    // Handle Update Status
    const handleUpdateStatus = async () => {
        if (!updateStatusOrderId || !newStatus) return;
        
        setUpdatingStatus(true);
        try {
            // Update order status
            const { error: orderError } = await supabase
                .from('orders')
                .update({ 
                    order_status: newStatus,
                    // Also update payment_status if moving to paid or beyond
                    ...(newStatus !== 'pending_payment' && { payment_status: 'paid' })
                })
                .eq('id', updateStatusOrderId);

            if (orderError) throw orderError;

            // Update shipping_orders status to sync with order status
            const shippingStatus = getShippingStatus(newStatus);
            const { error: shippingError } = await supabase
                .from('shipping_orders')
                .update({ status: shippingStatus })
                .eq('order_id', updateStatusOrderId);

            if (shippingError) {
                console.warn('Failed to update shipping status:', shippingError);
                // Don't throw - shipping update is secondary
            }

            // Update local state
            setOrders(prev => prev.map(order =>
                order.id === updateStatusOrderId
                    ? { 
                        ...order, 
                        status: newStatus,
                        payment_status: newStatus !== 'pending_payment' ? 'paid' : order.payment_status
                    }
                    : order
            ));

            setShowUpdateStatusModal(false);
            setUpdateStatusOrderId(null);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update order status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Open Cancel Modal
    const openCancelModal = (order: Order) => {
        setCancelOrderId(order.id);
        setCancelOrderCustomer(order.customer_name);
        setShowCancelModal(true);
    };

    // Check if order can be cancelled
    const canCancelOrder = (status: string) => {
        return ['pending_payment', 'paid', 'processing'].includes(status);
    };

    // Handle Cancel Order
    const handleCancelOrder = async () => {
        if (!cancelOrderId) return;
        
        setCancellingOrder(true);
        try {
            // Get order items to restore stock
            const { data: orderData, error: fetchError } = await supabase
                .from('orders')
                .select(`
                    order_status,
                    order_items (variant_id, quantity)
                `)
                .eq('id', cancelOrderId)
                .single();

            if (fetchError) throw fetchError;

            // Check if can cancel
            if (!canCancelOrder(orderData.order_status)) {
                alert('Cannot cancel order in current status');
                return;
            }

            // Update order status to cancelled
            const { error: updateError } = await supabase
                .from('orders')
                .update({ order_status: 'cancelled' })
                .eq('id', cancelOrderId);

            if (updateError) throw updateError;

            // Restore stock using inventory service
            const itemsToRestore = (orderData.order_items || []).map((item) => {
                const typedItem = item as { variant_id: string; quantity: number };
                return {
                    variant_id: typedItem.variant_id,
                    quantity: typedItem.quantity
                };
            });

            if (itemsToRestore.length > 0) {
                const { error: stockError } = await restoreStock(itemsToRestore, supabase);
                if (stockError) {
                    console.warn('Failed to restore stock (non-blocking):', stockError);
                }
            }

            // Update local state
            setOrders(prev => prev.map(order =>
                order.id === cancelOrderId
                    ? { ...order, status: 'cancelled' }
                    : order
            ));

            setShowCancelModal(false);
            setCancelOrderId(null);
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order');
        } finally {
            setCancellingOrder(false);
        }
    };

    // Filter logic
    const filteredOrders = orders.filter((order) => {
        const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatOrderId = (id: string) => {
        return `#ORD-${id.substring(0, 4).toUpperCase()}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">ORDERS</h1>
                    <p className="text-slate-500">
                        Manage and track your store orders. 
                        <span className="ml-2 font-medium text-slate-700">{orders.length} total orders</span>
                    </p>
                </div>
                <Button variant="outline" className="gap-2 text-slate-600">
                    <Download className="h-4 w-4" />
                    Export Orders
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by order ID or customer..."
                        className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px] bg-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending_payment">Pending Payment</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipping">Shipping</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-wider text-slate-500">ORDER ID</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CUSTOMER</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">DATE</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ITEMS</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TOTAL</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">STATUS</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium text-slate-900 text-xs">
                                        {formatOrderId(order.id)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${getAvatarColor(order.customer_name)}`}>
                                                {getInitials(order.customer_name)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{order.customer_name}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600 font-medium">
                                        {order.date}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {order.items_count} items
                                    </TableCell>
                                    <TableCell className="text-sm font-bold text-slate-900">
                                        ${order.total.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${getStatusColor(order.status)}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => loadOrderDetail(order.id)}>
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => openUpdateStatusModal(order)}
                                                    disabled={order.status === 'cancelled' || order.status === 'completed'}
                                                >
                                                    Update Status
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-red-600"
                                                    onClick={() => openCancelModal(order)}
                                                    disabled={!canCancelOrder(order.status)}
                                                >
                                                    Cancel Order
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 px-2">
                <div className="text-sm text-slate-500">
                    Showing <span className="font-bold text-slate-900">{filteredOrders.length}</span> of <span className="font-bold text-slate-900">{orders.length}</span> orders
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0 font-bold text-blue-600 border-blue-200 bg-blue-50 text-xs">1</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Order Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Package className="h-5 w-5" />
                            Order Details
                            {selectedOrder && (
                                <span className="text-sm font-normal text-slate-500">
                                    #{selectedOrder.id.substring(0, 8).toUpperCase()}
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {detailLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : selectedOrder ? (
                        <div className="space-y-6">
                            {/* Order Status */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-slate-500">Order Status</p>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize mt-1 ${getStatusColor(selectedOrder.order_status)}`}>
                                        {selectedOrder.order_status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Payment</p>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize mt-1 ${selectedOrder.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700'}`}>
                                        {selectedOrder.payment_status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Method</p>
                                    <span className="inline-flex items-center gap-1 mt-1 text-sm font-medium text-slate-700">
                                        <CreditCard className="h-4 w-4" />
                                        {selectedOrder.payment_method?.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Date</p>
                                    <p className="text-sm font-medium text-slate-700 mt-1">
                                        {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Shipping Info */}
                            {selectedOrder.shipping && (
                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-blue-600" />
                                        Shipping Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-slate-400" />
                                            <span className="text-slate-600">Receiver:</span>
                                            <span className="font-medium text-slate-900">{selectedOrder.shipping.receiver_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                            <span className="text-slate-600">Phone:</span>
                                            <span className="font-medium text-slate-900">{selectedOrder.shipping.receiver_phone}</span>
                                        </div>
                                        <div className="flex items-start gap-2 md:col-span-2">
                                            <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                            <span className="text-slate-600">Address:</span>
                                            <span className="font-medium text-slate-900">{selectedOrder.shipping.receiver_address}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order Items */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-slate-50 px-4 py-3 border-b">
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <Package className="h-4 w-4 text-blue-600" />
                                        Order Items ({selectedOrder.items.length})
                                    </h3>
                                </div>
                                <div className="divide-y">
                                    {selectedOrder.items.length > 0 ? (
                                        selectedOrder.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 p-4">
                                                <div className="h-16 w-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 relative">
                                                    <Image
                                                        src={item.variant.product.image}
                                                        alt={item.variant.product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-900 truncate">
                                                        {item.variant.product.name}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        Size: <span className="font-medium">{item.variant.size}</span>
                                                        <span className="mx-2">|</span>
                                                        Color: <span className="font-medium">{item.variant.color}</span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                                                    <p className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-slate-500">
                                            <Package className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                            <p>No items found for this order</p>
                                            <p className="text-xs mt-1 text-slate-400">This may be an orphan order</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Total */}
                            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg text-white">
                                <span className="font-medium">Total Amount</span>
                                <span className="text-2xl font-bold">${selectedOrder.total_price.toFixed(2)}</span>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Update Status Modal */}
            <Dialog open={showUpdateStatusModal} onOpenChange={setShowUpdateStatusModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-blue-600" />
                            Update Order Status
                        </DialogTitle>
                        <DialogDescription>
                            Change the status of this order. This will also update the shipping status.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Current Status</Label>
                            <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusColor(updateStatusCurrentStatus)}`}>
                                {updateStatusCurrentStatus.replace('_', ' ')}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <div className="text-sm font-medium text-slate-700 uppercase">
                                {updateStatusPaymentMethod}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-status">New Status</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger id="new-status">
                                    <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailableStatuses().map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Flow Info */}
                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                            <p className="font-medium mb-1">Status Flow:</p>
                            {updateStatusPaymentMethod === 'cod' ? (
                                <p>Pending Payment → Processing → Shipping → Delivered</p>
                            ) : (
                                <p>Pending Payment → Paid → Processing → Shipping → Delivered</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowUpdateStatusModal(false)}
                            disabled={updatingStatus}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleUpdateStatus}
                            disabled={updatingStatus || newStatus === updateStatusCurrentStatus}
                        >
                            {updatingStatus ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Status'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Order Confirmation Modal */}
            <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Cancel Order
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this order?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="font-medium text-slate-900">
                                Customer: {cancelOrderCustomer}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                                Order ID: #{cancelOrderId?.substring(0, 8).toUpperCase()}
                            </p>
                        </div>

                        <div className="mt-4 text-sm text-slate-600">
                            <p className="font-medium mb-2">This action will:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Mark the order as cancelled</li>
                                <li>Restore product stock to inventory</li>
                                <li>Notify the customer (if enabled)</li>
                            </ul>
                        </div>
                    </div>

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
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
