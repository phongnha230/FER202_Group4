'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Review, reviews } from '@/mock/reviews';

export default function ProductReviews() {
    const [isExpanded, setIsExpanded] = useState(false);

    // Show 3 reviews initially, or all if expanded
    const displayedReviews = isExpanded ? reviews : reviews.slice(0, 3);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
        // If collapsing, maybe scroll back to top of reviews? 
        // For now just state toggle is enough per user request "tóm tắt lại"
    };

    return (
        <div className="mt-16 border-t border-gray-200 pt-10" id="reviews-section">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Customer Reviews ({reviews.length})
            </h2>

            <div className="space-y-8">
                {displayedReviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0">
                        <div className="flex items-start gap-4">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                                <Image
                                    src={review.avatar}
                                    alt={review.userName}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-gray-900">{review.userName}</h3>
                                    </div>
                                    <span className="text-xs text-gray-500">{review.date}</span>
                                </div>
                                <div className="flex items-center mb-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                    {review.content}
                                </p>

                                {review.images && review.images.length > 0 && (
                                    <div className="flex gap-2 mb-4">
                                        {review.images.map((img, idx) => (
                                            <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-100">
                                                <Image
                                                    src={img}
                                                    alt="Review image"
                                                    fill
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
        </div>
    );
}
