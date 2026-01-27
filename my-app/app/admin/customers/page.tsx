"use client";

import * as React from "react";
import {
    Search,
    Download,
    Plus,
    Users,
    UserPlus,
    CircleDollarSign,
    MoreVertical,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    MapPin
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock Data for Customers
interface Customer {
    id: string;
    name: string;
    email: string;
    avatarDetails: {
        initials: string;
        color: string;
    };
    location: string;
    orders: number;
    totalSpent: number;
    status: 'Active' | 'Inactive';
}

const customersData: Customer[] = [
    {
        id: '1',
        name: 'James Anderson',
        email: 'james.anderson@example.com',
        avatarDetails: { initials: 'JA', color: 'bg-blue-100 text-blue-600' },
        location: 'New York, USA',
        orders: 14,
        totalSpent: 2450.00,
        status: 'Active'
    },
    {
        id: '2',
        name: 'Sarah Connor',
        email: 'sarah.c@skynet.com',
        avatarDetails: { initials: 'SC', color: 'bg-slate-100 text-slate-600' },
        location: 'Los Angeles, USA',
        orders: 2,
        totalSpent: 150.00,
        status: 'Inactive'
    },
    {
        id: '3',
        name: 'Michael Chen',
        email: 'm.chen@tech.co',
        avatarDetails: { initials: 'MC', color: 'bg-yellow-100 text-yellow-700' }, // Image in design, using initials
        location: 'San Francisco, USA',
        orders: 45,
        totalSpent: 8940.00,
        status: 'Active'
    },
    {
        id: '4',
        name: 'Emily Blunt',
        email: 'emily.b@studio.io',
        avatarDetails: { initials: 'EB', color: 'bg-purple-100 text-purple-600' },
        location: 'London, UK',
        orders: 5,
        totalSpent: 540.00,
        status: 'Active'
    },
    {
        id: '5',
        name: 'Robert Ford',
        email: 'ford@westworld.inc',
        avatarDetails: { initials: 'RF', color: 'bg-slate-900 text-slate-100' }, // Image in design
        location: 'Austin, USA',
        orders: 0,
        totalSpent: 0.00,
        status: 'Inactive'
    }
];

export default function CustomersPage() {
    const [searchTerm, setSearchTerm] = React.useState("");

    // Filter logic
    const filteredCustomers = customersData.filter((customer) => {
        return customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.location.toLowerCase().includes(searchTerm.toLowerCase());
    });

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
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2 font-bold uppercase tracking-wider text-xs h-10">
                        <Plus className="h-4 w-4" />
                        Add Customer
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
                        <div className="text-3xl font-extrabold text-slate-900">12,450</div>
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
                        <div className="text-3xl font-extrabold text-slate-900">432</div>
                        <p className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-wider">+12% vs last month</p>
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
                        <div className="text-3xl font-extrabold text-slate-900">$245.00</div>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border">
                <div className="relative w-full md:w-[400px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search customers by name, email or location..."
                        className="pl-9 bg-white border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select>
                        <SelectTrigger className="w-full md:w-[140px] bg-white text-xs font-bold uppercase tracking-wider text-slate-600 h-9">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select>
                        <SelectTrigger className="w-full md:w-[150px] bg-white text-xs font-bold uppercase tracking-wider text-slate-600 h-9">
                            <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            <SelectItem value="us">USA</SelectItem>
                            <SelectItem value="uk">UK</SelectItem>
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
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">LOCATION</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ORDERS</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TOTAL SPENT</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">STATUS</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${customer.avatarDetails.color}`}>
                                            {customer.avatarDetails.initials}
                                        </div>
                                        <div className="flex flex-col">
                                            <Link href={`/admin/customers/${customer.id}`} className="text-sm font-bold text-slate-900 leading-tight hover:text-blue-600 hover:underline">
                                                {customer.name}
                                            </Link>
                                            <span className="text-[11px] text-blue-600">{customer.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-slate-600 text-blue-600">{customer.location}</span>
                                </TableCell>
                                <TableCell className="font-bold text-slate-900 text-sm">
                                    {customer.orders} Orders
                                </TableCell>
                                <TableCell className="font-extrabold text-slate-900 text-sm">
                                    ${customer.totalSpent.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${customer.status === 'Active'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {customer.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Report */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Showing <span className="text-blue-600 font-extrabold">{filteredCustomers.length}</span> to <span className="text-blue-600 font-extrabold">{filteredCustomers.length}</span> of <span className="text-slate-900 font-extrabold">12,450</span> Customers
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0 font-bold text-blue-600 border-blue-200 bg-blue-50 text-xs">1</Button>
                    <Button variant="outline" className="h-8 w-8 p-0 font-bold text-slate-600 text-xs">2</Button>
                    <Button variant="outline" className="h-8 w-8 p-0 font-bold text-slate-600 text-xs">3</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
