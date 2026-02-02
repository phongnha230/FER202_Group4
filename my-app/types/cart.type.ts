import { CartItem as DBCartItem, Cart as DBCart, Product, ProductVariant, ProductImage } from './database.types';

// Extended CartItem with joined product data
export interface CartItemWithProduct extends DBCartItem {
  variant?: ProductVariant;
  product?: Product & {
    images?: ProductImage[];
  };
}

// Cart with all items and product details
export interface CartWithItems extends DBCart {
  items: CartItemWithProduct[];
}

// Request/Response types for API
export interface AddToCartRequest {
  variant_id: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// Cart summary for checkout
export interface CartSummary {
  items: CartItemWithProduct[];
  subtotal: number;
  total_items: number;
}
