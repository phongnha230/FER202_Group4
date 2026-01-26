"use client";

import * as React from "react";
import {
    Search,
    Calendar,
    Download,
    MoreVertical,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
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

// Mock Data for Orders
interface Order {
    id: string;
    customer: {
        name: string;
        email: string;
        avatarDetails: {
            initials: string;
            color: string;
        };
    };
    date: string;
    total: number;
    status: 'Pending' | 'Shipping' | 'Completed';
}

const ordersData: Order[] = [
    {
        id: '#ORD-0012',
        customer: {
            name: 'John Smith',
            email: 'john.s@example.com',
            avatarDetails: { initials: 'JS', color: 'bg-blue-100 text-blue-600' }
        },
        date: 'Oct 24, 2023',
        total: 120.00,
        status: 'Pending'
    },
    {
        id: '#ORD-0011',
        customer: {
            name: 'Mia Adams',
            email: 'mia.a@example.com',
            avatarDetails: { initials: 'MA', color: 'bg-pink-100 text-pink-600' }
        },
        date: 'Oct 23, 2023',
        total: 340.50,
        status: 'Shipping'
    },
    {
        id: '#ORD-0010',
        customer: {
            name: 'Liam Brown',
            email: 'liam.b@example.com',
            avatarDetails: { initials: 'LB', color: 'bg-indigo-100 text-indigo-600' }
        },
        date: 'Oct 22, 2023',
        total: 85.00,
        status: 'Completed'
    },
    {
        id: '#ORD-0009',
        customer: {
            name: 'Sarah Davis',
            email: 'sarah.d@example.com',
            avatarDetails: { initials: 'SD', color: 'bg-yellow-100 text-yellow-700' }
        },
        date: 'Oct 21, 2023',
        total: 210.00,
        status: 'Shipping'
    },
    {
        id: '#ORD-0008',
        customer: {
            name: 'Michael Jordan',
            email: 'mike.j@example.com',
            avatarDetails: { initials: 'MJ', color: 'bg-slate-100 text-slate-600' }
        },
        date: 'Oct 20, 2023',
        total: 55.00,
        status: 'Completed'
    },
    {
        id: '#ORD-0007',
        customer: {
            name: 'Emily White',
            email: 'emily.w@example.com',
            avatarDetails: { initials: 'EW', color: 'bg-emerald-100 text-emerald-600' }
        },
        date: 'Oct 19, 2023',
        total: 195.00,
        status: 'Pending'
    }
];

const getStatusColor = (status: Order['status']) => {
    switch (status) {
        case 'Pending':
            return 'bg-slate-100 text-slate-600';
        case 'Shipping':
            return 'bg-blue-100 text-blue-600';
        case 'Completed':
            return 'bg-emerald-100 text-emerald-600';
        default:
            return 'bg-slate-100 text-slate-600';
    }
};

export default function OrdersPage() {
    const [searchTerm, setSearchTerm] = React.useState("");

    // Filter logic
    const filteredOrders = ordersData.filter((order) => {
        return order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Orders</h1>
                    <p className="text-slate-500">Manage and track your store orders.</p>
                </div>
                {/* Actions could go here if needed, but per design usually on right or Toolbar */}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search orders..."
                        className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button variant="outline" className="gap-2 text-slate-600">
                        <Calendar className="h-4 w-4" />
                        Filter by Date
                    </Button>
                    <Button variant="outline" className="gap-2 text-slate-600">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
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
                                        {order.id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${order.customer.avatarDetails.color}`}>
                                                {order.customer.avatarDetails.initials}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{order.customer.name}</span>
                                                <span className="text-[11px] text-slate-500">{order.customer.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600 font-medium">
                                        {order.date}
                                    </TableCell>
                                    <TableCell className="text-sm font-bold text-slate-900">
                                        ${order.total.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusColor(order.status)}`}>
                                            {order.status}
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
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Update Status</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">Delete Order</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Report */}
            <div className="flex items-center justify-between mt-4 px-2">
                <div className="text-sm text-slate-500">
                    Showing <span className="font-bold text-slate-900">{filteredOrders.length}</span> to <span className="font-bold text-slate-900">{filteredOrders.length}</span> of <span className="font-bold text-slate-900">48</span> results
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
