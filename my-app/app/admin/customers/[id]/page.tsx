"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Mail,
    Phone,
    Edit2,
    Wallet,
    ShoppingCart,
    RotateCcw,
    Search,
    Sparkles,
    Bell,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface CustomerProfile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    avatar_url: string | null;
    joined: string;
    orders_count: number;
    total_spent: number;
    returns_count: number;
    aov: number;
    avgLtvGrowth: number;
}

interface OrderRow {
    id: string;
    displayId: string;
    date: string;
    status: string;
    amount: number;
}

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
};

const formatOrderStatus = (status: string) => {
    const map: Record<string, string> = {
        pending_payment: "Pending",
        paid: "Paid",
        processing: "Processing",
        shipping: "Shipping",
        delivered: "Delivered",
        completed: "Completed",
        cancelled: "Cancelled",
        returned: "Returned",
    };
    return map[status] || status;
};

export default function CustomerDetailsPage() {
    const params = useParams();
    const id = params?.id as string | undefined;
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        async function loadCustomer() {
            try {
                setLoading(true);
                setError(null);

                // Fetch profile
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, full_name, phone, address, avatar_url, created_at")
                    .eq("id", id)
                    .single();

                if (profileError) throw profileError;
                if (!profileData) {
                    setError("Không tìm thấy khách hàng");
                    return;
                }

                // Fetch orders for this customer
                const { data: ordersData, error: ordersError } = await supabase
                    .from("orders")
                    .select("id, total_price, order_status, created_at")
                    .eq("user_id", id)
                    .order("created_at", { ascending: false });

                if (ordersError) throw ordersError;

                const orderRows: OrderRow[] = (ordersData || []).map((o) => ({
                    id: o.id,
                    displayId: `#${o.id.slice(0, 8)}`,
                    date: new Date(o.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                    }),
                    status: o.order_status,
                    amount: o.total_price || 0,
                }));

                const totalSpent = (ordersData || []).reduce((sum, o) => sum + (o.total_price || 0), 0);
                const returnsCount = (ordersData || []).filter((o) => o.order_status === "returned").length;
                const ordersCount = ordersData?.length || 0;
                const aov = ordersCount > 0 ? totalSpent / ordersCount : 0;

                // Fetch email from API (auth.users)
                let email = "";
                try {
                    const res = await fetch(`/api/admin/customers/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        email = data.email || "";
                    }
                } catch {
                    // Email is optional
                }

                setProfile({
                    id: profileData.id,
                    name: profileData.full_name || "Unknown",
                    email,
                    phone: profileData.phone,
                    address: profileData.address,
                    avatar_url: profileData.avatar_url,
                    joined: new Date(profileData.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                    }),
                    orders_count: ordersCount,
                    total_spent: totalSpent,
                    returns_count: returnsCount,
                    aov,
                    avgLtvGrowth: 0, // Could calculate vs platform avg if needed
                });
                setOrders(orderRows);
            } catch (err) {
                console.error("Error loading customer:", err);
                setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
            } finally {
                setLoading(false);
            }
        }

        loadCustomer();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="space-y-6">
                <Link href="/admin/customers" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back to Customers</span>
                </Link>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error || "Không tìm thấy khách hàng"}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button & Header Actions */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Link href="/admin/customers" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back to Customers</span>
                </Link>
                <div className="flex items-center gap-2 hidden md:flex">
                    <Button variant="ghost" size="icon">
                        <Search className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Bell className="h-4 w-4 text-slate-500" />
                    </Button>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-lg border">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                            <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
                            <AvatarFallback className="h-24 w-24 rounded-full bg-slate-100 text-2xl font-bold text-slate-900">
                                {getInitials(profile.name)}
                            </AvatarFallback>
                        </Avatar>
                        {profile.orders_count > 0 && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <span>Verified</span>
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
                        <div className="flex flex-col md:flex-row items-center gap-3 text-sm text-slate-500">
                            {profile.email && (
                                <>
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" />
                                        {profile.email}
                                    </div>
                                    <div className="hidden md:block h-1 w-1 rounded-full bg-slate-300" />
                                </>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                {profile.phone || "—"}
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Member since {profile.joined}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="gap-2 flex-1 md:flex-none">
                        <Edit2 className="h-4 w-4" />
                        Edit Profile
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 flex-1 md:flex-none">
                        <Mail className="h-4 w-4" />
                        Send Message
                    </Button>
                </div>
            </div>

            {/* Main Grid: Stats & History (Left) | Insights (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
                                <Wallet className="h-4 w-4 text-blue-600" />
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Lifetime Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-extrabold text-slate-900">${profile.total_spent.toFixed(2)}</div>
                                {profile.avgLtvGrowth > 0 && (
                                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-1.5 py-0.5 rounded mt-1">
                                        +{profile.avgLtvGrowth}% vs avg
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
                                <ShoppingCart className="h-4 w-4 text-blue-600" />
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg. Order Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-extrabold text-slate-900">${profile.aov.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
                                <RotateCcw className="h-4 w-4 text-blue-600" />
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Returns</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-extrabold text-slate-900">{profile.returns_count}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order History */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-bold">Order History</CardTitle>
                            <Button variant="link" className="text-blue-600 font-bold h-auto p-0">View All</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Order ID</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.length > 0 ? (
                                        orders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-bold text-blue-600 text-xs">{order.displayId}</TableCell>
                                                <TableCell className="text-sm text-slate-600 font-medium">{order.date}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={`text-[10px] font-bold uppercase tracking-wider rounded-sm
                                                        ${order.status === "delivered" || order.status === "completed" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                                                            order.status === "returned" ? "bg-orange-100 text-orange-700 hover:bg-orange-100" : "bg-slate-100 text-slate-600"}
                                                    `}>
                                                        {formatOrderStatus(order.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-slate-900">${order.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-16 text-center text-slate-500 text-sm">
                                                Chưa có đơn hàng
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (1/3) - Sidebar */}
                <div className="space-y-6">

                    {/* Customer Insights */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Sparkles className="h-4 w-4 text-blue-600" />
                                Customer Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Membership Tier */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Membership Tier</h4>
                                <div className="flex items-center justify-between bg-slate-50 p-3 rounded border">
                                    <div className="flex items-center gap-2 font-bold text-slate-900">
                                        <div className={`h-2 w-2 rounded-full ${profile.orders_count >= 5 ? "bg-yellow-500" : profile.orders_count > 0 ? "bg-slate-400" : "bg-slate-300"}`} />
                                        {profile.orders_count >= 5 ? "Gold Member" : profile.orders_count > 0 ? "Silver Member" : "New Member"}
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">{profile.orders_count} orders</span>
                                </div>
                            </div>

                            {/* Address */}
                            {profile.address && (
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Address</h4>
                                    <div className="bg-slate-50 p-3 rounded border text-sm text-slate-700">
                                        {profile.address}
                                    </div>
                                </div>
                            )}

                            {/* Engagement Score - based on order count */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Engagement Score</h4>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full"
                                        style={{ width: `${Math.min(profile.orders_count * 20, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1 text-[10px] font-bold text-slate-400 uppercase">
                                    <span>Low</span>
                                    <span className="text-slate-900">High ({Math.min(profile.orders_count * 20, 100)})</span>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="bg-slate-50 p-3 rounded border text-sm text-slate-600">
                                <Textarea
                                    placeholder="Add internal notes about this customer..."
                                    className="min-h-[100px] border-0 bg-transparent resize-none p-0 focus-visible:ring-0 placeholder:text-slate-400"
                                />
                            </div>
                            <Button variant="ghost" className="w-full text-blue-600 font-bold uppercase text-xs tracking-wider justify-start px-0 hover:bg-transparent hover:text-blue-700">
                                Save Note
                            </Button>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
