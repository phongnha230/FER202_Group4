"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Users, Package, Loader2, TrendingUp, Activity, Clock3, Sparkles, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SalesChart, type SalesSummary } from "@/components/admin/SalesChart";
import { OrderStatusChartCard } from "@/components/admin/OrderStatusChartCard";
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

type TimeRange = "24H" | "7D" | "30D";

const EMPTY_SALES_SUMMARY: SalesSummary = {
    totalRevenue: 0,
    totalOrders: 0,
    averageRevenue: 0,
    averageOrders: 0,
    peakLabel: "No peak yet",
    peakRevenue: 0,
    activePeriods: 0,
    insight: "No orders recorded in this period yet.",
};

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>("24H");
    const [salesSummary, setSalesSummary] = useState<SalesSummary>(EMPTY_SALES_SUMMARY);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setLoading(true);
                const [ordersCountRes, paidOrdersRes, customersRes, productsRes, recentOrdersRes] = await Promise.all([
                    supabase.from("orders").select("id", { count: "exact", head: true }),
                    supabase.from("orders").select("total_price").in("order_status", ["completed", "delivered", "paid"]),
                    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
                    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
                    supabase
                        .from("orders")
                        .select(`
                            id,
                            total_price,
                            order_status,
                            created_at,
                            profiles:user_id (
                                full_name
                            )
                        `)
                        .order("created_at", { ascending: false })
                        .limit(5),
                ]);

                const totalSales = (paidOrdersRes.data || []).reduce((sum, order) => sum + (order.total_price || 0), 0);

                setStats({
                    totalSales,
                    totalOrders: ordersCountRes.count || 0,
                    totalCustomers: customersRes.count || 0,
                    totalProducts: productsRes.count || 0,
                });

                if (recentOrdersRes.data) {
                    const rows = recentOrdersRes.data as RecentOrderRow[];

                    setRecentOrders(
                        rows.map((order) => {
                            const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
                            return {
                                id: order.id,
                                customer_name: profile?.full_name || "Unknown Customer",
                                customer_email: "",
                                status: order.order_status,
                                total: order.total_price,
                                created_at: order.created_at,
                            };
                        })
                    );
                }
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, []);

    const formatCurrency = (amount: number, compact = false) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            notation: compact ? "compact" : "standard",
            maximumFractionDigits: compact ? 1 : 2,
        }).format(amount);
    };

    const formatOrderId = (id: string) => {
        return `#ORD-${id.substring(0, 4).toUpperCase()}`;
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const handleExportSummary = () => {
        const now = new Date();
        const dateStr = now.toLocaleString("vi-VN");
        const fileName = `dashboard_summary_${now.toISOString().slice(0, 10)}.csv`;

        const sections: string[][] = [
            ["=== DASHBOARD SUMMARY ==="],
            [`Exported at: ${dateStr}`, `Time range: ${timeRange}`],
            [],
            ["=== STORE OVERVIEW ==="],
            ["Metric", "Value"],
            ["Total Sales (paid/delivered)", formatCurrency(stats.totalSales)],
            ["Total Orders", String(stats.totalOrders)],
            ["Total Customers", String(stats.totalCustomers)],
            ["Active Products", String(stats.totalProducts)],
            [],
            [`=== SALES SUMMARY (${timeRange}) ===`],
            ["Metric", "Value"],
            ["Total Revenue", formatCurrency(salesSummary.totalRevenue)],
            ["Total Orders", String(salesSummary.totalOrders)],
            [timeRange === "24H" ? "Avg Revenue / Hour" : "Avg Revenue / Day", formatCurrency(salesSummary.averageRevenue)],
            [timeRange === "24H" ? "Avg Orders / Hour" : "Avg Orders / Day", salesSummary.averageOrders.toFixed(2)],
            ["Peak Period", salesSummary.peakLabel],
            ["Peak Revenue", formatCurrency(salesSummary.peakRevenue)],
            ["Active Periods", String(salesSummary.activePeriods)],
            ["Insight", salesSummary.insight],
            [],
            ["=== RECENT ORDERS ==="],
            ["Order ID", "Customer", "Status", "Total", "Date"],
            ...recentOrders.map((o) => [
                formatOrderId(o.id),
                o.customer_name,
                o.status,
                formatCurrency(o.total),
                new Date(o.created_at).toLocaleString("vi-VN"),
            ]),
        ];

        const csv = sections
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
            case "delivered":
                return "bg-emerald-50 text-emerald-700";
            case "shipping":
                return "bg-blue-50 text-blue-700";
            case "processing":
            case "paid":
                return "bg-amber-50 text-amber-700";
            case "cancelled":
            case "returned":
                return "bg-rose-50 text-rose-700";
            default:
                return "bg-slate-50 text-slate-700";
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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

    const summaryItems = [
        {
            label: "Total Revenue",
            value: formatCurrency(salesSummary.totalRevenue, true),
            icon: TrendingUp,
        },
        {
            label: "Orders",
            value: salesSummary.totalOrders.toLocaleString(),
            icon: ShoppingBag,
        },
        {
            label: timeRange === "24H" ? "Avg / Hour" : "Avg / Day",
            value: `${salesSummary.averageOrders.toFixed(1)} ord`,
            meta: formatCurrency(salesSummary.averageRevenue, true),
            icon: Activity,
        },
        {
            label: "Peak Period",
            value: salesSummary.peakLabel,
            meta: salesSummary.peakRevenue > 0 ? formatCurrency(salesSummary.peakRevenue, true) : `${salesSummary.activePeriods} active`,
            icon: Clock3,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">OVERVIEW</h1>
                    <p className="text-slate-500">Real-time performance summary of your store.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExportSummary}>
                        <Download className="h-4 w-4" />
                        Export Summary
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.reload()}>
                        Refresh Data
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsData.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid items-start gap-4 md:grid-cols-7">
                <Card className="col-span-4 text-slate-900 md:col-span-5 lg:col-span-5">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">SALES OVER TIME</CardTitle>
                                <div className="mt-2 flex items-center gap-4 text-xs font-medium">
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
                            <div className="flex items-center overflow-hidden rounded-md border text-xs font-medium">
                                {(["24H", "7D", "30D"] as TimeRange[]).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-3 py-1.5 transition-colors ${
                                            timeRange === range
                                                ? "bg-blue-600 text-white"
                                                : "border-r bg-white text-slate-600 hover:bg-slate-50 last:border-r-0"
                                        }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-4 pl-0 pr-2 pt-2">
                        <SalesChart timeRange={timeRange} onSummaryChange={setSalesSummary} />
                        <div className="grid gap-3 pl-6 sm:grid-cols-2 xl:grid-cols-4">
                            {summaryItems.map((item) => (
                                <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3">
                                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                        <item.icon className="h-3.5 w-3.5" />
                                        {item.label}
                                    </div>
                                    <div className="text-lg font-black text-slate-900">{item.value}</div>
                                    {item.meta ? <div className="mt-1 text-xs font-medium text-slate-500">{item.meta}</div> : null}
                                </div>
                            ))}
                        </div>
                        <div className="ml-6 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-700">
                            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                                <Sparkles className="h-3.5 w-3.5" />
                                Insight
                            </div>
                            <p>{salesSummary.insight}</p>
                        </div>
                    </CardContent>
                </Card>

                <OrderStatusChartCard />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between text-slate-900">
                    <CardTitle className="text-lg font-bold">RECENT ORDERS</CardTitle>
                    <Link href="/admin/orders">
                        <Button variant="ghost" className="h-auto px-0 py-0 text-xs font-bold uppercase tracking-wider text-blue-600 hover:bg-transparent hover:text-blue-700">
                            View All
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto">
                        <table className="w-full caption-bottom text-left text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-slate-50/50">
                                    <th className="h-12 px-4 align-middle text-[10px] font-bold uppercase tracking-wider text-slate-400">Order ID</th>
                                    <th className="h-12 px-4 align-middle text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</th>
                                    <th className="h-12 px-4 align-middle text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                                    <th className="h-12 px-4 align-middle text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <tr key={order.id} className="border-b transition-colors hover:bg-slate-50">
                                            <td className="p-4 align-middle font-medium text-slate-900">{formatOrderId(order.id)}</td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-blue-100 bg-blue-50 text-blue-600">
                                                        <AvatarFallback className="text-[10px] font-bold">{getInitials(order.customer_name)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-slate-700">{order.customer_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge
                                                    variant="secondary"
                                                    className={`rounded-sm text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}
                                                >
                                                    {order.status.replace("_", " ")}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle text-right font-bold text-slate-900">{formatCurrency(order.total)}</td>
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
