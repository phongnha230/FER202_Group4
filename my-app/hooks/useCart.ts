'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/user.store';
import { 
  getCartWithItems, 
  addToCart as addToCartService, 
  updateCartItem as updateCartItemService,
  removeFromCart as removeFromCartService,
  clearCart as clearCartService,
  getCartSummary
} from '@/services/cart.service';
import { CartWithItems, AddToCartRequest, UpdateCartItemRequest } from '@/types/cart.type';
import { PostgrestError } from '@supabase/supabase-js';

export function useCart() {
  const { user, isAuthenticated } = useUserStore();
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  // Load cart from Supabase for authenticated users
  const loadCart = async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('useCart: Not authenticated, skipping cart load');
      setIsLoading(false);
      setCart(null);
      return;
    }

    console.log('useCart: Loading cart for user:', user.id);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: cartError } = await getCartWithItems(user.id);
      if (cartError) {
        console.error('useCart: Error loading cart:', cartError);
        setError(cartError);
        setCart(null);
      } else {
        console.log('useCart: Cart loaded successfully:', data);
        setCart(data);
      }
    } catch (err) {
      console.error('useCart: Unexpected error:', err);
      setError(err as PostgrestError);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (request: AddToCartRequest) => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('User must be authenticated to add items to cart');
    }

    const { data, error: addError } = await addToCartService(user.id, request);
    if (addError) {
      throw addError;
    }

    // Reload cart to get updated state
    await loadCart();
    return data;
  };

  // Update cart item quantity
  const updateCartItem = async (itemId: string, request: UpdateCartItemRequest) => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('User must be authenticated to update cart');
    }

    const { data, error: updateError } = await updateCartItemService(itemId, request);
    if (updateError) {
      throw updateError;
    }

    await loadCart();
    return data;
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('User must be authenticated to remove items from cart');
    }

    const { data, error: removeError } = await removeFromCartService(itemId);
    if (removeError) {
      throw removeError;
    }

    await loadCart();
    return data;
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isAuthenticated || !user?.id || !cart) {
      return;
    }

    const { error: clearError } = await clearCartService(cart.id);
    if (clearError) {
      throw clearError;
    }

    await loadCart();
  };

  // Get cart summary (totals)
  const getSummary = async () => {
    if (!isAuthenticated || !user?.id) {
      return { items: [], subtotal: 0, total_items: 0 };
    }

    const { data, error: summaryError } = await getCartSummary(user.id);
    if (summaryError) {
      throw summaryError;
    }

    return data;
  };

  // Load cart when user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadCart();
    } else {
      setCart(null);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  return {
    cart,
    isLoading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getSummary,
    reloadCart: loadCart,
  };
}
