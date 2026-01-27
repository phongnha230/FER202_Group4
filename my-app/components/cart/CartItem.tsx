'use client';

import Image from 'next/image';
import { Minus, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItemType } from './cart-types';

interface CartItemProps {
    item: CartItemType;
    onUpdateQuantity: (id: string, newQty: number) => void;
    onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    return (
        <div className="flex gap-4 py-6 border-b border-gray-100 last:border-0">
            {/* Image */}
            <div className="relative w-24 h-32 shrink-0 bg-gray-100 rounded-md overflow-hidden">
                <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h3 className="font-semibold text-base text-gray-900 uppercase">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {item.color} / {item.size}
                        </p>
                    </div>
                    <p className="font-medium text-gray-900">
                        ${item.price.toFixed(2)}
                    </p>
                </div>

                <div className="flex justify-between items-end mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center border border-gray-200 rounded-md w-max">
                                <button
                                    onClick={() => {
                                        if (item.quantity > 1) {
                                            onUpdateQuantity(item.id, item.quantity - 1);
                                        } else {
                                            onRemove(item.id);
                                        }
                                    }}
                                    className="p-2 hover:bg-gray-50 text-gray-600 transition-colors"
                                    aria-label="Decrease quantity"
                                >
                                    <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <button
                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                    className="p-2 hover:bg-gray-50 text-gray-600 transition-colors"
                                    aria-label="Increase quantity"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>
                            {item.lowStock && (
                                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                                    <AlertTriangle className="h-3 w-3" />
                                    Low Stock
                                </p>
                            )}
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
}
