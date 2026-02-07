import { create } from 'zustand';
import { CartWithItems, CartItemWithProduct } from '@/types/cart.type';
import { PostgrestError } from '@supabase/supabase-js';

interface CartState {
  cart: CartWithItems | null;
  isLoading: boolean;
  error: PostgrestError | null;
  setCart: (cart: CartWithItems | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: PostgrestError | null) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,

  setCart: (cart) => set({ cart }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  getTotalItems: () => {
    const { cart } = get();
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    const { cart } = get();
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => {
      const price = item.variant?.price || 0;
      return sum + (price * item.quantity);
    }, 0);
  },
}));
