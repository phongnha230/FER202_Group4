// Database types generated from Supabase schema

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: 'admin' | 'customer';
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: string;
  category_id: number | null;
  name: string;
  description: string | null;
  base_price: number;
  sale_price: number | null;
  image: string | null;
  status: 'active' | 'hidden';
  created_at: string;
  slug: string | null;
  featured: boolean;
  is_new: boolean;
  in_stock: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  color: string | null;
  image_url: string;
  is_main: boolean;
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  total_price: number;
  payment_method: 'online' | 'cod';
  payment_status: 'paid' | 'unpaid';
  order_status: 'pending_payment' | 'paid' | 'processing' | 'shipping' | 'delivered' | 'completed' | 'cancelled' | 'returned';
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  price: number;
  quantity: number;
}

export interface Payment {
  id: string;
  order_id: string;
  method: 'momo' | 'vnpay' | 'cod' | null;
  status: 'pending' | 'success' | 'failed';
  transaction_code: string | null;
  paid_at: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  order_id: string;
  product_id: string;
  rating: number;
  title: string;
  content: string;
  fit_rating: 0 | 50 | 100 | null;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface ReviewReaction {
  id: string;
  review_id: string;
  user_id: string;
  reaction_type: 'helpful' | 'not_helpful' | null;
  created_at: string;
}

export interface ShippingOrder {
  id: string;
  order_id: string;
  provider: 'ghn' | 'ghtk' | 'viettel_post' | 'jt' | 'manual';
  shipping_code: string | null;
  shipping_fee: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  status: 'created' | 'picking' | 'shipping' | 'delivered' | 'failed' | 'returned';
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface AIChatSession {
  id: string;
  user_id: string | null;
  created_at: string;
}

export interface AIChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
}
