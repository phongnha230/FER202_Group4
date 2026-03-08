"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ExternalLink,
    ImageIcon,
    Loader2,
    MessageSquareQuote,
    Search,
    ShoppingBag,
    Star,
    UserRound,
} from "lucide-react";
import { getAdminReviews } from "@/lib/api/review.api";
import { AdminReviewWithDetails } from "@/types/review.type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const FIT_LABELS: Record<string, string> = {
    "0": "Runs Small",
    "50": "True to Size",
    "100": "Runs Large",
};

const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: VIETNAM_TIMEZONE,
    }).format(new Date(dateString));
}

function renderStars(rating: number) {
    return Array.from({ length: 5 }).map((_, index) => (
        <Star
            key={index}
            className={`h-4 w-4 ${index < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
    ));
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<AdminReviewWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [photoFilter, setPhotoFilter] = useState("all");

    useEffect(() => {
        async function loadReviews() {
            try {
                setLoading(true);
                const { data, error } = await getAdminReviews();

                if (error) {
                    throw error;
                }

                setReviews(data);
            } catch (err) {
                console.error("Error loading admin reviews:", err);
                setError(err instanceof Error ? err.message : "Failed to load reviews");
            } finally {
                setLoading(false);
            }
        }

        loadReviews();
    }, []);

    const filteredReviews = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return reviews.filter((review) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                review.title?.toLowerCase().includes(normalizedSearch) ||
                review.content?.toLowerCase().includes(normalizedSearch) ||
                review.user?.full_name?.toLowerCase().includes(normalizedSearch) ||
                review.product?.name?.toLowerCase().includes(normalizedSearch) ||
                review.product?.slug?.toLowerCase().includes(normalizedSearch) ||
                review.order?.id?.toLowerCase().includes(normalizedSearch);

            const matchesRating = ratingFilter === "all" || review.rating === Number(ratingFilter);
            const hasPhotos = (review.images?.length || 0) > 0;
            const matchesPhotos =
                photoFilter === "all" ||
                (photoFilter === "with_photos" && hasPhotos) ||
                (photoFilter === "without_photos" && !hasPhotos);

            return matchesSearch && matchesRating && matchesPhotos;
        });
    }, [photoFilter, ratingFilter, reviews, searchTerm]);

    const stats = useMemo(() => {
        const totalReviews = reviews.length;
        const averageRating = totalReviews
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        const withPhotos = reviews.filter((review) => (review.images?.length || 0) > 0).length;

        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        const recentReviews = reviews.filter((review) => new Date(review.created_at) >= last30Days).length;

        return {
            totalReviews,
            averageRating,
            withPhotos,
            recentReviews,
        };
    }, [reviews]);

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                Failed to load review data: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">REVIEWS</h1>
                    <p className="text-slate-500">
                        Review every customer rating with product details, customer details, and a direct link to the live review.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Total Reviews
                        </CardTitle>
                        <MessageSquareQuote className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-slate-900">{stats.totalReviews}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Average Rating
                        </CardTitle>
                        <Star className="h-4 w-4 text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-slate-900">{stats.averageRating.toFixed(1)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Reviews With Photos
                        </CardTitle>
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-slate-900">{stats.withPhotos}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            New In 30 Days
                        </CardTitle>
                        <ShoppingBag className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-slate-900">{stats.recentReviews}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-[420px]">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="pl-10"
                        placeholder="Search by customer, product, title, content, or order id..."
                    />
                </div>
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                        <SelectTrigger className="w-full bg-white md:w-[140px]">
                            <SelectValue placeholder="Rating" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Ratings</SelectItem>
                            <SelectItem value="5">5 Stars</SelectItem>
                            <SelectItem value="4">4 Stars</SelectItem>
                            <SelectItem value="3">3 Stars</SelectItem>
                            <SelectItem value="2">2 Stars</SelectItem>
                            <SelectItem value="1">1 Star</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={photoFilter} onValueChange={setPhotoFilter}>
                        <SelectTrigger className="w-full bg-white md:w-[180px]">
                            <SelectValue placeholder="Photos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Reviews</SelectItem>
                            <SelectItem value="with_photos">With Photos</SelectItem>
                            <SelectItem value="without_photos">Without Photos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-xl border bg-white">
                <div className="w-full overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-[420px]">REVIEW</TableHead>
                                <TableHead>CUSTOMER</TableHead>
                                <TableHead>PRODUCT</TableHead>
                                <TableHead>ORDER</TableHead>
                                <TableHead>SUBMITTED</TableHead>
                                <TableHead className="text-right">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReviews.length > 0 ? (
                                filteredReviews.map((review) => {
                                    const canOpenStorefront = review.product?.slug && review.product.status === "active";
                                    const reviewLink = canOpenStorefront
                                        ? `/product/${review.product?.slug}#review-${review.id}`
                                        : null;
                                    const productLink = canOpenStorefront
                                        ? `/product/${review.product?.slug}`
                                        : null;

                                    return (
                                        <TableRow key={review.id} className="align-top">
                                            <TableCell>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            {renderStars(review.rating)}
                                                        </div>
                                                        <Badge variant="outline" className="border-slate-200 text-slate-600">
                                                            {review.rating}/5
                                                        </Badge>
                                                        {review.fit_rating !== null && review.fit_rating !== undefined && (
                                                            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                                                {FIT_LABELS[String(review.fit_rating)]}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-slate-900">
                                                            {review.title || "No title"}
                                                        </p>
                                                        <p className="line-clamp-4 text-sm leading-6 text-slate-600">
                                                            {review.content}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                        <span>Helpful: {review.helpful_count || 0}</span>
                                                        <span>Not helpful: {review.not_helpful_count || 0}</span>
                                                    </div>
                                                    {(review.images?.length || 0) > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {review.images.map((imageUrl, index) => (
                                                                <div
                                                                    key={`${review.id}-${index}`}
                                                                    className="relative h-14 w-14 overflow-hidden rounded-md border bg-slate-100"
                                                                >
                                                                    <Image
                                                                        src={imageUrl}
                                                                        alt={`Review image ${index + 1}`}
                                                                        fill
                                                                        className="object-cover"
                                                                        sizes="56px"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                                            <UserRound className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            {review.user?.id ? (
                                                                <Link
                                                                    href={`/admin/customers/${review.user.id}`}
                                                                    className="block truncate font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                                                                >
                                                                    {review.user.full_name || "Guest customer"}
                                                                </Link>
                                                            ) : (
                                                                <p className="block truncate font-semibold text-slate-900">Guest customer</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-3">
                                                    <div className="relative h-14 w-14 overflow-hidden rounded-md border bg-slate-100">
                                                        {review.product?.image ? (
                                                            <Image
                                                                src={review.product.image}
                                                                alt={review.product.name}
                                                                fill
                                                                className="object-cover"
                                                                sizes="56px"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                                                IMG
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 space-y-1">
                                                        {review.product?.id ? (
                                                            <Link
                                                                href={`/admin/products/${review.product.id}/edit`}
                                                                className="block truncate font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                                                            >
                                                                {review.product.name}
                                                            </Link>
                                                        ) : (
                                                            <p className="block truncate font-semibold text-slate-900">Deleted product</p>
                                                        )}
                                                        <p className="truncate text-xs text-slate-500">
                                                            {review.product?.slug || "No slug"}
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                review.product?.status === "hidden"
                                                                    ? "border-orange-200 text-orange-700"
                                                                    : review.product?.status === "active"
                                                                        ? "border-emerald-200 text-emerald-700"
                                                                        : "border-slate-200 text-slate-500"
                                                            }
                                                        >
                                                            {review.product?.status === "hidden"
                                                                ? "Hidden"
                                                                : review.product?.status === "active"
                                                                    ? "Active"
                                                                    : "Unknown"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2 text-sm text-slate-600">
                                                    <p className="font-semibold text-slate-900">
                                                        #{review.order?.id?.slice(0, 8).toUpperCase() || "N/A"}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                                                            {review.order?.order_status || "Unknown"}
                                                        </Badge>
                                                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                                            {review.order?.payment_status || "Unknown"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {formatDate(review.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {reviewLink && (
                                                        <Link href={reviewLink} target="_blank">
                                                            <Button variant="outline" size="icon" className="h-9 w-9" title="Open exact review on storefront">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {productLink && (
                                                        <Link href={productLink} target="_blank">
                                                            <Button className="h-9 bg-blue-600 px-3 text-xs font-bold uppercase tracking-wider hover:bg-blue-700">
                                                                View product
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                        No matching reviews found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
