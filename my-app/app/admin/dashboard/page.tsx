"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Users, Package, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SalesChart } from "@/components/admin/SalesChart";
import { supabase } from "@/lib/supabase/client";

interface DashboardStats {
    totalSales: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
}

interface RecentOrder {
    id: string;
    customer_name: string;
    customer_email: string;
    status: string;
    total: number;
    created_at: string;
}

interface LowStockProduct {
    id: string;
    name: string;
    image: string | null;
    total_stock: number;
    variant_count: number;
}

interface RecentOrderProfile {
    full_name: string | null;
}

interface RecentOrderRow {
    id: string;
    total_price: number;
    order_status: string;
    created_at: string;
    profiles: RecentOrderProfile | RecentOrderProfile[] | null;
}

interface ProductVariantRow {
    stock: number | null;
}

interface ProductWithVariantsRow {
    id: string;
    name: string;
    image: string | null;
    product_variants: ProductVariantRow[] | null;
}

interface ChartDataPoint {
    name: string;
    revenue: number;
    orders: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

    // Store processed chart data
    const [chartData24H, setChartData24H] = useState<ChartDataPoint[]>([]);
    const [chartData7D, setChartData7D] = useState<ChartDataPoint[]>([]);
    const [chartData30D, setChartData30D] = useState<ChartDataPoint[]>([]);

