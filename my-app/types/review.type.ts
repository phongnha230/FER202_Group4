import { Review as DBReview, Profile } from './database.types';

// Extended Review with user profile
export interface ReviewWithUser extends DBReview {
  user?: Profile;
  helpful_count?: number;
  not_helpful_count?: number;
  user_reaction?: 'helpful' | 'not_helpful' | null;
}

// Request type for creating a review
export interface CreateReviewRequest {
  order_id: string;
  product_id: string;
  rating: number;
  title: string;
  content: string;
  fit_rating?: 0 | 50 | 100;
  images?: string[];
}

// Request type for updating a review
export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  content?: string;
  fit_rating?: 0 | 50 | 100;
  images?: string[];
}

// Review statistics for a product
export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// Request type for adding a reaction
export interface AddReactionRequest {
  review_id: string;
  reaction_type: 'helpful' | 'not_helpful';
}

// Fit rating distribution
export interface FitRatingStats {
  runs_small: number;  // fit_rating = 0
  true_to_size: number; // fit_rating = 50
  runs_large: number;   // fit_rating = 100
}
