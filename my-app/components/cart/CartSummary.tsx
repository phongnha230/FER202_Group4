'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CartSummaryProps {
    subtotal: number;
    shippingEstimate: number;
    tax: number;
    total: number;
}

export default function CartSummary({ subtotal, shippingEstimate, tax, total }: CartSummaryProps) {
    return (
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm h-fit sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping estimate</span>
                    <span className="font-medium text-gray-900">
                        {shippingEstimate === 0 ? 'Free' : `$${shippingEstimate.toFixed(2)}`}
                    </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax</span>
                    <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                </div>

                <div className="h-px bg-gray-100 my-4" />

                <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                </div>
            </div>

            {/* Promo Code */}
            <div className="flex gap-2 mb-6">
                <Input placeholder="Promo code" className="bg-white" />
                <Button variant="outline">Apply</Button>
            </div>

            <Button className="w-full h-12 text-base font-semibold mb-4" asChild>
                <Link href="/checkout">
                    PROCEED TO CHECKOUT <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>

            <Button variant="outline" className="w-full h-12 text-sm font-medium" asChild>
                <Link href="/">
                    CONTINUE SHOPPING
                </Link>
            </Button>

            <div className="flex justify-center gap-4 mt-6 text-gray-400">
                <Lock className="h-4 w-4" />
                <span className="text-xs">Secure Checkout</span>
            </div>
        </div>
    );
}
