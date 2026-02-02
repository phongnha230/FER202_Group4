"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import {
    Plus,
    Search,
    Filter,
    Eye,
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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getProducts } from "@/lib/api/product.api";
import { adaptProductsToUI, UIProduct } from "@/lib/adapters/product.adapter";

export default function ProductsPage() {
    const [products, setProducts] = useState<UIProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [categoryFilter, setCategoryFilter] = React.useState("all");

    useEffect(() => {
        async function loadProducts() {
            try {
                setLoading(true);
                const { data, error } = await getProducts({ status: 'active' });
                
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
            product.slug.includes(searchTerm);
        const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;

        return matchesSearch && matchesCategory;
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
                <div className="flex items-center gap-2 w-full md:w-auto">
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
                    <Button variant="outline" className="gap-2 bg-white">
                        <Filter className="h-4 w-4" />
                        Filters
                    </Button>
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
                                            {/* Placeholder image since we don't have real files yet */}
                                            <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs text-slate-500">
                                                IMG
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{product.name}</span>
                                            <span className="text-[10px] text-slate-500 uppercase">SKU: UN-{product.slug.substring(0, 6).toUpperCase()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-slate-600 uppercase text-[10px] tracking-wider">
                                            {product.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${product.inStock
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-rose-100 text-rose-700'
                                                }`}
                                        >
                                            {product.inStock ? 'Active' : 'Out of Stock'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-900">
                                        ${product.price.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {/* Mock Date */}
                                        OCT 24, 2023
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="outline" size="icon" className="h-8 w-8">
                                                <Eye className="h-4 w-4 text-slate-600" />
                                            </Button>
                                            <Button className="h-8 bg-blue-600 hover:bg-blue-700 text-xs font-bold uppercase tracking-wider px-3">
                                                Edit Details
                                            </Button>
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
