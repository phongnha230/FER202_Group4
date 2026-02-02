import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { Order, OrderItem, ProductVariant, Product, ShippingOrder, Payment } from '@/types/database.types';
import { supabase } from '@/lib/supabase/client';
import { 
  OrderWithDetails, 
  CreateOrderRequest, 
  UpdateOrderStatusRequest,
  OrderFilters 
} from '@/types/order.type';

import { deductStock, restoreStock } from '@/services/inventory.service';

/**
 * Create a new order from cart
 */
export async function createOrder(
  userId: string,
  request: CreateOrderRequest,
  client: SupabaseClient = supabase
): Promise<{ data: Order | null; error: PostgrestError | Error | null }> {
  try {
    // 1. Get cart items first to prepare for inventory check
    const { data: cartItems, error: cartError } = await client
      .from('cart_items')
      .select(`
        *,
        variant:product_variants(price, stock)
      `)
      .eq('cart_id', request.cart_id);

    if (cartError || !cartItems || cartItems.length === 0) {
        return { data: null, error: cartError || new Error('Cart is empty') };
    }

    // 2. Prepare items for inventory deduction
    // Define type properly to avoid strict-any check on joins
    type CartItemWithVariant = {
      variant_id: string;
      quantity: number;
      variant: { price: number; stock: number };
    };

    const itemsToDeduct = (cartItems as unknown as CartItemWithVariant[]).map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity
    }));

    // 3. Deduct stock BEFORE creating order (Optimistic check)
    // If this fails (e.g. out of stock), we stop here.
    const { error: stockError } = await deductStock(itemsToDeduct, client);
    if (stockError) {
        return { data: null, error: stockError };
    }

    // 4. Create Order
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        user_id: userId,
        total_price: request.total_price,
        payment_method: request.payment_method,
        payment_status: request.payment_method === 'cod' ? 'unpaid' : 'unpaid',
        order_status: 'pending_payment',
      })
      .select()
      .single();

    if (orderError || !order) {
      // CRITICAL: If order creation fails, we MUST rollback stock
      await restoreStock(itemsToDeduct, client);
      return { data: null, error: orderError };
    }

    // 5. Create Order Items
    const orderItems = (cartItems as unknown as CartItemWithVariant[]).map((item) => ({
      order_id: order.id,
      variant_id: item.variant_id,
      price: item.variant.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await client
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback Order AND Stock
      await client.from('orders').delete().eq('id', order.id);
      await restoreStock(itemsToDeduct, client);
      return { data: null, error: itemsError };
    }

    // 6. Create Shipping Order
    const { error: shippingError } = await client
      .from('shipping_orders')
      .insert({
        order_id: order.id,
        provider: 'manual',
        receiver_name: request.shipping_info.receiver_name,
        receiver_phone: request.shipping_info.receiver_phone,
        receiver_address: request.shipping_info.receiver_address,
        status: 'created',
      });

    if (shippingError) {
      // Rollback everything
      await client.from('orders').delete().eq('id', order.id);
      await restoreStock(itemsToDeduct, client);
      return { data: null, error: shippingError };
    }

    // 7. Create Payment Record
    await client
      .from('payments')
      .insert({
        order_id: order.id,
        method: request.payment_method,
        status: 'pending',
      });

    // 8. Clear Cart
    await client
      .from('cart_items')
      .delete()
      .eq('cart_id', request.cart_id);

    return { data: order, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function getOrder(orderId: string): Promise<{ data: OrderWithDetails | null; error: PostgrestError | null }> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        variant:product_variants(
          *,
          product:products(*)
        )
      ),
      shipping:shipping_orders(*),
      payment:payments(*)
    `)
    .eq('id', orderId)
    .single();

  if (orderError) {
    return { data: null, error: orderError };
  }

  // Transform payment array to single object
  const transformedOrder: OrderWithDetails = {
    ...order,
    items: order.items?.map((item: OrderItem & { variant: ProductVariant & { product: Product } }) => ({
      ...item,
      variant: item.variant,
      product: item.variant?.product,
    })),
    shipping: order.shipping?.[0] || null,
    payment: order.payment?.[0] || null,
  };

  return { data: transformedOrder, error: null };
}

/**
 * Get all orders for a user
 */
export async function getUserOrders(
  userId: string,
  filters?: OrderFilters
): Promise<{ data: OrderWithDetails[]; error: PostgrestError | null }> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        variant:product_variants(
          *,
          product:products(*)
        )
      ),
      shipping:shipping_orders(*),
      payment:payments(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('order_status', filters.status);
  }

  if (filters?.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error };
  }

  // Transform the data
  // Use unknown assertion check
  type RawOrder = Order & { 
      items: (OrderItem & { variant: ProductVariant & { product: Product } })[]; 
      shipping: ShippingOrder[];  
      payment: Payment[];
  };

  const transformedOrders: OrderWithDetails[] = (data || []).map((raw: unknown) => {
    const typedOrder = raw as RawOrder;
    return {
      ...typedOrder,
      items: typedOrder.items?.map((item) => ({
        ...item,
        variant: item.variant,
        product: item.variant?.product,
      })),
      shipping: typedOrder.shipping?.[0] || null,
      payment: typedOrder.payment?.[0] || null,
    };
  });

  return { data: transformedOrders, error: null };
}

/**
 * Update order status (admin/system only)
 */
export async function updateOrderStatus(
  orderId: string,
  request: UpdateOrderStatusRequest
): Promise<{ data: Order | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('orders')
    .update({ order_status: request.order_status })
    .eq('id', orderId)
    .select()
    .single();

  return { data, error };
}

/**
 * Cancel order (user)
 */
export async function cancelOrder(
    orderId: string, 
    userId: string,
    client: SupabaseClient = supabase
): Promise<{ data: Order | null; error: PostgrestError | Error | null }> {
  // Check if order belongs to user and is cancellable
  const { data: order, error: fetchError } = await client
    .from('orders')
    .select(`
        *,
        items:order_items(variant_id, quantity)
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Only allow cancellation for pending_payment, paid, or processing orders
  if (!['pending_payment', 'paid', 'processing'].includes(order.order_status)) {
    return { 
      data: null, 
      error: new Error('Order cannot be cancelled at this stage') 
    };
  }

  const { data, error } = await client
    .from('orders')
    .update({ order_status: 'cancelled' })
    .eq('id', orderId)
    .select()
    .single();

    if (!error && order.items) {
        // Restore stock
        // Typed properly for the join result
        const itemsToRestore = (order.items as unknown as OrderItem[]).map((item) => ({
            variant_id: item.variant_id,
            quantity: item.quantity
        }));
        await restoreStock(itemsToRestore, client);
    }

  return { data, error };
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  orderId: string,
  status: 'success' | 'failed',
  transactionCode?: string
): Promise<{ error: PostgrestError | null }> {
  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status,
      transaction_code: transactionCode,
      paid_at: status === 'success' ? new Date().toISOString() : null,
    })
    .eq('order_id', orderId);

  if (paymentError) {
    return { error: paymentError };
  }

  // Update order status and payment status
  if (status === 'success') {
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        order_status: 'paid',
      })
      .eq('id', orderId);
  }

  return { error: null };
}
