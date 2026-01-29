export interface CartItemType {
    id: string;
    productId: string;
    name: string;
    price: number;
    image: string;
    color: string;
    size: string;
    quantity: number;
    maxStock?: number;
    lowStock?: boolean;
    note?: string; // Added note field
    baseColor?: string; // Added to determine if filter should be applied
}
