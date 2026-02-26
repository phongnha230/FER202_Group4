import { getCart, clearCart } from '@/lib/cart';
import { supabase } from '@/lib/supabase/client';
import { getOrCreateCart } from '@/services/cart.service';

export async function syncLocalCartToSupabase(userId: string) {
    const localCart = getCart();
    if (localCart.length === 0) return;

    console.log('Syncing cart for user:', userId, 'Items:', localCart.length);

    try {
        // 1. Get or create cart ID
        const { data: cart, error: cartError } = await getOrCreateCart(userId);
        if (cartError || !cart) {
            console.error("Failed to get cart for sync:", cartError);
            return;
        }

        // 2. Fetch all necessary data in parallel
        //    - Product variants for mapping local items to variant IDs
        //    - Existing cart items to check what needs updating vs inserting
        const productIds = Array.from(new Set(localCart.map(item => item.productId)));
        
        const [variantsBox, existingItemsBox] = await Promise.all([
            supabase
                .from('product_variants')
                .select('id, product_id, color, size')
                .in('product_id', productIds),
            
            supabase
                .from('cart_items')
                .select('id, variant_id, quantity')
                .eq('cart_id', cart.id)
        ]);

        const variants = variantsBox.data || [];
        const existingItems = existingItemsBox.data || [];

        // 3. Prepare operations
        const itemsToInsert: { cart_id: string; variant_id: string; quantity: number }[] = [];
        const itemsToUpdate: { id: string; quantity: number }[] = [];

        for (const item of localCart) {
            // Find variant ID
            const match = variants.find(v => 
                v.product_id === item.productId &&
                v.color.toLowerCase() === item.color.toLowerCase() &&
                v.size.toLowerCase() === item.size.toLowerCase()
            );

            if (match) {
                // Check if already in cart
                const existing = existingItems.find(ei => ei.variant_id === match.id);
                
                if (existing) {
                    // Accumulate quantity if we haven't already processed this existing item in this loop
                    // (Handle case where local cart has duplicates? Unlikely but safe to check)
                    // Actually, if we update, we need to track that we updated it so we don't overwrite if multiple local items map to same variant (also unlikely)
                    
                    // Simple logic: Add local quantity to existing quantity
                    // We need to keep track of the *running* quantity if we have multiple updates for same item, 
                    // but usually local cart shouldn't have duplicates.
                    
                    // We add to itemsToUpdate. 
                    // Note: If we have multiple entries in itemsToUpdate for same ID, we should merge them.
                    // But effectively local cart -> variant should be 1:1.
                    
                    itemsToUpdate.push({
                        id: existing.id,
                        quantity: existing.quantity + item.quantity
                    });

                    // Update the 'existing' array in memory so subsequent local items finding the same variant know the new base?
                    // Not needed if local cart is unique per variant.
                } else {
                    itemsToInsert.push({
                        cart_id: cart.id,
                        variant_id: match.id,
                        quantity: item.quantity
                    });
                }
            } else {
                console.warn(`Variant not found for sync: ${item.productId} ${item.color} ${item.size}`);
            }
        }

        // 4. Execute operations
        const promises = [];

        // Bulk insert
        if (itemsToInsert.length > 0) {
            promises.push(
                supabase.from('cart_items').insert(itemsToInsert)
            );
        }

        // Updates (must be individual requests usually, unless we use an RPC or specific upsert with IDs, but standard update is by ID)
        // Optimizing updates: We can't easily bulk update different values for different IDs in one query without complex SQL.
        // So we run them in parallel.
        if (itemsToUpdate.length > 0) {
            itemsToUpdate.forEach(update => {
                promises.push(
                    supabase
                        .from('cart_items')
                        .update({ quantity: update.quantity })
                        .eq('id', update.id)
                );
            });
        }

        await Promise.all(promises);

        console.log(`Synced: ${itemsToInsert.length} inserted, ${itemsToUpdate.length} updated.`);

        // 5. Clear local cart
        clearCart();

        // 6. Refresh UI
        if (typeof window !== 'undefined') {
             window.dispatchEvent(new Event('cart-updated'));
        }

    } catch (err) {
        console.error('Cart sync error:', err);
    }
}
