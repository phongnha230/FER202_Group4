"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import {
    Download,
    RotateCw,
    Search,
    Package,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";
import Image from "next/image";
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
import { supabase } from "@/lib/supabase/client";

interface InventoryVariant {
    id: string;
    size: string;
    color: string;
    stock: number;
    price: number;
}

interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    image: string | null;
    category: string;
    totalStock: number;
    variants: InventoryVariant[];
    status: 'ok' | 'low_stock' | 'out_of_stock';
}

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    useEffect(() => {
        async function loadInventory() {
            try {
                setLoading(true);

                const { data: products, error } = await supabase
                    .from('products')
                    .select(`
                        id,
                        name,
                        slug,
                        image,
                        category:categories(name),
                        product_variants(id, size, color, stock, price)
                    `)
                    .order('name');

                if (error) throw error;

                const inventoryItems: InventoryItem[] = (products || []).map(product => {
                    const variants = product.product_variants || [];
                    const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
                    
                    let status: 'ok' | 'low_stock' | 'out_of_stock' = 'ok';
                    if (totalStock === 0) {
                        status = 'out_of_stock';
                    } else if (totalStock < 20) {
                        status = 'low_stock';
                    }

                    return {
                        id: product.id,
                        sku: `UN-${product.slug?.substring(0, 6).toUpperCase() || product.id.substring(0, 6).toUpperCase()}`,
                        name: product.name,
                        image: product.image,
                        category: (product.category as any)?.name || 'Uncategorized',
                        totalStock,
                        variants: variants.map((v: any) => ({
                            id: v.id,
                            size: v.size,
                            color: v.color,
                            stock: v.stock,
                            price: v.price,
                        })),
                        status,
                    };
                });

                setInventory(inventoryItems);
            } catch (error) {
                console.error('Error loading inventory:', error);
            } finally {
                setLoading(false);
            }
        }

        loadInventory();
    }, []);

    // Get unique sizes from all variants
    const getSizeStock = (variants: InventoryVariant[]) => {
        const sizeMap: Record<string, number> = {};
        variants.forEach(v => {
            if (!sizeMap[v.size]) sizeMap[v.size] = 0;
            sizeMap[v.size] += v.stock;
        });
        return sizeMap;
    };

    // Filter logic
    const filteredInventory = inventory.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLowStock = showLowStockOnly ? (item.status === 'low_stock' || item.status === 'out_of_stock') : true;

        return matchesSearch && matchesLowStock;
    });

    const totalSkus = inventory.length;
    const lowStockCount = inventory.filter(i => i.status === 'low_stock').length;
    const outOfStockCount = inventory.filter(i => i.status === 'out_of_stock').length;

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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">INVENTORY</h1>
                    <p className="text-slate-500">
                        Stock management and variant tracking. 
                        <span className="ml-2 text-orange-600 font-medium">{lowStockCount} low stock</span>
                        {outOfStockCount > 0 && <span className="ml-2 text-red-600 font-medium">{outOfStockCount} out of stock</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 font-bold uppercase tracking-wider text-xs h-10">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                    <Button 
                        className="bg-blue-600 hover:bg-blue-700 gap-2 font-bold uppercase tracking-wider text-xs h-10"
                        onClick={() => window.location.reload()}
                    >
                        <RotateCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by name or SKU..."
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
                            Low Stock Only
                        </label>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[60px]"></TableHead>
                            <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-wider text-slate-500">SKU</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Product Name</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Total Stock</TableHead>
                            <TableHead className="w-[300px] text-[10px] font-bold uppercase tracking-wider text-slate-500">Stock by Size</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInventory.length > 0 ? (
                            filteredInventory.map((item) => {
                                const sizeStock = getSizeStock(item.variants);
                                const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
                                
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center overflow-hidden relative">
                                                {item.image ? (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="40px"
                                                    />
                                                ) : (
                                                    <Package className="h-4 w-4 text-slate-400" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-blue-600">
                                            {item.sku}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                                                <span className="text-[10px] text-slate-500">{item.variants.length} variants</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-slate-600">{item.category}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`text-lg font-bold ${
                                                item.status === 'out_of_stock' ? 'text-red-600' : 
                                                item.status === 'low_stock' ? 'text-orange-500' : 'text-slate-900'
                                            }`}>
                                                {item.totalStock}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="grid grid-cols-5 gap-2 text-center">
                                                {sizes.map((size) => {
                                                    const qty = sizeStock[size] || 0;
                                                    return (
                                                        <div key={size} className="flex flex-col items-center">
                                                            <span className="text-[10px] font-bold uppercase text-slate-400 mb-1">{size}</span>
                                                            <span className={`text-xs font-bold ${
                                                                qty === 0 ? 'text-red-600' :
                                                                qty < 5 ? 'text-orange-500' : 'text-slate-900'
                                                            }`}>
                                                                {qty}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.status === 'out_of_stock' ? (
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                                                    <span className="text-[10px] font-bold uppercase">Out of Stock</span>
                                                </div>
                                            ) : item.status === 'low_stock' ? (
                                                <div className="flex items-center gap-1 text-orange-500">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    <span className="text-[10px] font-bold uppercase">Low Stock</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-emerald-600">
                                                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                                                    <span className="text-[10px] font-bold uppercase">In Stock</span>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Showing <span className="text-slate-900">{filteredInventory.length}</span> of <span className="text-blue-600">{totalSkus} Products</span>
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
