"use client";

import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, Users, Activity, MoreHorizontal, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const stats = [
    {
        title: "Total Sales",
        value: "$124,500.00",
        change: "+12.5%",
        trend: "up",
        icon: DollarSign,
    },
    {
        title: "Total Orders",
        value: "1,840",
        change: "-2.4%",
        trend: "down",
        icon: ShoppingBag,
    },
    {
        title: "Active Customers",
        value: "8,432",
        change: "+156 today",
        trend: "up",
        icon: Users,
    },
    {
        title: "Conv. Rate",
        value: "3.2%",
        change: "+0.8%",
        trend: "up",
        icon: Activity,
    },
];

const recentOrders = [
    {
        id: "#ORD-0012",
        customer: "John Smith",
        status: "Pending",
        total: "$120.00",
        avatar: "JS",
    },
    {
        id: "#ORD-0011",
        customer: "Mia Adams",
        status: "Shipping",
        total: "$340.50",
        avatar: "MA",
    },
    {
        id: "#ORD-0010",
        customer: "Liam Brown",
        status: "Completed",
        total: "$85.00",
        avatar: "LB",
    },
    {
        id: "#ORD-0009",
        customer: "Sarah Davis",
        status: "Shipping",
        total: "$210.00",
        avatar: "SD",
    },
];

const stockAlerts = [
    {
        name: "Urban Cargo V1",
        status: "Low Stock: 12 Units",
        image: "/placeholder-cargo.jpg",
    },
    {
        name: "Cyber Glasses V2",
        status: "28 Units Remaining",
        image: "/placeholder-glasses.jpg",
    },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">OVERVIEW</h1>
                    <p className="text-slate-500">Real-time performance summary of your streetwear empire.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        Export Summary
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                            <div className="flex items-center text-xs mt-1 font-medium">
                                {stat.trend === "up" ? (
                                    <span className="text-emerald-600 flex items-center">
                                        <ArrowUpRight className="h-3 w-3 mr-1" />
                                        {stat.change}
                                    </span>
                                ) : (
                                    <span className="text-rose-600 flex items-center">
                                        <ArrowDownRight className="h-3 w-3 mr-1" />
                                        {stat.change}
                                    </span>
                                )}
                            </div>
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
                                <button className="px-3 py-1.5 bg-white hover:bg-slate-50 border-r">24H</button>
                                <button className="px-3 py-1.5 bg-white hover:bg-slate-50 border-r">7D</button>
                                <button className="px-3 py-1.5 bg-blue-600 text-white font-medium">30D</button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-end justify-center pb-4 relative">
                        {/* Simple CSS Graph Representation for "Placeholer" */}
                        <div className="w-full h-full relative border-l border-b border-slate-100">
                            <svg viewBox="0 0 100 40" className="w-full h-full absolute bottom-0 left-0" preserveAspectRatio="none">
                                {/* Mock Curve Blue */}
                                <path d="M0 40 Q 25 20, 50 25 T 100 10" fill="none" stroke="#2563eb" strokeWidth="0.5" />
                                <path d="M0 40 L 0 40 Q 25 20, 50 25 T 100 10 L 100 40 Z" fill="url(#gradientBlue)" opacity="0.1" />

                                {/* Mock Curve Gray */}
                                <path d="M0 40 Q 40 40, 60 30 T 100 25" fill="none" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="1 1" />

                                <defs>
                                    <linearGradient id="gradientBlue" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#2563eb" />
                                        <stop offset="100%" stopColor="transparent" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                <span>01 OCT</span>
                                <span>08 OCT</span>
                                <span>15 OCT</span>
                                <span>22 OCT</span>
                                <span>30 OCT</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stock Alerts / Side Panel */}
                <Card className="col-span-4 md:col-span-2 lg:col-span-2 text-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-bold">STOCK ALERTS</CardTitle>
                        <Badge variant="destructive" className="rounded-sm px-1.5">4</Badge>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {stockAlerts.map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="h-12 w-12 rounded bg-slate-800 flex items-center justify-center overflow-hidden">
                                    <span className="text-xs text-slate-400">IMG</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900 leading-none">{item.name}</p>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 w-[30%]"></div>
                                    </div>
                                    <p className="text-[10px] uppercase font-bold text-orange-600">{item.status}</p>
                                </div>
                            </div>
                        ))}

                        <div className="mt-4 pt-4 border-t">
                            <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider h-10">
                                Manage Inventory
                            </Button>
                        </div>

                        <div className="mt-2">
                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Top Categories</h4>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span>T-SHIRTS</span>
                                        <span>36%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full">
                                        <div className="h-full bg-blue-600 w-[36%] rounded-full"></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span>HOODIES</span>
                                        <span>31%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full">
                                        <div className="h-full bg-blue-600 w-[31%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between text-slate-900">
                    <CardTitle className="text-lg font-bold">RECENT ORDERS</CardTitle>
                    <Button variant="ghost" className="text-xs font-bold text-blue-600 uppercase tracking-wider h-auto py-0 px-0 hover:bg-transparent hover:text-blue-700">
                        View All
                    </Button>
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
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="border-b transition-colors hover:bg-slate-50">
                                        <td className="p-4 align-middle font-medium text-slate-900">{order.id}</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 bg-blue-50 text-blue-600 border border-blue-100">
                                                    <AvatarFallback className="text-[10px] font-bold">{order.avatar}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-slate-700">{order.customer}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Badge variant="secondary" className="rounded-sm font-bold uppercase text-[10px] tracking-wider text-blue-700 bg-blue-50 hover:bg-blue-100">
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-right font-bold text-slate-900">{order.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
