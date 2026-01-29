"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package, PenLine, RefreshCcw, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products, Product } from "@/mock/products";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import clsx from "clsx";

type OrderStatus = 'ordered' | 'shipped' | 'delivered' | 'returned';

interface Order {
    id: string;
    orderNumber: string;
    date: string; // ISO format
    status: OrderStatus;
    product: Product;
    size: string;
    color: string;
    quantity: number;
    deliveryEstimate?: string;
}

export default function MyOrdersPage() {
    const [activeTab, setActiveTab] = useState<'ALL' | 'ON THE WAY' | 'RETURNS'>('ALL');
    const [selectedYear, setSelectedYear] = useState<string>("all");

    // Create mock orders using products from streetwear
    const mockOrders: Order[] = useMemo(() => [
        {
            id: 'o1',
            orderNumber: 'UN-8821',
            date: '2023-10-21',
            status: 'shipped',
            product: products.find(p => p.id === '4') || products[0],
            size: 'L',
            color: 'Black',
            quantity: 1,
            deliveryEstimate: 'Oct 24'
        },
        {
            id: 'o2',
            orderNumber: 'UN-8742',
            date: '2023-10-10',
            status: 'delivered',
            product: products.find(p => p.id === '3') || products[0],
            size: 'M',
            color: 'White',
            quantity: 2
        },
        {
            id: 'o3',
            orderNumber: 'UN-8105',
            date: '2023-09-15',
            status: 'delivered',
            product: products.find(p => p.id === '2') || products[0],
            size: 'S',
            color: 'Olive',
            quantity: 1
        },
        {
            id: 'o4',
            orderNumber: 'UN-7922',
            date: '2022-08-02',
            status: 'delivered',
            product: products.find(p => p.id === '1') || products[0],
            size: 'L',
            color: 'Gray',
            quantity: 1
        },
        {
            id: 'o5',
            orderNumber: 'UN-9001',
            date: '2024-01-15',
            status: 'ordered',
            product: products.find(p => p.id === '5') || products[0],
            size: 'XL',
            color: 'Blue',
            quantity: 1,
            deliveryEstimate: 'Jan 20'
        },
        {
            id: 'o6',
            orderNumber: 'UN-8500',
            date: '2023-11-05',
            status: 'returned',
            product: products.find(p => p.id === '6') || products[0],
            size: 'M',
            color: 'Black',
            quantity: 1
        }
    ], []);

    const filteredOrders = useMemo(() => {
        return mockOrders.filter(order => {
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
    }, [activeTab, selectedYear, mockOrders]);

    const activeOrders = filteredOrders.filter(o => o.status === 'ordered' || o.status === 'shipped');
    const pastOrders = filteredOrders.filter(o => o.status === 'delivered' || o.status === 'returned');

    return (
        <div className="container-custom py-10">
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
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                            <SelectItem value="2022">2022</SelectItem>
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
                                    <div className="flex gap-3 mt-8">
                                        <Button className="bg-black text-white hover:bg-black/90 h-10 px-6 rounded-sm text-xs font-bold">
                                            <Truck className="w-4 h-4 mr-2" />
                                            TRACK PACKAGE
                                        </Button>
                                        <Button variant="outline" className="h-10 px-6 rounded-sm text-xs font-bold border-gray-300">
                                            VIEW DETAILS
                                        </Button>
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
                                    {order.status === 'delivered' && (
                                        <Button variant="outline" className="h-10 px-4 rounded-sm text-xs font-bold text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600" asChild>
                                            <Link href={`/write-review/${order.id}`}>
                                                <PenLine className="w-3.5 h-3.5 mr-2" />
                                                WRITE A REVIEW
                                            </Link>
                                        </Button>
                                    )}
                                    {order.status === 'returned' && (
                                        <Button variant="outline" className="h-10 px-4 rounded-sm text-xs font-bold border-gray-300">
                                            <RefreshCcw className="w-3.5 h-3.5 mr-2" />
                                            BUY AGAIN
                                        </Button>
                                    )}
                                    <Button variant="outline" size="icon" className="h-10 w-10 border-gray-300">
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
        </div>
    );
}
