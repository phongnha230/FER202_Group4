import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';

/**
 * Check variant stock availability
 */
export async function checkVariantStock(
    variantId: string, 
    client: SupabaseClient = defaultClient
): Promise<{ inStock: boolean; stock: number; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('product_variants')
    .select('stock')
    .eq('id', variantId)
    .single();

  if (error) {
    return { inStock: false, stock: 0, error };
  }

  return {
    inStock: data.stock > 0,
    stock: data.stock,
    error: null,
  };
}

/**
 * Update variant stock (internal use or admin)
 */
export async function updateStock(
  variantId: string, 
  newStock: number,
  client: SupabaseClient = defaultClient
): Promise<{ error: PostgrestError | null }> {
  const { error } = await client
    .from('product_variants')
    .update({ stock: newStock })
    .eq('id', variantId);

  return { error };
}

/**
 * Deduct stock for an order
 * This should ideally be called within a database transaction or RPC function to avoid race conditions
 */
export async function deductStock(
  items: { variant_id: string; quantity: number }[],
  client: SupabaseClient = defaultClient
): Promise<{ error: PostgrestError | Error | null }> {
  // For now, we update strictly one by one. 
  // TODO: Replace with a stored procedure 'deduct_inventory' for atomicity.
  
  for (const item of items) {
    const { data: variant, error: fetchError } = await client
      .from('product_variants')
      .select('stock')
      .eq('id', item.variant_id)
      .single();

    if (fetchError || !variant) {
      console.error(`Failed to fetch variant ${item.variant_id}`, fetchError);
      continue; // Or throw error to abort
    }

    if (variant.stock < item.quantity) {
      return { error: new Error(`Insufficient stock for variant ${item.variant_id}`) };
    }

    const { error: updateError } = await client
      .from('product_variants')
      .update({ stock: variant.stock - item.quantity })
      .eq('id', item.variant_id);

    if (updateError) {
      return { error: updateError };
    }
  }

  return { error: null };
}

/**
 * Restore stock (e.g. cancelled order)
 */
export async function restoreStock(
    items: { variant_id: string; quantity: number }[],
    client: SupabaseClient = defaultClient
  ): Promise<{ error: PostgrestError | Error | null }> {
    for (const item of items) {
      // We can use the rpc increment method if available, or fetch-update
      // Since we don't have rpc setup confirmed, we'll use fetch-update
      
      const { data: variant, error: fetchError } = await client
        .from('product_variants')
        .select('stock')
        .eq('id', item.variant_id)
        .single();
  
      if (fetchError || !variant) {
        continue;
      }
  
      const { error: updateError } = await client
        .from('product_variants')
        .update({ stock: variant.stock + item.quantity })
        .eq('id', item.variant_id);
  
      if (updateError) {
        return { error: updateError };
      }
    }
  
    return { error: null };
  }