    const [loading, setLoading] = useState(true);
    const [lowStockLoading, setLowStockLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D'>('30D');

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setLoading(true);
                const [ordersCountRes, paidOrdersRes, customersRes, productsRes, recentOrdersRes, allOrdersForChartRes] = await Promise.all([
                    supabase.from('orders').select('id', { count: 'exact', head: true }),
                    supabase.from('orders').select('total_price').in('order_status', ['completed', 'delivered', 'paid']),
                    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
                    supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
                    supabase
                        .from('orders')
                        .select(`
                            id,
                            total_price,
                            order_status,
                            created_at,
                            profiles:user_id (
                                full_name
                            )
                        `)
                        .order('created_at', { ascending: false })
                        .limit(5),
                    supabase
                        .from('orders')
                        .select('total_price, created_at, order_status')
                        // only get recent ones for chart 
                        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                ]);

                const totalSales = (paidOrdersRes.data || []).reduce((sum, order) => sum + (order.total_price || 0), 0);

                setStats({
                    totalSales,
                    totalOrders: ordersCountRes.count || 0,
                    totalCustomers: customersRes.count || 0,
                    totalProducts: productsRes.count || 0,
                });

                // --- PROCESS CHART DATA ---
                if (allOrdersForChartRes.data) {
                    const validOrders = allOrdersForChartRes.data.filter(
                        o => ['completed', 'delivered', 'paid'].includes(o.order_status)
                    );

                    const now = new Date();
                    const processData = (days: number, intervalHours: number, formatLabel: (d: Date) => string) => {
                        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
                        const filtered = validOrders.filter(o => new Date(o.created_at) >= cutoff);

                        // Create bins
                        const bins: Record<string, ChartDataPoint> = {};
                        // Pre-fill bins based on intervals up to 'now'
                        const binCount = Math.floor((days * 24) / intervalHours);
                        for (let i = binCount; i >= 0; i--) {
                            const d = new Date(now.getTime() - i * intervalHours * 60 * 60 * 1000);
                            const label = formatLabel(d);
                            bins[label] = { name: label, revenue: 0, orders: 0 };
                        }

                        // Fill with data
                        filtered.forEach(o => {
                            const date = new Date(o.created_at);
                            // snap to floor of interval
                            const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
                            const binIndex = Math.floor(diffHours / intervalHours);
                            const binDate = new Date(now.getTime() - binIndex * intervalHours * 60 * 60 * 1000);
                            const label = formatLabel(binDate);

                            if (bins[label]) {
                                bins[label].revenue += o.total_price || 0;
                                bins[label].orders += 1;
                            }
                        });

                        return Object.values(bins);
                    };

                    // 24H: bins of 4 hours
                    const data24H = processData(1, 4, (d) => `${d.getHours().toString().padStart(2, '0')}:00`);
                    setChartData24H(data24H);

                    // 7D: bins of 1 day
                    const data7D = processData(7, 24, (d) => d.toLocaleDateString('en-US', { weekday: 'short' }));
                    setChartData7D(data7D);

                    // 30D: bins of 5 days
                    const data30D = processData(30, 24 * 5, (d) => `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleDateString('en-US', { month: 'short' })}`);
                    setChartData30D(data30D);
                }
                // --------------------------

                if (recentOrdersRes.data) {
                    const rows = recentOrdersRes.data as RecentOrderRow[];

                    setRecentOrders(rows.map(order => {
                        const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
                        return ({
                            id: order.id,
                            customer_name: profile?.full_name || 'Unknown Customer',
                            customer_email: '',
                            status: order.order_status,
                            total: order.total_price,
                            created_at: order.created_at,
                        })
                    }));
                }

                // Load low-stock data in background so the dashboard renders sooner.
                setLowStockLoading(true);
                (async () => {
                    try {
                        const { data: productsWithVariants, error } = await supabase
                            .from('products')
                            .select(`
                                id,
                                name,
                                image,
                                product_variants (
                                    stock
                                )
                            `)
                            .eq('status', 'active');

                        if (error) throw error;

                        if (!productsWithVariants) {
                            setLowStockProducts([]);
                            return;
                        }

                        const rows = productsWithVariants as ProductWithVariantsRow[];

                        const lowStock = rows
                            .map(product => {
                                const variants = product.product_variants || [];
                                const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
                                return {
                                    id: product.id,
                                    name: product.name,
                                    image: product.image,
                                    total_stock: totalStock,
                                    variant_count: variants.length,
                                };
                            })
                            .filter(p => p.total_stock < 50 && p.total_stock > 0)
                            .sort((a, b) => a.total_stock - b.total_stock)
                            .slice(0, 4);

                        setLowStockProducts(lowStock);
                    } catch (error) {
                        console.error('Error loading low stock data:', error);
                    } finally {
                        setLowStockLoading(false);
                    }
                })();

            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatOrderId = (id: string) => {
        return `#ORD-${id.substring(0, 4).toUpperCase()}`;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'delivered':
                return 'bg-emerald-50 text-emerald-700';
            case 'shipping':
                return 'bg-blue-50 text-blue-700';
            case 'processing':
            case 'paid':
                return 'bg-amber-50 text-amber-700';
            case 'cancelled':
            case 'returned':
                return 'bg-rose-50 text-rose-700';
            default:
                return 'bg-slate-50 text-slate-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const statsData = [
        {
            title: "Total Sales",
            value: formatCurrency(stats.totalSales),
            icon: DollarSign,
        },
        {
            title: "Total Orders",
            value: stats.totalOrders.toLocaleString(),
            icon: ShoppingBag,
        },
        {
            title: "Customers",
            value: stats.totalCustomers.toLocaleString(),
            icon: Users,
        },
        {
            title: "Active Products",
            value: stats.totalProducts.toLocaleString(),
            icon: Package,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">OVERVIEW</h1>
                    <p className="text-slate-500">Real-time performance summary of your store.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        Export Summary
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => window.location.reload()}
                    >
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsData.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Areas */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* Sales Chart Area */}
                <Card className="col-span-4 md:col-span-5 lg:col-span-5 text-slate-900">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">SALES OVER TIME</CardTitle>
                                <div className="flex items-center gap-4 mt-2 text-xs font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                                        REVENUE
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-slate-200"></span>
                                        ORDERS
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center border rounded-md overflow-hidden text-xs">
                                <button
                                    onClick={() => setTimeRange('24H')}
                                    className={`px-3 py-1.5 border-r transition-colors ${timeRange === '24H' ? 'bg-blue-600 text-white font-medium' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    24H
                                </button>
                                <button
                                    onClick={() => setTimeRange('7D')}
                                    className={`px-3 py-1.5 border-r transition-colors ${timeRange === '7D' ? 'bg-blue-600 text-white font-medium' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    7D
                                </button>
                                <button
                                    onClick={() => setTimeRange('30D')}
                                    className={`px-3 py-1.5 transition-colors ${timeRange === '30D' ? 'bg-blue-600 text-white font-medium' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    30D
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pt-4 pl-0 pr-2">
                        <SalesChart
                            timeRange={timeRange}
                            data={
                                timeRange === '24H' ? chartData24H :
                                    timeRange === '7D' ? chartData7D : chartData30D
                            }
                        />
                    </CardContent>
                </Card>

                {/* Stock Alerts / Side Panel */}
                <Card className="col-span-4 md:col-span-2 lg:col-span-2 text-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-bold">STOCK ALERTS</CardTitle>
                        <Badge variant="destructive" className="rounded-sm px-1.5">
                            {lowStockProducts.length}
                        </Badge>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {lowStockLoading ? (
                            <p className="text-sm text-slate-500 text-center py-4">Loading stock alerts...</p>
                        ) : lowStockProducts.length > 0 ? (
                            lowStockProducts.map((item) => (
                                <div key={item.id} className="flex items-start gap-3">
                                    <div className="h-12 w-12 rounded bg-slate-100 flex items-center justify-center overflow-hidden relative">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                            />
                                        ) : (
                                            <span className="text-xs text-slate-400">IMG</span>
                                        )}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <p className="text-sm font-bold text-slate-900 leading-none truncate">{item.name}</p>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${item.total_stock < 20 ? 'bg-rose-500' : 'bg-orange-500'}`}
                                                style={{ width: `${Math.min(item.total_stock, 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className={`text-[10px] uppercase font-bold ${item.total_stock < 20 ? 'text-rose-600' : 'text-orange-600'}`}>
                                            {item.total_stock < 20 ? 'Low Stock:' : ''} {item.total_stock} Units
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No stock alerts</p>
                        )}

                        <div className="mt-4 pt-4 border-t">
                            <Link href="/admin/inventory">
                                <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider h-10">
                                    Manage Inventory
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between text-slate-900">
                    <CardTitle className="text-lg font-bold">RECENT ORDERS</CardTitle>
                    <Link href="/admin/orders">
                        <Button variant="ghost" className="text-xs font-bold text-blue-600 uppercase tracking-wider h-auto py-0 px-0 hover:bg-transparent hover:text-blue-700">
                            View All
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-slate-50/50">
                                    <th className="h-12 px-4 align-middle font-bold text-slate-400 text-[10px] uppercase tracking-wider">Order ID</th>
                                    <th className="h-12 px-4 align-middle font-bold text-slate-400 text-[10px] uppercase tracking-wider">Customer</th>
                                    <th className="h-12 px-4 align-middle font-bold text-slate-400 text-[10px] uppercase tracking-wider">Status</th>
                                    <th className="h-12 px-4 align-middle font-bold text-slate-400 text-[10px] uppercase tracking-wider text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <tr key={order.id} className="border-b transition-colors hover:bg-slate-50">
                                            <td className="p-4 align-middle font-medium text-slate-900">
                                                {formatOrderId(order.id)}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 bg-blue-50 text-blue-600 border border-blue-100">
                                                        <AvatarFallback className="text-[10px] font-bold">
                                                            {getInitials(order.customer_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-slate-700">{order.customer_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge
                                                    variant="secondary"
                                                    className={`rounded-sm font-bold uppercase text-[10px] tracking-wider ${getStatusColor(order.status)}`}
                                                >
                                                    {order.status.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle text-right font-bold text-slate-900">
                                                {formatCurrency(order.total)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-slate-500">
                                            No orders yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
