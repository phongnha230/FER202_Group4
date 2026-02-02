import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Cart, CartItem, ProductVariant, Product, ProductImage } from '@/types/database.types';
import { CartWithItems, CartItemWithProduct, AddToCartRequest, UpdateCartItemRequest } from '@/types/cart.type';

/**
 * Get or create a cart for the current user
 */
export async function getOrCreateCart(userId: string): Promise<{ data: Cart | null; error: PostgrestError | null }> {
  // Check if cart exists
  const { data: existingCart, error: fetchError } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    return { data: null, error: fetchError };
  }

  if (existingCart) {
    return { data: existingCart, error: null };
  }

  // Create new cart
  const { data: newCart, error: createError } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select()
    .single();

  return { data: newCart, error: createError };
}

/**
 * Get cart with all items and product details
 */
export async function getCartWithItems(userId: string): Promise<{ data: CartWithItems | null; error: PostgrestError | null }> {
  const { data: cart, error: cartError } = await getOrCreateCart(userId);

  
  if (cartError || !cart) {
    return { data: null, error: cartError };
  }

  // Fetch cart items with product and variant details
  const { data: items, error: itemsError } = await supabase
    .from('cart_items')
    .select(`
      *,
      variant:product_variants(
        *,
        product:products(
          *,
          images:product_images(*)
        )
      )
    `)
    .eq('cart_id', cart.id);

  if (itemsError) {
    return { data: null, error: itemsError };
  }

  // Transform the data to match CartItemWithProduct type
  const transformedItems: CartItemWithProduct[] = (items || []).map((item: CartItem & { variant: ProductVariant & { product: Product & { images: ProductImage[] } } }) => ({
    id: item.id,
    cart_id: item.cart_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    variant: item.variant,
    product: item.variant?.product,
  }));

  const cartWithItems: CartWithItems = {
    ...cart,
    items: transformedItems,
  };

  return { data: cartWithItems, error: null };
}

/**
 * Add item to cart
 */
export async function addToCart(
  userId: string,
  request: AddToCartRequest
): Promise<{ data: CartItem | null; error: PostgrestError | null }> {
  const { data: cart, error: cartError } = await getOrCreateCart(userId);
  
  if (cartError || !cart) {
    return { data: null, error: cartError };
  }

  // Check if item already exists in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('variant_id', request.variant_id)
    .single();

  if (existingItem) {
    // Update quantity if item exists
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + request.quantity })
      .eq('id', existingItem.id)
      .select()
      .single();
    
    return { data, error };
  }

  // Add new item to cart
  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cart.id,
      variant_id: request.variant_id,
      quantity: request.quantity,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  itemId: string,
  request: UpdateCartItemRequest
): Promise<{ data: CartItem | null; error: PostgrestError | null }> {
  if (request.quantity <= 0) {
    // Remove item if quantity is 0 or less
    return removeFromCart(itemId);
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity: request.quantity })
    .eq('id', itemId)
    .select()
    .single();

  return { data, error };
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string): Promise<{ data: CartItem | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .select()
    .single();

  return { data, error };
}

/**
 * Clear all items from cart
 */
export async function clearCart(cartId: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId);

  return { error };
}

/**
 * Get cart summary (totals)
 */
export async function getCartSummary(userId: string) {
  const { data: cartWithItems, error } = await getCartWithItems(userId);
  
  if (error || !cartWithItems) {
    return {
      data: {
        items: [],
        subtotal: 0,
        total_items: 0,
      },
      error,
    };
  }

  const subtotal = cartWithItems.items.reduce((sum, item) => {
    const price = item.variant?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  const total_items = cartWithItems.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    data: {
      items: cartWithItems.items,
      subtotal,
      total_items,
    },
    error: null,
  };
}
