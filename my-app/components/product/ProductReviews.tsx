'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, ThumbsUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProductReviews, updateReview, deleteReview } from '@/lib/api/review.api';
import { ReviewWithUser } from '@/types/review.type';
import { useUserStore } from '@/store/user.store';

interface ProductReviewsProps {
    productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { user, isAuthenticated } = useUserStore();

    useEffect(() => {
        async function loadReviews() {
            try {
                setLoading(true);
                const { data, error } = await getProductReviews(productId);
                
                if (error) throw error;
                
                setReviews(data);
            } catch (err) {
                console.error('Error loading reviews:', err);
                setError(err instanceof Error ? err.message : 'Failed to load reviews');
            } finally {
                setLoading(false);
            }
        }

        loadReviews();
    }, [productId]);

    // Show 3 reviews initially, or all if expanded
    const displayedReviews = isExpanded ? reviews : reviews.slice(0, 3);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handleStartEdit = (review: ReviewWithUser) => {
        setEditingReviewId(review.id);
        setEditTitle(review.title || '');
        setEditContent(review.content || '');
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
        setEditTitle('');
        setEditContent('');
    };

    const handleSaveEdit = async () => {
        if (!editingReviewId || !isAuthenticated || !user) {
            alert('Vui lòng đăng nhập để chỉnh sửa đánh giá');
            return;
        }

        if (editTitle.trim().length < 3) {
            alert('Tiêu đề phải có ít nhất 3 ký tự');
            return;
        }

        if (editContent.trim().length < 20) {
            alert('Nội dung phải có ít nhất 20 ký tự');
            return;
        }

        try {
            setSavingEdit(true);
            const { error } = await updateReview(editingReviewId, user.id, {
                title: editTitle,
                content: editContent,
            });

            if (error) {
                console.error('Error updating review:', error);
                alert('Không thể cập nhật đánh giá, vui lòng thử lại');
                return;
            }

            setReviews((prev) =>
                prev.map((r) =>
                    r.id === editingReviewId ? { ...r, title: editTitle, content: editContent } : r
                )
            );

            handleCancelEdit();
        } catch (err) {
            console.error('Failed to update review:', err);
            alert('Đã có lỗi xảy ra khi cập nhật đánh giá');
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!isAuthenticated || !user) {
            alert('Vui lòng đăng nhập để xóa đánh giá');
            return;
        }

        const confirmed = window.confirm('Bạn có chắc muốn xóa đánh giá này không?');
        if (!confirmed) return;

        try {
            setDeletingId(reviewId);
            const { error } = await deleteReview(reviewId, user.id);

            if (error) {
                console.error('Error deleting review:', error);
                alert('Không thể xóa đánh giá, vui lòng thử lại');
                return;
            }

            setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        } catch (err) {
            console.error('Failed to delete review:', err);
            alert('Đã có lỗi xảy ra khi xóa đánh giá');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="mt-16 border-t border-gray-200 pt-10">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-16 border-t border-gray-200 pt-10">
                <div className="text-center text-red-600 py-8">
                    <p>Error loading reviews: {error}</p>
                </div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="mt-16 border-t border-gray-200 pt-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Customer Reviews
                </h2>
                <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            </div>
        );
    }

    return (
        <div className="mt-16 border-t border-gray-200 pt-10" id="reviews-section">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Customer Reviews ({reviews.length})
            </h2>

            <div className="space-y-8">
                {displayedReviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0">
                        <div className="flex items-start gap-4">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-200">
                                {review.user?.avatar_url ? (
                                    <Image
                                        src={review.user.avatar_url}
                                        alt={review.user.full_name || 'User'}
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                        {review.user?.full_name?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-gray-900">
                                            {review.user?.full_name || 'Anonymous'}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                        {isAuthenticated && user && review.user?.id === user.id && (
                                            <div className="flex items-center gap-2">
                                                {editingReviewId === review.id ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="h-7 px-3 text-xs"
                                                            onClick={handleSaveEdit}
                                                            disabled={savingEdit}
                                                        >
                                                            {savingEdit ? 'Saving...' : 'Save'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 px-3 text-xs"
                                                            onClick={handleCancelEdit}
                                                            disabled={savingEdit}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="text-xs text-blue-600 hover:underline"
                                                            onClick={() => handleStartEdit(review)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="text-xs text-red-600 hover:underline"
                                                            onClick={() => handleDelete(review.id)}
                                                            disabled={deletingId === review.id}
                                                        >
                                                            {deletingId === review.id ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center mb-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                                {editingReviewId === review.id ? (
                                    <div className="space-y-2 mb-4">
                                        <input
                                            type="text"
                                            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            placeholder="Tiêu đề đánh giá"
                                        />
                                        <textarea
                                            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                                            rows={3}
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            placeholder="Nội dung đánh giá"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        {review.title && (
                                            <h4 className="font-semibold text-sm mb-1">{review.title}</h4>
                                        )}
                                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                            {review.content}
                                        </p>
                                    </>
                                )}

                                {review.images && review.images.length > 0 && (
                                    <div className="flex gap-2 mb-4">
                                        {review.images.map((img: string, idx: number) => (
                                            <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-100">
                                                <Image
                                                    src={img}
                                                    alt="Review image"
                                                    fill
                                                    sizes="80px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors">
                                        <ThumbsUp className="w-3 h-3" />
                                        Helpful
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {reviews.length > 3 && (
                <div className="mt-8 text-center border-t border-gray-100 pt-8">
                    <Button
                        variant="outline"
                        onClick={toggleExpand}
                        className="min-w-[200px] border-black text-black hover:bg-black hover:text-white transition-colors"
                    >
                        {isExpanded ? 'Show Less (Summary)' : `View All (${reviews.length})`}
                    </Button>

                    {isExpanded && (
                        <p
                            className="mt-4 text-xs text-gray-400 cursor-pointer hover:text-black hover:underline"
                            onClick={() => {
                                setIsExpanded(false);
                                document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            Back to Product View
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
