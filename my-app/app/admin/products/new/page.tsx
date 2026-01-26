"use client";

import * as React from "react";
import {
    ArrowLeft,
    CloudUpload,
    X,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Mock Uploaded Images
const uploadedImages = [
    { id: 1, src: "/placeholder/hoodie-front.jpg", name: "hoodie_front.jpg", primary: true },
    { id: 2, src: "/placeholder/hoodie-back.jpg", name: "hoodie_back.jpg", primary: false },
    { id: 3, src: "/placeholder/hoodie-detail.jpg", name: "hoodie_detail.jpg", primary: false },
    { id: 4, src: "/placeholder/hoodie-model.jpg", name: "hoodie_model.jpg", primary: false },
];

export default function AddProductPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Breadcrumbs & Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="hover:text-slate-900 cursor-pointer">Products</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="hover:text-slate-900 cursor-pointer">Add New Product</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-slate-900">Media</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <Link href="/admin/products">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
                </div>
                <p className="text-slate-500 text-sm">Step 2 of 3: Product Media</p>
            </div>

            {/* Progress Stepper */}
            <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between text-sm font-medium text-slate-600 mb-2">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 text-blue-600 cursor-pointer">
                            <span>General Info</span>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                        <div className="flex items-center gap-2 text-blue-800 font-bold border-b-2 border-blue-800 pb-0.5">
                            <span>Media</span>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <span>Pricing & Inventory</span>
                        </div>
                    </div>
                    <span className="text-blue-600 font-bold">66%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-2/3 transition-all duration-500 ease-in-out" />
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Your progress is automatically saved as you go.</p>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Product Media</CardTitle>
                    <CardDescription>Upload up to 10 high-resolution images for this product.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                        <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                            <CloudUpload className="h-6 w-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="font-bold text-slate-900">Drag & Drop product images here</h3>
                            <p className="text-xs text-slate-500">Supports JPG, PNG, and WebP. Recommended size: 1200x1600px. Maximum file size 5MB.</p>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700 font-bold px-6">Browse Files</Button>
                    </div>

                    {/* Image Grid */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Uploaded Images ({uploadedImages.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {uploadedImages.map((img) => (
                                <div key={img.id} className="group relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                    {/* Mock Image Content */}
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold text-4xl bg-slate-100">
                                        {/* In real app, this would be an <Image /> */}
                                        <div className="w-full h-full bg-slate-200 flex items-end p-2">
                                            <span className="text-[10px] text-slate-500 font-normal truncate w-full">{img.name}</span>
                                        </div>
                                    </div>

                                    {/* Primary Badge */}
                                    {img.primary && (
                                        <div className="absolute top-2 left-2">
                                            <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider rounded-sm px-1.5 py-0.5 border-0">
                                                Primary
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Delete Button */}
                                    <button className="absolute top-2 right-2 h-6 w-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 pb-8">
                <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="font-bold bg-slate-100 hover:bg-slate-200 border-0 text-slate-700">Save as Draft</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 px-6">
                        Continue to Pricing
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
