import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Review, ReviewReaction } from '@/types/database.types';
import {
  AdminReviewWithDetails,
  ReviewWithUser,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewStats,
  AddReactionRequest,
  FitRatingStats,
} from '@/types/review.type';

function normalizeRelation<T>(value: T | T[] | null | undefined): T | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

/**
 * Create a new review
 * Only allowed if order status is 'completed' or 'delivered'
 */
export async function createReview(
  userId: string,
  request: CreateReviewRequest
): Promise<{ data: Review | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userId,
      order_id: request.order_id,
      product_id: request.product_id,
      rating: request.rating,
      title: request.title,
      content: request.content,
      fit_rating: request.fit_rating || null,
      images: request.images || [],
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Get all reviews for a product with user details
 */
export async function getProductReviews(
  productId: string,
  currentUserId?: string
): Promise<{ data: ReviewWithUser[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:profiles(id, full_name, avatar_url)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error };
  }

  const reviewIds = (data || []).map((review: { id: string }) => review.id);
  let reactions: ReviewReaction[] = [];

  if (reviewIds.length > 0) {
    const { data: reactionRows } = await supabase
      .from('review_reactions')
      .select('review_id, reaction_type, user_id')
      .in('review_id', reviewIds);

    reactions = (reactionRows as ReviewReaction[] | null) || [];
  }

  const transformedReviews: ReviewWithUser[] = (data || []).map((review: ReviewWithUser) => {
    const reviewReactions = reactions.filter((reaction) => reaction.review_id === review.id);
    const helpful_count = reviewReactions.filter((reaction) => reaction.reaction_type === 'helpful').length;
    const not_helpful_count = reviewReactions.filter((reaction) => reaction.reaction_type === 'not_helpful').length;
    const user_reaction = currentUserId
      ? reviewReactions.find((reaction) => reaction.user_id === currentUserId)?.reaction_type || null
      : null;

    return {
      ...review,
      user: normalizeRelation(review.user),
      helpful_count,
      not_helpful_count,
      user_reaction,
    };
  });

  return { data: transformedReviews, error: null };
}

/**
 * Get all reviews by a user
 */
export async function getUserReviews(userId: string): Promise<{ data: ReviewWithUser[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      product:products(id, name, image)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error };
  }

  return { data: data || [], error: null };
}

/**
 * Get all reviews for admin with customer, product, and order details
 */
export async function getAdminReviews(): Promise<{ data: AdminReviewWithDetails[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:profiles(id, full_name, avatar_url),
      product:products(id, name, slug, image, status),
      order:orders(id, order_status, payment_status, total_price, created_at)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error };
  }

  const reviewIds = (data || []).map((review: { id: string }) => review.id);
  let reactions: ReviewReaction[] = [];

  if (reviewIds.length > 0) {
    const { data: reactionRows } = await supabase
      .from('review_reactions')
      .select('review_id, reaction_type, user_id')
      .in('review_id', reviewIds);

    reactions = (reactionRows as ReviewReaction[] | null) || [];
  }

  const transformedReviews: AdminReviewWithDetails[] = (data || []).map((review: AdminReviewWithDetails) => {
    const reviewReactions = reactions.filter((reaction) => reaction.review_id === review.id);

    return {
      ...review,
      user: normalizeRelation(review.user),
      product: normalizeRelation(review.product),
      order: normalizeRelation(review.order),
      helpful_count: reviewReactions.filter((reaction) => reaction.reaction_type === 'helpful').length,
      not_helpful_count: reviewReactions.filter((reaction) => reaction.reaction_type === 'not_helpful').length,
      user_reaction: null,
    };
  });

  return { data: transformedReviews, error: null };
}

/**
 * Update a review
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  request: UpdateReviewRequest
): Promise<{ data: Review | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      ...request,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string, userId: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId);

  return { error };
}

/**
 * Add or update a reaction to a review
 */
export async function addReaction(
  userId: string,
  request: AddReactionRequest
): Promise<{ data: ReviewReaction | null; error: PostgrestError | null }> {
  const { data: existingReaction } = await supabase
    .from('review_reactions')
    .select('*')
    .eq('review_id', request.review_id)
    .eq('user_id', userId)
    .single();

  if (existingReaction) {
    if (existingReaction.reaction_type === request.reaction_type) {
      const { data, error } = await supabase
        .from('review_reactions')
        .delete()
        .eq('id', existingReaction.id)
        .select()
        .single();
      return { data, error };
    }

    const { data, error } = await supabase
      .from('review_reactions')
      .update({ reaction_type: request.reaction_type })
      .eq('id', existingReaction.id)
      .select()
      .single();
    return { data, error };
  }

  const { data, error } = await supabase
    .from('review_reactions')
    .insert({
      review_id: request.review_id,
      user_id: userId,
      reaction_type: request.reaction_type,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Get review statistics for a product
 */
export async function getReviewStats(productId: string): Promise<{ data: ReviewStats | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (error) {
    return { data: null, error };
  }

  if (!data || data.length === 0) {
    return {
      data: {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
      error: null,
    };
  }

  const total_reviews = data.length;
  const sum = data.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0);
  const average_rating = sum / total_reviews;

  const rating_distribution = {
    1: data.filter((review: { rating: number }) => review.rating === 1).length,
    2: data.filter((review: { rating: number }) => review.rating === 2).length,
    3: data.filter((review: { rating: number }) => review.rating === 3).length,
    4: data.filter((review: { rating: number }) => review.rating === 4).length,
    5: data.filter((review: { rating: number }) => review.rating === 5).length,
  };

  return {
    data: {
      average_rating: Math.round(average_rating * 10) / 10,
      total_reviews,
      rating_distribution,
    },
    error: null,
  };
}

/**
 * Get fit rating statistics for a product
 */
export async function getFitRatingStats(productId: string): Promise<{ data: FitRatingStats | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .select('fit_rating')
    .eq('product_id', productId)
    .not('fit_rating', 'is', null);

  if (error) {
    return { data: null, error };
  }

  const runs_small = data?.filter((review: { fit_rating: number }) => review.fit_rating === 0).length || 0;
  const true_to_size = data?.filter((review: { fit_rating: number }) => review.fit_rating === 50).length || 0;
  const runs_large = data?.filter((review: { fit_rating: number }) => review.fit_rating === 100).length || 0;

  return {
    data: {
      runs_small,
      true_to_size,
      runs_large,
    },
    error: null,
  };
}

/**
 * Check if user can review a product (order must be completed/delivered)
 */
export async function canUserReview(
  userId: string,
  productId: string
): Promise<{ canReview: boolean; orderId?: string; error: PostgrestError | Error | null }> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_status,
      items:order_items(
        variant:product_variants(product_id)
      )
    `)
    .eq('user_id', userId)
    .in('order_status', ['completed', 'delivered']);

  if (error) {
    return { canReview: false, error };
  }

  const eligibleOrder = orders?.find((order: { id: string; order_status: string; items: { variant: { product_id: string } | { product_id: string }[] | null }[] }) =>
    order.items?.some((item: { variant: { product_id: string } | { product_id: string }[] | null }) => {
      const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant;
      return variant?.product_id === productId;
    })
  );

  if (!eligibleOrder) {
    return { canReview: false, error: null };
  }

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('order_id', eligibleOrder.id)
    .single();

  if (existingReview) {
    return { canReview: false, error: new Error('You have already reviewed this product') };
  }

  return { canReview: true, orderId: eligibleOrder.id, error: null };
}
