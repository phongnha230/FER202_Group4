"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import {
    Search,
    Download,
    Users,
    UserPlus,
    CircleDollarSign,
    Edit2,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";
import Link from "next/link";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    orders_count: number;
    total_spent: number;
    created_at: string;
}

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
        'bg-rose-100 text-rose-600',
        'bg-cyan-100 text-cyan-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [stats, setStats] = useState({
        totalCustomers: 0,
        newThisMonth: 0,
        avgLifetimeValue: 0,
    });

    useEffect(() => {
        async function loadCustomers() {
            try {
                setLoading(true);

                // Fetch all customers (profiles with role 'customer')
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'customer')
                    .order('created_at', { ascending: false });

                if (profilesError) throw profilesError;

                // Fetch orders to calculate stats per customer
                const { data: orders, error: ordersError } = await supabase
                    .from('orders')
                    .select('user_id, total_price');

                if (ordersError) throw ordersError;

                // Calculate orders count and total spent per customer
                const customerStats: Record<string, { orders_count: number; total_spent: number }> = {};
                (orders || []).forEach(order => {
                    if (!customerStats[order.user_id]) {
                        customerStats[order.user_id] = { orders_count: 0, total_spent: 0 };
                    }
                    customerStats[order.user_id].orders_count++;
                    customerStats[order.user_id].total_spent += order.total_price || 0;
                });

                // Format customers data
                const formattedCustomers: Customer[] = (profiles || []).map(profile => ({
                    id: profile.id,
                    name: profile.full_name || 'Unknown',
                    email: '', // Email is in auth.users, not accessible from client
                    phone: profile.phone,
                    address: profile.address,
                    orders_count: customerStats[profile.id]?.orders_count || 0,
                    total_spent: customerStats[profile.id]?.total_spent || 0,
                    created_at: profile.created_at,
                }));

                setCustomers(formattedCustomers);

                // Calculate stats
                const totalCustomers = formattedCustomers.length;
                const now = new Date();
                const thisMonth = formattedCustomers.filter(c => {
                    const created = new Date(c.created_at);
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length;
                
                const totalSpent = formattedCustomers.reduce((sum, c) => sum + c.total_spent, 0);
                const avgValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

                setStats({
                    totalCustomers,
                    newThisMonth: thisMonth,
                    avgLifetimeValue: avgValue,
                });

            } catch (error) {
                console.error('Error loading customers:', error);
            } finally {
                setLoading(false);
            }
        }

        loadCustomers();
    }, []);

    // Filter logic
    const filteredCustomers = customers.filter((customer) => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.phone && customer.phone.includes(searchTerm)) ||
            (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()));
        
        let matchesStatus = true;
        if (statusFilter === "active") {
            matchesStatus = customer.orders_count > 0;
        } else if (statusFilter === "inactive") {
            matchesStatus = customer.orders_count === 0;
        }

        return matchesSearch && matchesStatus;
    });

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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">CUSTOMERS</h1>
                    <p className="text-slate-500">Manage customer profiles, history, and status.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 font-bold uppercase tracking-wider text-xs h-10">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Customers</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-slate-900">{stats.totalCustomers.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">New This Month</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <UserPlus className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-slate-900">{stats.newThisMonth}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg. Lifetime Value</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                            <CircleDollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-slate-900">${stats.avgLifetimeValue.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border">
                <div className="relative w-full md:w-[400px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search customers by name or phone..."
                        className="pl-9 bg-white border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[140px] bg-white text-xs font-bold uppercase tracking-wider text-slate-600 h-9">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active (Has Orders)</SelectItem>
                            <SelectItem value="inactive">Inactive (No Orders)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Customers Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[250px] text-[10px] font-bold uppercase tracking-wider text-slate-500">CUSTOMER</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PHONE</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ORDERS</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TOTAL SPENT</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">STATUS</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getAvatarColor(customer.name)}`}>
                                                {getInitials(customer.name)}
                                            </div>
                                            <div className="flex flex-col">
                                                <Link href={`/admin/customers/${customer.id}`} className="text-sm font-bold text-slate-900 leading-tight hover:text-blue-600 hover:underline">
                                                    {customer.name}
                                                </Link>
                                                {customer.address && (
                                                    <span className="text-[11px] text-slate-500 truncate max-w-[200px]">{customer.address}</span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-slate-600">{customer.phone || '-'}</span>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-900 text-sm">
                                        {customer.orders_count} Orders
                                    </TableCell>
                                    <TableCell className="font-extrabold text-slate-900 text-sm">
                                        ${customer.total_spent.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                            customer.orders_count > 0
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {customer.orders_count > 0 ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={`/admin/customers/${customer.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    No customers found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Showing <span className="text-blue-600 font-extrabold">{filteredCustomers.length}</span> of <span className="text-slate-900 font-extrabold">{customers.length}</span> Customers
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
        </div>
    );
}
