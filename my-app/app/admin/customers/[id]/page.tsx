"use client";

import * as React from "react";
import {
    ArrowLeft,
    Mail,
    Phone,
    Edit2,
    Wallet,
    ShoppingCart,
    RotateCcw,
    Search,
    CheckCircle2,
    Sparkles,
    CreditCard,
    Bell
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

// Mock Data
const customerProfile = {
    id: "1",
    name: "Kai Takamura",
    email: "kai.takamura@example.com",
    phone: "+1 (555) 019-2834",
    joined: "Nov 2022",
    verified: true,
    avatar: "/placeholder-kai.jpg", // We'll mock this with initials
    initials: "KT",
    ltv: "$1,245.00",
    ltvGrowth: "+12% vs avg",
    aov: "$155.00",
    returns: 1,
    membershipTier: "Gold Member",
    tierPercent: "Top 5%",
    preferredCategories: ["Oversized Hoodies", "Cargo Pants"],
    paymentMethod: "•••• 4242",
    engagementScore: 85
};

const orderHistory = [
    { id: "#4092", date: "Oct 24, 2023", status: "Delivered", amount: "$210.00" },
    { id: "#3911", date: "Sep 12, 2023", status: "Delivered", amount: "$85.00" },
    { id: "#3804", date: "Aug 05, 2023", status: "Returned", amount: "$110.00" },
    { id: "#3650", date: "Jul 18, 2023", status: "Delivered", amount: "$950.00" },
];

export default function CustomerDetailsPage({ params }: { params: { id: string } }) {
    // In a real app, use params.id to fetch data

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
                        <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-sm flex items-center justify-center overflow-hidden">
                            {/* Using Initials Mock instead of Image */}
                            <span className="text-2xl font-bold text-slate-900">{customerProfile.initials}</span>
                        </div>
                        {customerProfile.verified && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <span>Verified</span>
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900">{customerProfile.name}</h1>
                        <div className="flex flex-col md:flex-row items-center gap-3 text-sm text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                {customerProfile.email}
                            </div>
                            <div className="hidden md:block h-1 w-1 rounded-full bg-slate-300" />
                            <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                {customerProfile.phone}
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Member since {customerProfile.joined}</p>
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
                                <div className="text-2xl font-extrabold text-slate-900">{customerProfile.ltv}</div>
                                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-1.5 py-0.5 rounded mt-1">
                                    {customerProfile.ltvGrowth}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
                                <ShoppingCart className="h-4 w-4 text-blue-600" />
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg. Order Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-extrabold text-slate-900">{customerProfile.aov}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-2 pb-2 space-y-0">
                                <RotateCcw className="h-4 w-4 text-blue-600" />
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Returns</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-extrabold text-slate-900">{customerProfile.returns}</div>
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
                                    {orderHistory.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-bold text-blue-600 text-xs">{order.id}</TableCell>
                                            <TableCell className="text-sm text-slate-600 font-medium">{order.date}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={`text-[10px] font-bold uppercase tracking-wider rounded-sm
                                                    ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                                        order.status === 'Returned' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : 'bg-slate-100 text-slate-600'}
                                                `}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900">{order.amount}</TableCell>
                                        </TableRow>
                                    ))}
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
                                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                        {customerProfile.membershipTier}
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">{customerProfile.tierPercent}</span>
                                </div>
                            </div>

                            {/* Preferred Category */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Preferred Category</h4>
                                <div className="flex flex-wrap gap-2">
                                    {customerProfile.preferredCategories.map((cat) => (
                                        <div key={cat} className="bg-slate-50 text-slate-700 text-xs font-bold px-2 py-1 rounded border">
                                            {cat}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Payment Method</h4>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                    <CreditCard className="h-4 w-4 text-slate-400" />
                                    Mastercard {customerProfile.paymentMethod}
                                </div>
                            </div>

                            {/* Engagement Score */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Engagement Score</h4>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full"
                                        style={{ width: `${customerProfile.engagementScore}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1 text-[10px] font-bold text-slate-400 uppercase">
                                    <span>Low</span>
                                    <span className="text-slate-900">High ({customerProfile.engagementScore})</span>
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
