"use client";

import * as React from "react";
import { useState, useCallback, useRef } from "react";
import {
    ArrowLeft,
    CloudUpload,
    X,
    ChevronRight,
    Loader2,
    Check,
    Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { uploadFile } from "@/services/upload.service";
import { createProduct, createProductVariants, getCategories, NewVariant } from "@/services/product.service";
import { Category } from "@/types/database.types";

// Define step types
type Step = 1 | 2 | 3;

interface UploadedImage {
    id: string;
    file?: File;
    url: string;
    name: string;
    isPrimary: boolean;
    isUploading?: boolean;
    isUploaded?: boolean;
    error?: string;
}

interface ProductFormData {
    // Step 1: General Info
    name: string;
    description: string;
    category_id: number | null;
    slug: string;
    // Step 2: Media (images stored separately)
    // Step 3: Pricing & Inventory
    base_price: number;
    sale_price: number | null;
    featured: boolean;
    is_new: boolean;
    in_stock: boolean;
}

interface VariantInput {
    id: string;
    size: string;
    color: string;
    price: number;
    stock: number;
}

export default function AddProductPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Current step
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Form data
    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        description: "",
        category_id: null,
        slug: "",
        base_price: 0,
        sale_price: null,
        featured: false,
        is_new: true,
        in_stock: true,
    });

    // Uploaded images
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    // Variants
    const [variants, setVariants] = useState<VariantInput[]>([{
        id: `variant-${Date.now()}`,
        size: "M",
        color: "Black",
        price: 0,
        stock: 0
    }]);

    const sizePresets = ["XS", "S", "M", "L", "XL", "XXL"];

    // Load categories on mount
    React.useEffect(() => {
        async function loadCategories() {
            setLoadingCategories(true);
            const { data, error } = await getCategories();
            if (!error && data) {
                setCategories(data);
            }
            setLoadingCategories(false);
        }
        loadCategories();
    }, []);

    // Auto-generate slug from name
    React.useEffect(() => {
        if (formData.name && !formData.slug) {
            const slug = formData.name
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.name, formData.slug]);

    // Calculate progress
    const getProgress = () => {
        switch (currentStep) {
            case 1: return 33;
            case 2: return 66;
            case 3: return 100;
            default: return 0;
        }
    };

    // Handle file selection
    const handleFileSelect = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newImages: UploadedImage[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                continue;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                continue;
            }

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);

            newImages.push({
                id: `temp-${Date.now()}-${i}`,
                file,
                url: previewUrl,
                name: file.name,
                isPrimary: images.length === 0 && i === 0, // First image is primary
                isUploading: false,
                isUploaded: false,
            });
        }

        setImages(prev => [...prev, ...newImages]);
    }, [images.length]);

    // Handle drag and drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    // Remove image
    const removeImage = useCallback((imageId: string) => {
        setImages(prev => {
            const filtered = prev.filter(img => img.id !== imageId);
            // If we removed the primary image, set the first one as primary
            if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
                filtered[0].isPrimary = true;
            }
            return filtered;
        });
    }, []);

    // Set primary image
    const setPrimaryImage = useCallback((imageId: string) => {
        setImages(prev => prev.map(img => ({
            ...img,
            isPrimary: img.id === imageId
        })));
    }, []);

    // Upload images to Supabase
    const uploadImages = async (): Promise<string | null> => {
        // Find the primary image
        const primaryImage = images.find(img => img.isPrimary);
        if (!primaryImage || !primaryImage.file) {
            // If already uploaded, return the URL
            if (primaryImage?.isUploaded && primaryImage.url) {
                return primaryImage.url;
            }
            return null;
        }

        // Upload primary image
        setImages(prev => prev.map(img =>
            img.id === primaryImage.id ? { ...img, isUploading: true } : img
        ));

        const { url, error } = await uploadFile(primaryImage.file, 'products');

        if (error || !url) {
            setImages(prev => prev.map(img =>
                img.id === primaryImage.id ? { ...img, isUploading: false, error: 'Upload failed' } : img
            ));
            return null;
        }

        setImages(prev => prev.map(img =>
            img.id === primaryImage.id ? { ...img, isUploading: false, isUploaded: true, url } : img
        ));

        return url;
    };

    // Validate current step
    const validateStep = (step: Step): boolean => {
        const variantsValid = variants.length > 0 && variants.every(v =>
            v.size.trim() !== "" &&
            v.color.trim() !== "" &&
            (v.price || formData.base_price) > 0 &&
            v.stock >= 0
        );

        switch (step) {
            case 1:
                return formData.name.trim() !== "" && formData.description.trim() !== "";
            case 2:
                return images.length > 0;
            case 3:
                return formData.base_price > 0 && variantsValid;
            default:
                return false;
        }
    };

    // Handle next step
    const handleNext = () => {
        if (validateStep(currentStep) && currentStep < 3) {
            setCurrentStep((currentStep + 1) as Step);
        }
    };

    // Handle previous step
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as Step);
        }
    };

    // Handle form submit
    const handleSubmit = async () => {
        if (!validateStep(3)) return;

        setIsSubmitting(true);

        try {
            // Upload images first
            const imageUrl = await uploadImages();

            // Create product
            const { data, error } = await createProduct({
                name: formData.name,
                description: formData.description,
                category_id: formData.category_id || undefined,
                slug: formData.slug || undefined,
                base_price: formData.base_price,
                sale_price: formData.sale_price,
                featured: formData.featured,
                is_new: formData.is_new,
                in_stock: variants.some(v => v.stock > 0),
                image: imageUrl || undefined,
            });

            if (error) {
                throw new Error(error.message);
            }

            // Create variants
            if (data?.id) {
                const variantPayload: NewVariant[] = variants.map(v => ({
                    size: v.size.trim(),
                    color: v.color.trim() || "Default",
                    price: v.price > 0 ? v.price : formData.base_price,
                    stock: Math.max(0, v.stock)
                }));

                const { success, error: variantError } = await createProductVariants(data.id, variantPayload);
                if (!success || variantError) {
                    throw new Error(variantError?.message || "Failed to create product variants");
                }
            }

            alert("Product created successfully!");
            router.push("/admin/products");

        } catch (err) {
            console.error("Error creating product:", err);
            alert(err instanceof Error ? err.message : "Failed to create product");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderGeneralInfo();
            case 2:
                return renderMedia();
            case 3:
                return renderPricing();
            default:
                return null;
        }
    };

    // Step 1: General Info
    const renderGeneralInfo = () => (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-bold">General Information</CardTitle>
                <CardDescription>Basic details about your product</CardDescription>
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
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="product-url-slug"
                    />
                    <p className="text-xs text-slate-500">This will be used in the product URL</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
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
                    {loadingCategories ? (
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading categories...
                        </div>
                    ) : (
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
                    )}
                </div>
            </CardContent>
        </Card>
    );

    // Step 2: Media
    const renderMedia = () => (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-bold">Product Media</CardTitle>
                <CardDescription>Upload up to 10 high-resolution images for this product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* File Upload Area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer group ${isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:bg-slate-50/50'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                    />
                    <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                        <CloudUpload className="h-6 w-6" />
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="font-bold text-slate-900">Drag & Drop product images here</h3>
                        <p className="text-xs text-slate-500">Supports JPG, PNG, and WebP. Recommended size: 1200x1600px. Maximum file size 5MB.</p>
                    </div>
                    <Button type="button" className="bg-blue-600 hover:bg-blue-700 font-bold px-6">
                        Browse Files
                    </Button>
                </div>

                {/* Image Grid */}
                {images.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Uploaded Images ({images.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {images.map((img) => (
                                <div
                                    key={img.id}
                                    className="group relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200"
                                >
                                    {/* Image Preview */}
                                    <Image
                                        src={img.url}
                                        alt={img.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                    />

                                    {/* Loading Overlay */}
                                    {img.isUploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                                        </div>
                                    )}

                                    {/* Uploaded Check */}
                                    {img.isUploaded && (
                                        <div className="absolute top-2 right-2 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <Check className="h-3 w-3 text-white" />
                                        </div>
                                    )}

                                    {/* Primary Badge */}
                                    {img.isPrimary && (
                                        <div className="absolute top-2 left-2">
                                            <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider rounded-sm px-1.5 py-0.5 border-0">
                                                Primary
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Hover Actions */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                        {!img.isPrimary && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPrimaryImage(img.id);
                                                }}
                                                className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-slate-700 hover:text-blue-600 transition-colors shadow-sm"
                                                title="Set as primary"
                                            >
                                                <Star className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage(img.id);
                                            }}
                                            className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-slate-700 hover:text-red-600 transition-colors shadow-sm"
                                            title="Remove"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* File Name */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                        <span className="text-[10px] text-white font-normal truncate block">{img.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500">
                            Click the star icon to set primary image. Primary image will be used as the main product image.
                        </p>
                    </div>
                )}

            </CardContent>
        </Card>
    );

    // Step 3: Pricing & Inventory
    const renderPricing = () => (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-bold">Pricing & Inventory</CardTitle>
                <CardDescription>Set product prices and availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="base_price">Base Price ($) *</Label>
                        <Input
                            id="base_price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.base_price || ""}
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

                {/* Variants */}
                <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-900">Variants & Stock</h4>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setVariants(prev => [
                                ...prev,
                                {
                                    id: `variant-${Date.now()}-${prev.length}`,
                                    size: sizePresets[2] || "M",
                                    color: "Black",
                                    price: formData.base_price,
                                    stock: 0
                                }
                            ])}
                        >
                            + Add variant
                        </Button>
                    </div>

                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <div className="grid grid-cols-5 gap-3 px-4 py-3 text-xs font-semibold text-slate-600 bg-slate-50">
                            <span>Size</span>
                            <span>Color</span>
                            <span>Variant Price</span>
                            <span>Stock</span>
                            <span className="text-right">Action</span>
                        </div>
                        <div className="divide-y">
                            {variants.map((variant) => (
                                <div key={variant.id} className="grid grid-cols-5 gap-3 px-4 py-3 items-center">
                                    {/* Size */}
                                    <Select
                                        value={variant.size}
                                        onValueChange={(val) => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, size: val } : v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sizePresets.map(sz => (
                                                <SelectItem key={sz} value={sz}>{sz}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Color */}
                                    <Input
                                        value={variant.color}
                                        onChange={(e) => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, color: e.target.value } : v))}
                                        placeholder="Color"
                                    />

                                    {/* Price */}
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={variant.price || ""}
                                        onChange={(e) => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, price: parseFloat(e.target.value) || 0 } : v))}
                                        placeholder={`Defaults to ${formData.base_price || 0}`}
                                    />

                                    {/* Stock */}
                                    <Input
                                        type="number"
                                        min="0"
                                        value={variant.stock}
                                        onChange={(e) => setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, stock: Math.max(0, parseInt(e.target.value) || 0) } : v))}
                                        placeholder="0"
                                    />

                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={variants.length === 1}
                                            onClick={() => setVariants(prev => prev.filter(v => v.id !== variant.id))}
                                            className="text-red-600"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">Mỗi dòng là một biến thể: Size, màu, giá riêng (nếu bỏ trống dùng Base Price), và tồn kho.</p>
                </div>

                <div className="border-t pt-4 space-y-4">
                    <h4 className="font-medium text-slate-900">Product Options</h4>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="featured"
                            checked={formData.featured}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
                        />
                        <Label htmlFor="featured" className="cursor-pointer">
                            Featured Product
                            <span className="text-slate-500 text-xs ml-2">(Show on homepage)</span>
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_new"
                            checked={formData.is_new}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new: !!checked }))}
                        />
                        <Label htmlFor="is_new" className="cursor-pointer">
                            Mark as New
                            <span className="text-slate-500 text-xs ml-2">(Show &quot;New&quot; badge)</span>
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="in_stock"
                            checked={formData.in_stock}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, in_stock: !!checked }))}
                        />
                        <Label htmlFor="in_stock" className="cursor-pointer">
                            In Stock
                        </Label>
                    </div>
                </div>

                {/* Summary */}
                <div className="border-t pt-4">
                    <h4 className="font-medium text-slate-900 mb-3">Product Summary</h4>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Name:</span>
                            <span className="font-medium">{formData.name || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Category:</span>
                            <span className="font-medium">
                                {categories.find(c => c.id === formData.category_id)?.name || "-"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Price:</span>
                            <span className="font-medium">${formData.base_price.toFixed(2)}</span>
                        </div>
                        {formData.sale_price && (
                            <div className="flex justify-between">
                                <span className="text-slate-600">Sale Price:</span>
                                <span className="font-medium text-emerald-600">${formData.sale_price.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-slate-600">Images:</span>
                            <span className="font-medium">{images.length} uploaded</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Variants:</span>
                            <span className="font-medium">{variants.length} variants</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Total Stock:</span>
                            <span className="font-medium">
                                {variants.reduce((sum, v) => sum + (v.stock || 0), 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Breadcrumbs & Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Link href="/admin/products" className="hover:text-slate-900 cursor-pointer">Products</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="hover:text-slate-900 cursor-pointer">Add New Product</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-slate-900">
                        {currentStep === 1 ? "General Info" : currentStep === 2 ? "Media" : "Pricing & Inventory"}
                    </span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <Link href="/admin/products">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
                </div>
                <p className="text-slate-500 text-sm">
                    Step {currentStep} of 3: {currentStep === 1 ? "General Information" : currentStep === 2 ? "Product Media" : "Pricing & Inventory"}
                </p>
            </div>

            {/* Progress Stepper */}
            <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between text-sm font-medium text-slate-600 mb-2">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => setCurrentStep(1)}
                            className={`flex items-center gap-2 ${currentStep === 1 ? 'text-blue-800 font-bold border-b-2 border-blue-800 pb-0.5' : currentStep > 1 ? 'text-blue-600' : 'text-slate-400'}`}
                        >
                            {currentStep > 1 && <Check className="h-4 w-4 text-emerald-500" />}
                            <span>General Info</span>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>
                        <button
                            onClick={() => validateStep(1) && setCurrentStep(2)}
                            className={`flex items-center gap-2 ${currentStep === 2 ? 'text-blue-800 font-bold border-b-2 border-blue-800 pb-0.5' : currentStep > 2 ? 'text-blue-600' : 'text-slate-400'}`}
                            disabled={!validateStep(1)}
                        >
                            {currentStep > 2 && <Check className="h-4 w-4 text-emerald-500" />}
                            <span>Media</span>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>
                        <button
                            onClick={() => validateStep(1) && validateStep(2) && setCurrentStep(3)}
                            className={`flex items-center gap-2 ${currentStep === 3 ? 'text-blue-800 font-bold border-b-2 border-blue-800 pb-0.5' : 'text-slate-400'}`}
                            disabled={!validateStep(1) || !validateStep(2)}
                        >
                            <span>Pricing & Inventory</span>
                        </button>
                    </div>
                    <span className="text-blue-600 font-bold">{getProgress()}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
                        style={{ width: `${getProgress()}%` }}
                    />
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Your progress is automatically saved as you go.</p>
            </div>

            {/* Main Content */}
            {renderStepContent()}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 pb-8">
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={currentStep === 1 ? () => router.push('/admin/products') : handleBack}
                >
                    <ArrowLeft className="h-4 w-4" />
                    {currentStep === 1 ? "Cancel" : "Back"}
                </Button>
                <div className="flex items-center gap-3">
                    {currentStep === 3 ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !validateStep(3)}
                            className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 px-6"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Create Product
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            disabled={!validateStep(currentStep)}
                            className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 px-6"
                        >
                            Continue
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
