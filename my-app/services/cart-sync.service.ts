import { getCart, clearCart } from '@/lib/cart';
import { supabase } from '@/lib/supabase/client';
import { addToCart } from '@/services/cart.service';

export async function syncLocalCartToSupabase(userId: string) {
    const localCart = getCart();
    if (localCart.length === 0) return;

    console.log('Syncing cart for user:', userId, 'Items:', localCart.length);

    try {
        // Process items
        for (const item of localCart) {
            // Find variant ID - Fetch all variants for product to match robustly
            const { data: variants, error } = await supabase
                .from('product_variants')
                .select('id, color, size')
                .eq('product_id', item.productId);

            if (variants) {
                // Case-insensitive match
                const match = variants.find(v =>
                    v.color.toLowerCase() === item.color.toLowerCase() &&
                    v.size.toLowerCase() === item.size.toLowerCase()
                );

                if (match) {
                    await addToCart(userId, {
                        variant_id: match.id,
                        quantity: item.quantity
                    });
                } else {
                    console.warn(`Variant not found for product ${item.productId} Color:${item.color} Size:${item.size}`);
                }
            } else {
                 console.warn(`No variants found for product ${item.productId}`, error);
            }
        }

        // Clear local cart after processing
        clearCart();

        // Dispatch update event to refresh UI
        if (typeof window !== 'undefined') {
             window.dispatchEvent(new Event('cart-updated'));
        }

    } catch (err) {
        console.error('Cart sync error:', err);
    }
}
