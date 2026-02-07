import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Cart, CartItem, ProductVariant, Product, ProductImage } from '@/types/database.types';
import { CartWithItems, CartItemWithProduct, AddToCartRequest, UpdateCartItemRequest } from '@/types/cart.type';

/**
 * Get or create a cart for the current user
 */
export async function getOrCreateCart(userId: string): Promise<{ data: Cart | null; error: PostgrestError | null }> {
  console.log('cart.service: getOrCreateCart for userId:', userId);
  
  // Check if cart exists - get the most recent one (user might have multiple carts)
  const { data: existingCarts, error: fetchError } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('cart.service: Fetch cart result:', { existingCarts, error: fetchError?.code, message: fetchError?.message });

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  if (existingCarts && existingCarts.length > 0) {
    console.log('cart.service: Using existing cart:', existingCarts[0].id);
    return { data: existingCarts[0], error: null };
  }

  // Create new cart
  console.log('cart.service: Creating new cart for user:', userId);
  const { data: newCart, error: createError } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select()
    .single();

  console.log('cart.service: Create cart result:', { newCart, error: createError?.code, message: createError?.message });
  return { data: newCart, error: createError };
}

/**
 * Get cart with all items and product details
 */
export async function getCartWithItems(userId: string): Promise<{ data: CartWithItems | null; error: PostgrestError | null }> {
  console.log('cart.service: getCartWithItems called for user:', userId);
  
  const { data: cart, error: cartError } = await getOrCreateCart(userId);

  if (cartError || !cart) {
    console.error('cart.service: Failed to get/create cart:', cartError);
    return { data: null, error: cartError };
  }

  console.log('cart.service: Cart found/created:', cart.id);

  // Fetch cart items with product and variant details
  console.log('cart.service: Fetching cart items for cart_id:', cart.id);
  
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
    console.error('cart.service: Failed to fetch cart items:', itemsError);
    return { data: null, error: itemsError };
  }

  console.log('cart.service: Cart items fetched:', items?.length || 0);

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

  console.log('cart.service: Returning cart with items:', cartWithItems);
  return { data: cartWithItems, error: null };
}

/**
 * Add item to cart
 */
export async function addToCart(
  userId: string,
  request: AddToCartRequest
): Promise<{ data: CartItem | null; error: PostgrestError | null }> {
  console.log('cart.service: addToCart called', { userId, request });
  
  const { data: cart, error: cartError } = await getOrCreateCart(userId);
  
  if (cartError || !cart) {
    console.error('cart.service: Failed to get/create cart for addToCart:', cartError);
    return { data: null, error: cartError };
  }

  console.log('cart.service: Using cart:', cart.id);

  // Check if item already exists in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('variant_id', request.variant_id)
    .maybeSingle();

  if (existingItem) {
    console.log('cart.service: Item already exists, updating quantity:', existingItem);
    // Update quantity if item exists
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + request.quantity })
      .eq('id', existingItem.id)
      .select()
      .single();
    
    console.log('cart.service: Update result:', { data, error });
    return { data, error };
  }

  // Add new item to cart
  console.log('cart.service: Adding new item to cart');
  
  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cart.id,
      variant_id: request.variant_id,
      quantity: request.quantity,
    })
    .select()
    .single();

  console.log('cart.service: Insert result:', { data, error: error?.message });
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
