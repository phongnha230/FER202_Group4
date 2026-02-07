"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import {
    Plus,
    Search,
    Filter,
    Eye,
    EyeOff,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ExternalLink
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getProducts, toggleProductVisibility } from "@/lib/api/product.api";
import { adaptProductsToUI, UIProduct } from "@/lib/adapters/product.adapter";

// Helper function to format date
function formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).toUpperCase();
}

export default function ProductsPage() {
    const [products, setProducts] = useState<UIProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [categoryFilter, setCategoryFilter] = React.useState("all");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [togglingId, setTogglingId] = React.useState<string | null>(null);

    // Handle toggle visibility
    const handleToggleVisibility = async (product: UIProduct) => {
        setTogglingId(product.id);
        try {
            const currentStatus = product.status as 'active' | 'hidden';
            const { newStatus, success, error } = await toggleProductVisibility(product.id, currentStatus);
            
            if (success) {
                // Update local state
                setProducts(prev => prev.map(p => 
                    p.id === product.id 
                        ? { ...p, status: newStatus } 
                        : p
                ));
            } else {
                console.error('Failed to toggle visibility:', error);
                // Show detailed error for debugging
                const errorMsg = error?.message || error?.code || 'Unknown error';
                alert(`Failed to update product visibility.\n\nError: ${errorMsg}\n\nPlease check if you have run the fix_products_rls.sql in Supabase.`);
            }
        } catch (err) {
            console.error('Error toggling visibility:', err);
            alert('An error occurred while updating visibility: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setTogglingId(null);
        }
    };

    useEffect(() => {
        async function loadProducts() {
            try {
                setLoading(true);
                // Fetch ALL products for admin (including hidden)
                const { data, error } = await getProducts({ status: 'all' });
                
                if (error) throw error;
                
                setProducts(adaptProductsToUI(data));
            } catch (err) {
                console.error('Error loading products:', err);
                setError(err instanceof Error ? err.message : 'Failed to load products');
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, []);

    // Get unique categories for filter
    const categories = Array.from(new Set(products.map((p) => p.category)));

    // Filter products
    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.id.includes(searchTerm) ||
            product.slug.includes(searchTerm) ||
            (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
        
        // Status filter logic
        let matchesStatus = true;
        if (statusFilter === "active") {
            matchesStatus = product.status === 'active' && product.inStock === true;
        } else if (statusFilter === "out_of_stock") {
            matchesStatus = product.status === 'active' && (!product.inStock || (product.totalStock !== undefined && product.totalStock <= 0));
        } else if (statusFilter === "hidden") {
            matchesStatus = product.status === 'hidden';
        }

        return matchesSearch && matchesCategory && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600 py-8">
                <p>Error loading products: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">PRODUCT CATALOG</h1>
                    <p className="text-slate-500">Manage your product descriptions, photography, and storefront visibility.</p>
                </div>
                <Link href="/admin/products/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                        <Plus className="h-4 w-4" />
                        ADD NEW PRODUCT
                    </Button>
                </Link>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search products by name or SKU..."
                        className="pl-9 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full md:w-[180px] bg-white">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[150px] bg-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                            <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Products Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">PRODUCT IMAGE</TableHead>
                            <TableHead>PRODUCT NAME</TableHead>
                            <TableHead>CATEGORY</TableHead>
                            <TableHead>STATUS</TableHead>
                            <TableHead>PRICE</TableHead>
                            <TableHead>LAST UPDATED</TableHead>
                            <TableHead className="text-right">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-slate-100">
                                            {product.image ? (
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="48px"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs text-slate-500">
                                                    IMG
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{product.name}</span>
                                            <span className="text-[10px] text-slate-500 uppercase">SKU: {product.sku}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-slate-600 uppercase text-[10px] tracking-wider">
                                            {product.category || 'Uncategorized'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {product.status === 'hidden' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                                                Hidden
                                            </span>
                                        ) : !product.inStock || (product.totalStock !== undefined && product.totalStock <= 0) ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
                                                Out of Stock
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                                Active
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-900">
                                        ${product.price.toFixed(2)}
                                        {product.salePrice && (
                                            <span className="ml-2 text-xs text-rose-600 line-through">
                                                ${product.salePrice.toFixed(2)}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {formatDate(product.updatedAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Toggle Visibility Button */}
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className={`h-8 w-8 ${product.status === 'hidden' ? 'border-orange-300 bg-orange-50' : ''}`}
                                                onClick={() => handleToggleVisibility(product)}
                                                disabled={togglingId === product.id}
                                                title={product.status === 'hidden' ? 'Show product on store' : 'Hide product from store'}
                                            >
                                                {togglingId === product.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                                ) : product.status === 'hidden' ? (
                                                    <EyeOff className="h-4 w-4 text-orange-500" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-emerald-600" />
                                                )}
                                            </Button>
                                            {/* View on Store */}
                                            <Link href={`/product/${product.slug}`} target="_blank">
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-8 w-8"
                                                    title="View on store"
                                                >
                                                    <ExternalLink className="h-4 w-4 text-slate-600" />
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/products/${product.id}/edit`}>
                                                <Button className="h-8 bg-blue-600 hover:bg-blue-700 text-xs font-bold uppercase tracking-wider px-3">
                                                    Edit Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination (Static Mock) */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Showing <span className="text-slate-900">{filteredProducts.length}</span> of <span className="text-slate-900">{products.length}</span> catalog items
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0 font-bold text-slate-900 border-blue-600 bg-blue-50 text-blue-600">1</Button>
                    <Button variant="outline" className="h-8 w-8 p-0 font-medium text-slate-600">2</Button>
                    <Button variant="outline" className="h-8 w-8 p-0 font-medium text-slate-600">3</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

        </div>
    );
}
