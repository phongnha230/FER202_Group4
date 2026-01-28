"use client";

import * as React from "react";
import {
    Download,
    RotateCw,
    Search,
    MapPin,
    AlertTriangle,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";


// Mock Data for Inventory
interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    color?: string;
    location: string;
    section: string;
    totalStock: number;
    stockLevels: {
        s: number;
        m: number;
        l: number;
        xl: number;
        xxl: number;
    };
    status: 'ok' | 'low_stock' | 'out_of_stock';
    action: 'audit' | 'restock' | 'emergency_buy' | 'relocate';
}

const inventoryData: InventoryItem[] = [
    {
        id: '1',
        sku: 'UN-CRG-V1-GR',
        name: 'URBAN CARGO V1',
        color: 'GRAPHITE EDITION',
        location: 'SECTION A-12',
        section: 'A-12',
        totalStock: 41,
        stockLevels: { s: 12, m: 8, l: 15, xl: 4, xxl: 2 },
        status: 'ok',
        action: 'audit'
    },
    {
        id: '2',
        sku: 'UN-TEE-HV-WH',
        name: 'OVERSIZED HEAVY TEE',
        location: 'SECTION B-04',
        section: 'B-04',
        totalStock: 26,
        stockLevels: { s: 2, m: 14, l: 9, xl: 1, xxl: 0 },
        status: 'low_stock',
        action: 'restock'
    },
    {
        id: '3',
        sku: 'UN-HOD-DS-BLK',
        name: 'DISTRESSED HOODIE',
        location: 'SECTION C-19',
        section: 'C-19',
        totalStock: 0,
        stockLevels: { s: 0, m: 0, l: 0, xl: 0, xxl: 0 },
        status: 'out_of_stock',
        action: 'emergency_buy'
    },
    {
        id: '4',
        sku: 'UN-ACC-CB-V2',
        name: 'CYBER GLASSES V2',
        color: 'NEON SERIES',
        location: 'SECTION D-01',
        section: 'D-01',
        totalStock: 64,
        stockLevels: { s: 0, m: 0, l: 0, xl: 0, xxl: 0 }, // Accessories might not have sizes, handling conceptually
        status: 'ok',
        action: 'relocate'
    }
];

export default function InventoryPage() {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [showLowStockOnly, setShowLowStockOnly] = React.useState(false);

    // Filter logic
    const filteredInventory = inventoryData.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLowStock = showLowStockOnly ? (item.status === 'low_stock' || item.status === 'out_of_stock') : true;

        return matchesSearch && matchesLowStock;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">INVENTORY LOGISTICS</h1>
                    <p className="text-slate-500">Internal stock management, warehouse tracking, and distribution levels.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 font-bold uppercase tracking-wider text-xs h-10">
                        <Download className="h-4 w-4" />
                        Export Manifest
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2 font-bold uppercase tracking-wider text-xs h-10">
                        <RotateCw className="h-4 w-4" />
                        Update Stock
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by SKU or warehouse ID..."
                        className="pl-9 bg-white border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="low-stock"
                            checked={showLowStockOnly}
                            onCheckedChange={(checked: boolean | 'indeterminate') => setShowLowStockOnly(checked as boolean)}
                        />
                        <label
                            htmlFor="low-stock"
                            className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer"
                        >
                            Low Stock Alerts
                        </label>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 cursor-pointer">
                        <MapPin className="h-4 w-4" />
                        All Warehouses
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-wider text-slate-500">SKU</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Product Name</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Warehouse Location</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Total Stock</TableHead>
                            <TableHead className="w-[300px] text-[10px] font-bold uppercase tracking-wider text-slate-500">Detailed Stock Levels (S, M, L, XL, XXL)</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInventory.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium text-blue-600 text-xs text-wrap leading-tight">
                                    {item.sku.split('-').map((part, i, arr) => (
                                        <span key={i}>
                                            {part}{i < arr.length - 1 ? '-' : ''}
                                            {(i + 1) % 2 === 0 && <br />}
                                        </span>
                                    ))}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-extrabold text-slate-900 text-sm">{item.name}</span>
                                        {item.color && (
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{item.color}</span>
                                        )}
                                        {item.status === 'low_stock' && (
                                            <div className="flex items-center gap-1 text-orange-500 mt-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Low Stock</span>
                                            </div>
                                        )}
                                        {item.status === 'out_of_stock' && (
                                            <div className="flex items-center gap-1 text-red-600 mt-1">
                                                <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Out of Stock</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase text-slate-500">Section</span>
                                            <span className="text-sm font-bold text-slate-900">{item.section}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={`text-lg font-bold ${item.totalStock === 0 ? 'text-red-600' : item.status === 'low_stock' ? 'text-orange-500' : 'text-slate-900'}`}>
                                        {item.totalStock}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {item.name.includes("GLASSES") ? (
                                        <span className="text-xs text-slate-500 italic">Stock Batch: SB-4429 (Single Size Allocation)</span>
                                    ) : (
                                        <div className="grid grid-cols-5 gap-2 text-center">
                                            {Object.entries(item.stockLevels).map(([size, qty]) => (
                                                <div key={size} className="flex flex-col items-center">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400 mb-1">{size}</span>
                                                    <span className={`text-xs font-bold ${qty === 0 ? 'text-red-600' :
                                                        qty < 5 ? 'text-orange-500' : 'text-slate-900'
                                                        }`}>
                                                        {qty}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant={item.action === 'emergency_buy' ? 'destructive' : item.action === 'restock' ? 'default' : 'outline'}
                                        className={`h-8 text-[10px] font-bold uppercase tracking-wider px-4 ${item.action === 'restock' ? 'bg-orange-500 hover:bg-orange-600 text-white border-none' : ''
                                            }`}
                                    >
                                        {item.action.replace('_', ' ')}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Footer Report */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Logistics Report: <span className="text-blue-600">124 Active SKUs Monitored</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0 font-bold text-blue-600 border-blue-200 bg-blue-50 text-xs">1</Button>
                    <Button variant="outline" className="h-8 w-8 p-0 font-bold text-slate-600 text-xs">2</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
