'use client';

import { X, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CartItemType } from '@/components/cart/cart-types';
import { Textarea } from '@/components/ui/textarea';
import { removeCartItem, updateCartItemNote } from '@/lib/cart'; // Import library functions
import { getColorFilter } from '@/lib/utils';

interface CartSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: CartItemType | null;
    cartCount: number;
    totalPrice: number;
}

export default function CartSuccessModal({
    isOpen,
    onClose,
    product,
    cartCount,
    totalPrice,
}: CartSuccessModalProps) {
    if (!product) return null;

    const handleRemove = () => {
        removeCartItem(product.id);
        onClose(); // Close modal after removing
    };

    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateCartItemNote(product.id, e.target.value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-white">
                <DialogHeader className="p-4 border-b border-gray-100 flex flex-row items-center justify-between">
                    <DialogTitle className="text-sm font-bold uppercase tracking-wide flex-1 text-center pr-6">
                        YOUR CART (HAS {cartCount} PRODUCTS)
                    </DialogTitle>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-black transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </DialogHeader>

                <div className="p-6">
                    <div className="flex gap-4">
                        <div className="relative w-24 h-24 shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                style={product.color !== product.baseColor ? getColorFilter(product.color, product.baseColor) : undefined}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="font-bold text-sm text-gray-900 leading-tight">
                                {product.name}
                            </h3>
                            <div className="text-xs text-gray-500 space-y-0.5">
                                <p>{product.color} / {product.size}</p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <p className="font-bold text-sm text-black">
                                    ${product.price.toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                <span>Quantity: {product.quantity}</span>
                                <button
                                    onClick={handleRemove}
                                    className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Remove</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Textarea
                            placeholder="Note"
                            defaultValue={product.note || ''}
                            onChange={handleNoteChange}
                            className="min-h-[80px] text-sm resize-none bg-gray-50 border-gray-200 focus:border-black focus:ring-black"
                        />
                    </div>

                    <div className="mt-6 pt-2">
                        <div className="flex items-center justify-between mb-4">
                            <Link href="/streetwear" onClick={onClose} className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-1 transition-colors">
                                <span className="text-lg">‹</span> Continue Shopping
                            </Link>
                            <div className="text-right">
                                <span className="text-sm font-bold mr-2">TOTAL:</span>
                                <span className="text-sm font-bold">${totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        <Link href="/checkout" className="block w-full">
                            <Button className="w-full bg-black text-white hover:bg-gray-800 h-12 rounded-sm font-bold uppercase tracking-wide text-sm">
                                PROCEED TO CHECKOUT
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-4 text-center border-t border-gray-100 pt-3">
                        <p className="text-xs text-red-500 font-bold">
                            ORDER VIA HOTLINE - 0971.081.488 <span className="text-gray-400 font-normal ml-1">(8h30 : 21h30)</span>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
