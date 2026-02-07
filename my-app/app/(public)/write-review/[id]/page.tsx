"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Star, Camera, X, ThumbsUp, ThumbsDown, Info, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/user.store";
import { createReview } from "@/services/review.service";
import clsx from "clsx";

interface ProductInfo {
    id: string;
    name: string;
    image: string;
    slug?: string;
    size: string;
    color: string;
}

export default function WriteReviewPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const { user, isAuthenticated } = useUserStore();

    const [product, setProduct] = useState<ProductInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Fetch order details to get product info
    useEffect(() => {
        async function fetchOrderProduct() {
            if (!orderId) return;

            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        id,
                        order_items (
                            id,
                            variant:product_variants (
                                size,
                                color,
                                product:products (
                                    id,
                                    name,
                                    image,
                                    slug
                                )
                            )
                        )
                    `)
                    .eq('id', orderId)
                    .single();

                if (error) {
                    console.error('Error fetching order:', error);
                    return;
                }

                // Get the first item from the order
                const firstItem = (data?.order_items as unknown[])?.[0] as {
                    variant?: {
                        size?: string;
                        color?: string;
                        product?: {
                            id?: string;
                            name?: string;
                            image?: string;
                            slug?: string;
                        };
                    };
                } | undefined;

                if (firstItem?.variant?.product) {
                    setProduct({
                        id: firstItem.variant.product.id || 'unknown',
                        name: firstItem.variant.product.name || 'Unknown Product',
                        image: firstItem.variant.product.image || '/images/product-mock.jpg',
                        slug: firstItem.variant.product.slug,
                        size: firstItem.variant.size || 'N/A',
                        color: firstItem.variant.color || 'N/A',
                    });
                }
            } catch (err) {
                console.error('Failed to fetch order product:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchOrderProduct();
    }, [orderId]);

    // Handle submit review
    const handleSubmitReview = async () => {
        // Validation
        if (!isAuthenticated || !user) {
            alert('Vui lòng đăng nhập để đánh giá');
            router.push('/login');
            return;
        }

        if (!product || product.id === 'unknown') {
            alert('Không tìm thấy thông tin sản phẩm');
            return;
        }

        if (rating === 0) {
            alert('Vui lòng chọn số sao đánh giá');
            return;
        }

        if (title.length < 3) {
            alert('Tiêu đề đánh giá phải có ít nhất 3 ký tự');
            return;
        }

        if (content.length < 20) {
            alert('Nội dung đánh giá phải có ít nhất 20 ký tự');
            return;
        }

        setSubmitting(true);
        try {
            const { data, error } = await createReview(user.id, {
                order_id: orderId,
                product_id: product.id,
                rating,
                title,
                content,
                fit_rating: fit,
                images,
            });

            if (error) {
                console.error('Error creating review:', error);
                alert(`Lỗi: ${error.message}`);
                return;
            }

            if (data) {
                setSubmitted(true);
                // Redirect to product page after 2 seconds
                setTimeout(() => {
                    if (product.slug) {
                        router.push(`/product/${product.slug}`);
                    } else {
                        router.push('/my-orders');
                    }
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to submit review:', err);
            alert('Đã có lỗi xảy ra khi gửi đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    // Fallback product if not loaded
    const displayProduct = product || {
        id: 'unknown',
        name: 'Loading...',
        image: '/images/product-mock.jpg',
        size: 'N/A',
        color: 'N/A',
    };

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [fit, setFit] = useState<0 | 50 | 100>(50); // 0 (Small), 50 (True to Size), 100 (Large)
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [images, setImages] = useState<string[]>([]);

    const handleRatingClick = (val: number) => setRating(val);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (images.length + files.length > 5) {
            alert('Maximum 5 images allowed');
            return;
        }

        // Import function dynamically or assume global import if available, 
        // but here we know we should use the service.
        // For Client Component, better to handle upload state.
        
        const fileArray = Array.from(files);
        
        try {
            // Using Base64 just for preview for now is fine, BUT user wants REAL upload.
            // Let's assume we upload immediately for this demo to get the URL, 
            // OR we can upload on SUBMIT. Uploading on submit is better for avoiding orphan files if user cancels.
            // However, to keep it simple and fulfill "upload service integration", let's upload immediately and show spinner if needed.
            
            // For this UI, let's keep base64 for preview, but ALSO upload to get URL?
            // Actually, the `CreateReviewRequest` expects `images: string[]`. These strings should be URLs.
            // So we MUST upload.
            
            // To avoid blocking UI, let's show preview immediately via Base64, and background upload?
            // Or just simple upload and wait.
            
            // Simplified: Upload immediately.
            const { uploadFiles } = await import('@/services/upload.service');

            const results = await uploadFiles(fileArray, 'reviews'); // Assume bucket 'reviews' exists or fallback to 'uploads'
             
            const newUrls = results
                .filter(res => res.url && !res.error)
                .map(res => res.url as string);

            setImages(prev => [...prev, ...newUrls].slice(0, 5));
            
            const errors = results.filter(res => res.error);
            if (errors.length > 0) {
                 console.error("Some uploads failed", errors);
                 alert(`Failed to upload ${errors.length} images.`);
            }

        } catch (error) {
            console.error("Upload error", error);
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const fitLabel = useMemo(() => {
        if (fit < 40) return "Runs Small";
        if (fit > 60) return "Runs Large";
        return "True to Size";
    }, [fit]);

    return (
        <div className="container-custom py-12 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Left Column: Form */}
                <div className="lg:col-span-7 space-y-10">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic text-slate-900">RATE YOUR PICKUP</h1>
                        <p className="text-slate-500 font-medium">Tell us about the fit, feel, and quality of your new gear.</p>
                    </div>

                    {/* Product Summary Card */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-6 shadow-sm">
                        <div className="relative h-20 w-20 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                            {loading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                </div>
                            ) : (
                                <Image src={displayProduct.image} alt={displayProduct.name} fill sizes="80px" className="object-cover" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">{displayProduct.name}</h3>
                            <p className="text-sm text-slate-500">Size {displayProduct.size} • Order #{orderId?.substring(0, 8) || '45920'}</p>
                        </div>
                    </div>

                    {/* Rating Section */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Overall Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform active:scale-95"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => handleRatingClick(star)}
                                >
                                    <Star
                                        className={clsx(
                                            "w-10 h-10 transition-colors",
                                            (hoverRating || rating) >= star ? "fill-blue-600 text-blue-600" : "text-slate-200"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fit Section */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">HOW&apos;S THE FIT?</label>
                            <span className="text-sm font-bold text-blue-700">{fitLabel}</span>
                        </div>
                        <div className="relative pt-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="50"
                                value={fit}
                                onChange={(e) => setFit(parseInt(e.target.value) as 0 | 50 | 100)}
                                className="w-full h-[6px] bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-700 relative z-10 
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-800 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-none
                                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-blue-800 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full shadow-none"
                            />

                            <div className="flex justify-between mt-5 text-[9px] font-bold uppercase tracking-widest text-slate-300">
                                <span className={clsx(fit === 0 && "text-slate-400")}>Runs Small</span>
                                <span className={clsx(fit === 50 && "text-slate-400")}>True to Size</span>
                                <span className={clsx(fit === 100 && "text-slate-400")}>Runs Large</span>
                            </div>
                        </div>
                    </div>

                    {/* Title & Review */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Review Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Best cargos I've ever owned"
                                className="w-full border-b border-slate-200 py-3 text-lg font-medium focus:outline-none focus:border-blue-600 transition-colors placeholder:text-slate-300"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 text-right">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 text-left block">Your Review</label>
                            <textarea
                                placeholder="How was the quality? What did you like or dislike?"
                                rows={4}
                                className="w-full border border-slate-100 rounded-xl p-4 text-slate-700 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-slate-400"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Minimum 20 characters</span>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Show off your fit</label>

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group">
                                        <Image src={img} alt={`Upload ${idx}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                                        <button
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute top-2 right-2 p-1 bg-white/80 backdrop-blur-sm rounded-full text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Large Upload Action */}
                        {images.length < 5 && (
                            <div
                                onClick={() => document.getElementById('image-upload')?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group"
                            >
                                <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                    <Camera className="w-6 h-6 text-blue-600" />
                                </div>
                                <h4 className="font-bold text-blue-600 text-[10px] tracking-[0.2em] uppercase">ADD PHOTO</h4>
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-8 pt-6">
                        {submitted ? (
                            <div className="flex items-center gap-3 text-emerald-600">
                                <CheckCircle className="w-6 h-6" />
                                <span className="font-bold">Đánh giá đã được gửi thành công! Đang chuyển hướng...</span>
                            </div>
                        ) : (
                            <>
                                <Button
                                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold h-14 px-12 rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-200 disabled:opacity-50"
                                    onClick={handleSubmitReview}
                                    disabled={submitting || loading}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            ĐANG GỬI...
                                        </>
                                    ) : (
                                        'POST REVIEW'
                                    )}
                                </Button>
                                <button
                                    className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                    onClick={() => router.back()}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Column: Live Preview */}
                <div className="lg:col-span-5 relative">
                    <div className="sticky top-24 space-y-6">
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            Live Preview
                        </div>

                        {/* Preview Card */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 max-w-md mx-auto relative overflow-hidden">
                            {/* User Info */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                        <div className="w-full h-full bg-slate-200 animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">You</h4>
                                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-black uppercase">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <X className="w-2 h-2 text-white rotate-45 stroke-[4]" />
                                            </div>
                                            Verified Buyer
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 uppercase">Just now</span>
                            </div>

                            {/* Rating Stars */}
                            <div className="flex gap-1 mb-4">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                        key={s}
                                        className={clsx(
                                            "w-4 h-4",
                                            s <= (rating || 4) ? "fill-blue-600 text-blue-600" : "text-slate-200"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Content */}
                            <h2 className="text-xl font-black text-slate-900 mb-3 leading-tight">
                                {title || "Best cargos I've ever owned"}
                            </h2>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                {content || "Honestly, I was skeptical about the fit at first, but these are perfect. The material feels heavy and durable, exactly what I wanted for a daily driver. Pockets are super functional too."}
                            </p>

                            {/* Review Image (Mock/Uploaded) */}
                            <div className="relative aspect-[4/3] w-32 bg-slate-100 rounded-xl overflow-hidden mb-6 group">
                                <Image
                                    src={images.length > 0 ? images[0] : displayProduct.image}
                                    alt="User upload preview"
                                    fill
                                    sizes="128px"
                                    className="object-cover transition-transform group-hover:scale-110"
                                />
                            </div>

                            {/* Review Footer */}
                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Was this helpful?</span>
                                <div className="flex gap-4">
                                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold">0</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                                        <ThumbsDown className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold">0</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tip Card */}
                        <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-6 max-w-md mx-auto flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <Info className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h5 className="font-bold text-blue-900 text-xs mb-1">Pro Tip</h5>
                                <p className="text-[11px] text-blue-700/70 leading-relaxed">
                                    Mentioning your height and weight helps others find their perfect size!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
