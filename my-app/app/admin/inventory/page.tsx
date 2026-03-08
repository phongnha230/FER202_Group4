"use client";

import { useCallback, useEffect, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Download,
    Loader2,
    Package,
    Pencil,
    Plus,
    RotateCw,
    Search,
    X,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
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
    status: "ok" | "low_stock" | "out_of_stock";
}

interface StockDialogProps {
    item: InventoryItem;
    mode: "restock" | "edit";
    onClose: () => void;
    onSuccess: (itemId: string, updates: { variantId: string; stock: number }[]) => void;
}

function StockDialog({ item, mode, onClose, onSuccess }: StockDialogProps) {
    const isEditMode = mode === "edit";
    const [amounts, setAmounts] = useState<Record<string, number>>(() =>
        Object.fromEntries(item.variants.map((variant) => [variant.id, isEditMode ? variant.stock : 0]))
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const changedVariants = item.variants.filter((variant) => {
        const nextValue = amounts[variant.id] ?? 0;
        return isEditMode ? nextValue !== variant.stock : nextValue > 0;
    });
    const hasChanges = changedVariants.length > 0;
    const totalDelta = changedVariants.reduce((sum, variant) => {
        const nextValue = amounts[variant.id] ?? 0;
        return sum + (isEditMode ? nextValue - variant.stock : nextValue);
    }, 0);

    async function handleConfirm() {
        if (!hasChanges) return;

        setSaving(true);
        setError(null);

        try {
            await Promise.all(
                changedVariants.map((variant) => {
                    const nextStock = isEditMode ? amounts[variant.id] ?? 0 : variant.stock + (amounts[variant.id] ?? 0);
                    return supabase.from("product_variants").update({ stock: nextStock }).eq("id", variant.id);
                })
            );

            setSaved(true);

            setTimeout(() => {
                onSuccess(
                    item.id,
                    changedVariants.map((variant) => ({
                        variantId: variant.id,
                        stock: isEditMode ? amounts[variant.id] ?? 0 : variant.stock + (amounts[variant.id] ?? 0),
                    }))
                );
                onClose();
            }, 800);
        } catch {
            setError("Failed to update stock. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(event) => event.target === event.currentTarget && onClose()}
        >
            <div className="mx-4 w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-50">
                            {item.image ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="36px" />
                            ) : (
                                <Package className="h-4 w-4 text-blue-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold leading-tight text-slate-900">{item.name}</h2>
                            <p className="font-mono text-[10px] text-slate-500">{item.sku}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[55vh] space-y-3 overflow-y-auto px-5 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {isEditMode ? "Set Stock by Variant" : "Add Stock by Variant"}
                    </p>
                    {item.variants.length === 0 ? (
                        <p className="py-4 text-center text-sm text-slate-500">No variants found for this product.</p>
                    ) : (
                        item.variants.map((variant) => {
                            const inputValue = amounts[variant.id] ?? 0;
                            const previewValue = isEditMode ? inputValue : variant.stock + inputValue;
                            const showPreview = isEditMode ? inputValue !== variant.stock : inputValue > 0;

                            return (
                                <div
                                    key={variant.id}
                                    className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:bg-slate-50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase text-slate-900">{variant.size}</span>
                                            {variant.color && (
                                                <span className="rounded border bg-white px-1.5 py-0.5 text-[10px] text-slate-500">
                                                    {variant.color}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                            Current stock:&nbsp;
                                            <span
                                                className={`font-bold ${
                                                    variant.stock < 10
                                                        ? "text-rose-500"
                                                        : variant.stock < 20
                                                          ? "text-orange-500"
                                                          : "text-slate-600"
                                                }`}
                                            >
                                                {variant.stock} units
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex items-center overflow-hidden rounded-lg border bg-white">
                                        <button
                                            className="px-2 py-1.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100"
                                            onClick={() =>
                                                setAmounts((prev) => ({
                                                    ...prev,
                                                    [variant.id]: Math.max(0, (prev[variant.id] ?? inputValue) - 1),
                                                }))
                                            }
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min={0}
                                            value={inputValue}
                                            onChange={(event) =>
                                                setAmounts((prev) => ({
                                                    ...prev,
                                                    [variant.id]: Math.max(0, parseInt(event.target.value, 10) || 0),
                                                }))
                                            }
                                            className="w-14 border-x py-1.5 text-center text-sm font-bold text-slate-900 focus:outline-none"
                                        />
                                        <button
                                            className="px-2 py-1.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100"
                                            onClick={() =>
                                                setAmounts((prev) => ({
                                                    ...prev,
                                                    [variant.id]: (prev[variant.id] ?? inputValue) + 1,
                                                }))
                                            }
                                        >
                                            +
                                        </button>
                                    </div>

                                    {showPreview && (
                                        <span
                                            className={`whitespace-nowrap text-[10px] font-bold ${
                                                previewValue < variant.stock ? "text-orange-600" : "text-emerald-600"
                                            }`}
                                        >
                                            {"->"} {previewValue}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {error && (
                    <div className="mx-5 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t bg-slate-50 px-5 py-4">
                    <div className="text-xs text-slate-500">
                        {hasChanges ? (
                            isEditMode ? (
                                <span>
                                    Net change{" "}
                                    <span className={`font-bold ${totalDelta >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                                        {totalDelta > 0 ? "+" : ""}
                                        {totalDelta}
                                    </span>{" "}
                                    units total
                                </span>
                            ) : (
                                <span>
                                    Adding <span className="font-bold text-emerald-600">+{totalDelta}</span> units total
                                </span>
                            )
                        ) : (
                            <span className="text-slate-400">
                                {isEditMode ? "Adjust stock values above" : "Enter quantities above"}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-bold">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={!hasChanges || saving || saved}
                            onClick={handleConfirm}
                            className={`min-w-[110px] gap-1.5 text-xs font-bold transition-all ${
                                saved ? "bg-emerald-500 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {saved ? (
                                <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Saved!</span>
                                </>
                            ) : saving ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : isEditMode ? (
                                <>
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span>Save Stock</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Confirm Restock</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [restockTarget, setRestockTarget] = useState<InventoryItem | null>(null);
    const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);

    const loadInventory = useCallback(async () => {
        try {
            setLoading(true);
            const { data: products, error } = await supabase
                .from("products")
                .select(`
                    id,
                    name,
                    slug,
                    image,
                    category:categories(name),
                    product_variants(id, size, color, stock, price)
                `)
                .order("name");

            if (error) throw error;

            const inventoryItems: InventoryItem[] = (products || []).map((product) => {
                const variants = product.product_variants || [];
                const totalStock = variants.reduce((sum: number, variant: { stock?: number }) => sum + (variant.stock || 0), 0);
                let status: "ok" | "low_stock" | "out_of_stock" = "ok";

                if (totalStock === 0) status = "out_of_stock";
                else if (totalStock < 20) status = "low_stock";

                return {
                    id: product.id,
                    sku: `UN-${product.slug?.substring(0, 6).toUpperCase() || product.id.substring(0, 6).toUpperCase()}`,
                    name: product.name,
                    image: product.image,
                    category: (product.category as { name?: string })?.name || "Uncategorized",
                    totalStock,
                    variants: variants.map((variant: { id: string; size: string; color: string; stock: number; price: number }) => ({
                        id: variant.id,
                        size: variant.size,
                        color: variant.color,
                        stock: variant.stock,
                        price: variant.price,
                    })),
                    status,
                };
            });

            setInventory(inventoryItems);
        } catch (error) {
            console.error("Error loading inventory:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    function handleStockSuccess(itemId: string, updates: { variantId: string; stock: number }[]) {
        setInventory((prev) =>
            prev.map((item) => {
                if (item.id !== itemId) return item;

                const updatedVariants = item.variants.map((variant) => {
                    const update = updates.find((entry) => entry.variantId === variant.id);
                    return update ? { ...variant, stock: update.stock } : variant;
                });

                const newTotal = updatedVariants.reduce((sum, variant) => sum + variant.stock, 0);
                let status: "ok" | "low_stock" | "out_of_stock" = "ok";

                if (newTotal === 0) status = "out_of_stock";
                else if (newTotal < 20) status = "low_stock";

                return {
                    ...item,
                    variants: updatedVariants,
                    totalStock: newTotal,
                    status,
                };
            })
        );
    }

    const getSizeStock = (variants: InventoryVariant[]) => {
        const sizeMap: Record<string, number> = {};
        variants.forEach((variant) => {
            if (!sizeMap[variant.size]) sizeMap[variant.size] = 0;
            sizeMap[variant.size] += variant.stock;
        });
        return sizeMap;
    };

    const filteredInventory = inventory.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLowStock = showLowStockOnly
            ? item.status === "low_stock" || item.status === "out_of_stock"
            : true;
        return matchesSearch && matchesLowStock;
    });

    const totalSkus = inventory.length;
    const lowStockCount = inventory.filter((item) => item.status === "low_stock").length;
    const outOfStockCount = inventory.filter((item) => item.status === "out_of_stock").length;

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {restockTarget && (
                <StockDialog
                    item={restockTarget}
                    mode="restock"
                    onClose={() => setRestockTarget(null)}
                    onSuccess={handleStockSuccess}
                />
            )}

            {editTarget && (
                <StockDialog
                    item={editTarget}
                    mode="edit"
                    onClose={() => setEditTarget(null)}
                    onSuccess={handleStockSuccess}
                />
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tight text-slate-900">INVENTORY</h1>
                    <p className="text-slate-500">
                        Stock management and variant tracking.
                        <span className="ml-2 font-medium text-orange-600">{lowStockCount} low stock</span>
                        {outOfStockCount > 0 && (
                            <span className="ml-2 font-medium text-red-600">{outOfStockCount} out of stock</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-10 gap-2 text-xs font-bold uppercase tracking-wider">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                    <Button
                        className="h-10 gap-2 bg-blue-600 text-xs font-bold uppercase tracking-wider hover:bg-blue-700"
                        onClick={loadInventory}
                    >
                        <RotateCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 rounded-lg border bg-white p-4 md:flex-row">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by name or SKU..."
                        className="border-slate-200 bg-white pl-9"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>
                <div className="flex w-full items-center gap-6 md:w-auto">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="low-stock"
                            checked={showLowStockOnly}
                            onCheckedChange={(checked: boolean | "indeterminate") => setShowLowStockOnly(checked as boolean)}
                        />
                        <label
                            htmlFor="low-stock"
                            className="cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-600"
                        >
                            Low Stock Only
                        </label>
                    </div>
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[60px]"></TableHead>
                            <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                SKU
                            </TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Product Name
                            </TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Category
                            </TableHead>
                            <TableHead className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Total Stock
                            </TableHead>
                            <TableHead className="w-[280px] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Stock by Size
                            </TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Status
                            </TableHead>
                            <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInventory.length > 0 ? (
                            filteredInventory.map((item) => {
                                const sizeStock = getSizeStock(item.variants);
                                const sizes = ["S", "M", "L", "XL", "XXL"];

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-slate-100">
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
                                        <TableCell className="font-mono text-xs text-blue-600">{item.sku}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{item.name}</span>
                                                <span className="text-[10px] text-slate-500">{item.variants.length} variants</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-slate-600">{item.category}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span
                                                className={`text-lg font-bold ${
                                                    item.status === "out_of_stock"
                                                        ? "text-red-600"
                                                        : item.status === "low_stock"
                                                          ? "text-orange-500"
                                                          : "text-slate-900"
                                                }`}
                                            >
                                                {item.totalStock}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="grid grid-cols-5 gap-2 text-center">
                                                {sizes.map((size) => {
                                                    const qty = sizeStock[size] || 0;
                                                    return (
                                                        <div key={size} className="flex flex-col items-center">
                                                            <span className="mb-1 text-[10px] font-bold uppercase text-slate-400">
                                                                {size}
                                                            </span>
                                                            <span
                                                                className={`text-xs font-bold ${
                                                                    qty === 0
                                                                        ? "text-red-600"
                                                                        : qty < 5
                                                                          ? "text-orange-500"
                                                                          : "text-slate-900"
                                                                }`}
                                                            >
                                                                {qty}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.status === "out_of_stock" ? (
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-600"></span>
                                                    <span className="text-[10px] font-bold uppercase">Out of Stock</span>
                                                </div>
                                            ) : item.status === "low_stock" ? (
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
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 gap-1 px-3 text-[10px] font-bold uppercase tracking-wider transition-colors hover:border-slate-300 hover:bg-slate-100"
                                                    onClick={() => setEditTarget(item)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 gap-1 px-3 text-[10px] font-bold uppercase tracking-wider transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                                    onClick={() => setRestockTarget(item)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    Restock
                                                </Button>
                                            </div>
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

            <div className="mt-4 flex items-center justify-between rounded-md border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Showing <span className="text-slate-900">{filteredInventory.length}</span> of{" "}
                    <span className="text-blue-600">{totalSkus} Products</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 border-blue-200 bg-blue-50 p-0 text-xs font-bold text-blue-600"
                    >
                        1
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
