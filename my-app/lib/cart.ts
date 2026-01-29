import { CartItemType } from '@/components/cart/cart-types';

const STORAGE_KEY = 'urban_nest_cart';

export const getCart = (): CartItemType[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

// Helper: Dispatch custom event for real-time updates
const notifyCartUpdate = () => {
    window.dispatchEvent(new Event('cart-updated'));
};

export const addToCart = (item: CartItemType) => {
    const cart = getCart();
    const existingIndex = cart.findIndex((i) => i.productId === item.productId && i.color === item.color && i.size === item.size);

    let finalItem = item;

    if (existingIndex > -1) {
        cart[existingIndex].quantity += item.quantity;
        finalItem = cart[existingIndex];
    } else {
        cart.push(item);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    notifyCartUpdate();
    return finalItem;
};

export const updateCartItem = (id: string, quantity: number) => {
    const cart = getCart();
    const updated = cart.map(item => item.id === id ? { ...item, quantity } : item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyCartUpdate();
    return updated;
};

export const updateCartItemNote = (id: string, note: string) => {
    const cart = getCart();
    const updated = cart.map(item => item.id === id ? { ...item, note } : item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyCartUpdate();
    return updated;
};

export const removeCartItem = (id: string) => {
    const cart = getCart();
    const updated = cart.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyCartUpdate();
    return updated;
};

export const clearCart = () => {
    localStorage.removeItem(STORAGE_KEY);
    notifyCartUpdate();
};
