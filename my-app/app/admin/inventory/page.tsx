"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Download,
    RotateCw,
    Search,
    Package,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Plus,
    X,
    CheckCircle2,
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

// ─── Restock Dialog ─────────────────────────────────────────────────────────
interface RestockDialogProps {
    item: InventoryItem;
    onClose: () => void;
    onSuccess: (itemId: string, updates: { variantId: string; addedStock: number }[]) => void;
}

function RestockDialog({ item, onClose, onSuccess }: RestockDialogProps) {
    const [amounts, setAmounts] = useState<Record<string, number>>(() =>
        Object.fromEntries(item.variants.map(v => [v.id, 0]))
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalAdding = Object.values(amounts).reduce((s, v) => s + v, 0);

    async function handleConfirm() {
        const toUpdate = item.variants.filter(v => amounts[v.id] > 0);
        if (toUpdate.length === 0) return;

        setSaving(true);
        setError(null);
        try {
            await Promise.all(
                toUpdate.map(v =>
                    supabase
                        .from("product_variants")
                        .update({ stock: v.stock + amounts[v.id] })
                        .eq("id", v.id)
                )
            );
            setSaved(true);
            setTimeout(() => {
                onSuccess(item.id, toUpdate.map(v => ({ variantId: v.id, addedStock: amounts[v.id] })));
                onClose();
            }, 800);
        } catch {
            setError("Failed to update stock. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                            {item.image ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="36px" />
                            ) : (
                                <Package className="h-4 w-4 text-blue-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 leading-tight">{item.name}</h2>
                            <p className="text-[10px] text-slate-500 font-mono">{item.sku}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3 max-h-[55vh] overflow-y-auto">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Add Stock by Variant
                    </p>
                    {item.variants.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No variants found for this product.</p>
                    ) : (
                        item.variants.map((v) => (
                            <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-900 uppercase">{v.size}</span>
                                        {v.color && (
                                            <span className="text-[10px] text-slate-500 bg-white border rounded px-1.5 py-0.5">{v.color}</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        Current stock:&nbsp;
                                        <span className={`font-bold ${v.stock < 10 ? 'text-rose-500' : v.stock < 20 ? 'text-orange-500' : 'text-slate-600'}`}>
                                            {v.stock} units
                                        </span>
                                    </p>
                                </div>

                                {/* +/- input */}
                                <div className="flex items-center border rounded-lg overflow-hidden bg-white">
                                    <button
                                        className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 transition-colors text-sm font-bold"
                                        onClick={() => setAmounts(prev => ({ ...prev, [v.id]: Math.max(0, (prev[v.id] || 0) - 1) }))}
                                    >−</button>
                                    <input
                                        type="number"
                                        min={0}
                                        value={amounts[v.id] || 0}
                                        onChange={e => setAmounts(prev => ({ ...prev, [v.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                                        className="w-14 text-center text-sm font-bold text-slate-900 border-x focus:outline-none py-1.5"
                                    />
                                    <button
                                        className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 transition-colors text-sm font-bold"
                                        onClick={() => setAmounts(prev => ({ ...prev, [v.id]: (prev[v.id] || 0) + 1 }))}
                                    >+</button>
                                </div>

                                {amounts[v.id] > 0 && (
                                    <span className="text-[10px] font-bold text-emerald-600 whitespace-nowrap">
                                        → {v.stock + amounts[v.id]}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-5 mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                {/* Footer */}
                <div className="px-5 py-4 border-t bg-slate-50 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                        {totalAdding > 0 ? (
                            <span>Adding <span className="font-bold text-emerald-600">+{totalAdding}</span> units total</span>
                        ) : (
                            <span className="text-slate-400">Enter quantities above</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-bold">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={totalAdding === 0 || saving || saved}
                            onClick={handleConfirm}
                            className={`text-xs font-bold gap-1.5 min-w-[110px] transition-all ${saved ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {saved ? (
                                <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
                            ) : saving ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                            ) : (
                                <><Plus className="h-3.5 w-3.5" /> Confirm Restock</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [restockTarget, setRestockTarget] = useState<InventoryItem | null>(null);

    const loadInventory = useCallback(async () => {
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
                const totalStock = variants.reduce((sum: number, v: { stock?: number }) => sum + (v.stock || 0), 0);
                let status: 'ok' | 'low_stock' | 'out_of_stock' = 'ok';
                if (totalStock === 0) status = 'out_of_stock';
                else if (totalStock < 20) status = 'low_stock';

                return {
                    id: product.id,
                    sku: `UN-${product.slug?.substring(0, 6).toUpperCase() || product.id.substring(0, 6).toUpperCase()}`,
                    name: product.name,
                    image: product.image,
                    category: (product.category as { name?: string })?.name || 'Uncategorized',
                    totalStock,
                    variants: variants.map((v: { id: string; size: string; color: string; stock: number; price: number }) => ({
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
    }, []);

    useEffect(() => { loadInventory(); }, [loadInventory]);

    // Apply restock updates to local state without full reload
    function handleRestockSuccess(itemId: string, updates: { variantId: string; addedStock: number }[]) {
        setInventory(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            const updatedVariants = item.variants.map(v => {
                const upd = updates.find(u => u.variantId === v.id);
                return upd ? { ...v, stock: v.stock + upd.addedStock } : v;
            });
            const newTotal = updatedVariants.reduce((s, v) => s + v.stock, 0);
            let status: 'ok' | 'low_stock' | 'out_of_stock' = 'ok';
            if (newTotal === 0) status = 'out_of_stock';
            else if (newTotal < 20) status = 'low_stock';
            return { ...item, variants: updatedVariants, totalStock: newTotal, status };
        }));
    }

    const getSizeStock = (variants: InventoryVariant[]) => {
        const sizeMap: Record<string, number> = {};
        variants.forEach(v => {
            if (!sizeMap[v.size]) sizeMap[v.size] = 0;
            sizeMap[v.size] += v.stock;
        });
        return sizeMap;
    };

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
            {/* Restock Dialog */}
            {restockTarget && (
                <RestockDialog
                    item={restockTarget}
                    onClose={() => setRestockTarget(null)}
                    onSuccess={handleRestockSuccess}
                />
            )}

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
                        onClick={loadInventory}
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
                            <TableHead className="w-[280px] text-[10px] font-bold uppercase tracking-wider text-slate-500">Stock by Size</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Action</TableHead>
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
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-[10px] font-bold uppercase tracking-wider h-7 px-3 gap-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                                onClick={() => setRestockTarget(item)}
                                            >
                                                <Plus className="h-3 w-3" />
                                                Restock
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-slate-500">
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
