"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Loader2,
    Trash2,
    Eye,
    EyeOff,
    ChevronRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    getProduct, 
    getCategories, 
    updateProduct, 
    deleteProduct,
    UpdateProductData 
} from "@/lib/api/product.api";
import { ProductWithDetails } from "@/services/product.service";
import { Category } from "@/types/database.types";

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [product, setProduct] = useState<ProductWithDetails | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        base_price: 0,
        sale_price: null as number | null,
        category_id: 0,
        status: "active" as "active" | "hidden",
        featured: false,
        is_new: false,
        in_stock: true,
        image: ""
    });

    // Load product and categories
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const [productResult, categoriesResult] = await Promise.all([
                    getProduct(productId),
                    getCategories()
                ]);

                if (productResult.error) throw new Error(productResult.error.message);
                if (!productResult.data) throw new Error("Product not found");

                const p = productResult.data;
                setProduct(p);
                setFormData({
                    name: p.name || "",
                    description: p.description || "",
                    base_price: p.base_price || 0,
                    sale_price: p.sale_price || null,
                    category_id: p.category_id || 0,
                    status: (p.status as "active" | "hidden") || "active",
                    featured: p.featured || false,
                    is_new: p.is_new || false,
                    in_stock: p.in_stock !== false,
                    image: p.image || ""
                });

                if (categoriesResult.data) {
                    setCategories(categoriesResult.data);
                }
            } catch (err) {
                console.error("Error loading product:", err);
                setError(err instanceof Error ? err.message : "Failed to load product");
            } finally {
                setLoading(false);
            }
        }

        if (productId) {
            loadData();
        }
    }, [productId]);

    // Handle form submit
    const handleSave = async () => {
        setSaving(true);
        try {
            const updateData: UpdateProductData = {
                name: formData.name,
                description: formData.description,
                base_price: formData.base_price,
                sale_price: formData.sale_price,
                category_id: formData.category_id || undefined,
                status: formData.status,
                featured: formData.featured,
                is_new: formData.is_new,
                in_stock: formData.in_stock,
                image: formData.image
            };

            const { success, error } = await updateProduct(productId, updateData);

            if (success) {
                alert("Product updated successfully!");
                router.push("/admin/products");
            } else {
                throw new Error(error?.message || "Failed to update product");
            }
        } catch (err) {
            console.error("Error saving product:", err);
            alert(err instanceof Error ? err.message : "Failed to save product");
        } finally {
            setSaving(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
            return;
        }

        setDeleting(true);
        try {
            const { success, error } = await deleteProduct(productId);

            if (success) {
                alert("Product deleted successfully!");
                router.push("/admin/products");
            } else {
                throw new Error(error?.message || "Failed to delete product");
            }
        } catch (err) {
            console.error("Error deleting product:", err);
            alert(err instanceof Error ? err.message : "Failed to delete product");
        } finally {
            setDeleting(false);
        }
    };

    // Toggle visibility
    const toggleVisibility = () => {
        setFormData(prev => ({
            ...prev,
            status: prev.status === "active" ? "hidden" : "active"
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 mb-4">Error: {error || "Product not found"}</p>
                <Link href="/admin/products">
                    <Button variant="outline">Back to Products</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Breadcrumbs & Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Link href="/admin/products" className="hover:text-slate-900">Products</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-slate-900">Edit Product</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/products">
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
                            <p className="text-slate-500 text-sm">ID: {productId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={toggleVisibility}
                            className={formData.status === "hidden" ? "border-orange-300 bg-orange-50" : ""}
                        >
                            {formData.status === "hidden" ? (
                                <>
                                    <EyeOff className="h-4 w-4 mr-2 text-orange-500" />
                                    Hidden
                                </>
                            ) : (
                                <>
                                    <Eye className="h-4 w-4 mr-2 text-emerald-600" />
                                    Visible
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Product Image Preview */}
            {formData.image && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="relative h-24 w-24 overflow-hidden rounded-lg border bg-slate-100">
                                <Image
                                    src={formData.image}
                                    alt={formData.name}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{formData.name}</h3>
                                <Badge variant={formData.status === "active" ? "default" : "secondary"}>
                                    {formData.status === "active" ? "Active" : "Hidden"}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* General Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-bold">General Information</CardTitle>
                    <CardDescription>Basic product details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter product name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter product description"
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={formData.category_id?.toString() || ""}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: parseInt(value) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Image URL</Label>
                        <Input
                            id="image"
                            value={formData.image}
                            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                            placeholder="/products/image.jpg"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Pricing</CardTitle>
                    <CardDescription>Set product prices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="base_price">Base Price ($) *</Label>
                            <Input
                                id="base_price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.base_price}
                                onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sale_price">Sale Price ($)</Label>
                            <Input
                                id="sale_price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.sale_price || ""}
                                onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    sale_price: e.target.value ? parseFloat(e.target.value) : null 
                                }))}
                                placeholder="Leave empty if no sale"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Product Options */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Product Options</CardTitle>
                    <CardDescription>Additional product settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="featured"
                            checked={formData.featured}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
                        />
                        <Label htmlFor="featured" className="cursor-pointer">Featured Product</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_new"
                            checked={formData.is_new}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new: !!checked }))}
                        />
                        <Label htmlFor="is_new" className="cursor-pointer">Mark as New</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="in_stock"
                            checked={formData.in_stock}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, in_stock: !!checked }))}
                        />
                        <Label htmlFor="in_stock" className="cursor-pointer">In Stock</Label>
                    </div>
                </CardContent>
            </Card>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 pb-8">
                <Link href="/admin/products">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Cancel
                    </Button>
                </Link>
                <Button
                    onClick={handleSave}
                    disabled={saving || !formData.name || formData.base_price <= 0}
                    className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 px-6"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
