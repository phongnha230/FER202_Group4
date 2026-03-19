'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Lock, Tag, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CartSummaryProps {
    subtotal: number;
    shippingEstimate: number;
    tax: number;
    total: number;
}

interface AppliedVoucher {
    code: string;
    description: string | null;
    discount_amount: number;
}

export default function CartSummary({ subtotal, shippingEstimate, tax, total }: CartSummaryProps) {
    const [inputCode, setInputCode] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [voucherError, setVoucherError] = useState<string | null>(null);
    const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);

    const discountedTotal = appliedVoucher
        ? Math.max(0, total - appliedVoucher.discount_amount)
        : total;

    const handleApply = async () => {
        if (!inputCode.trim()) return;
        setIsApplying(true);
        setVoucherError(null);

        try {
            const res = await fetch('/api/vouchers/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: inputCode.trim(), subtotal }),
            });
            const data = await res.json();

            if (!res.ok) {
                setVoucherError(data.error || 'Mã không hợp lệ');
                setAppliedVoucher(null);
            } else {
                setAppliedVoucher({
                    code: data.voucher.code,
                    description: data.voucher.description,
                    discount_amount: data.discount_amount,
                });
                setInputCode('');
            }
        } catch {
            setVoucherError('Không thể kết nối server');
        } finally {
            setIsApplying(false);
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherError(null);
    };

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

                {appliedVoucher && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            Discount ({appliedVoucher.code})
                        </span>
                        <span className="font-medium">-${appliedVoucher.discount_amount.toFixed(2)}</span>
                    </div>
                )}

                <div className="h-px bg-gray-100 my-4" />

                <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <div className="text-right">
                        {appliedVoucher && (
                            <p className="text-sm text-gray-400 line-through">${total.toFixed(2)}</p>
                        )}
                        <span className="text-xl font-bold text-gray-900">${discountedTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Voucher Applied */}
            {appliedVoucher ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-6 text-sm">
                    <span className="text-green-700 flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span className="font-medium">{appliedVoucher.code}</span>
                        {appliedVoucher.description && (
                            <span className="text-green-600">— {appliedVoucher.description}</span>
                        )}
                    </span>
                    <button onClick={handleRemoveVoucher} className="text-green-600 hover:text-green-800">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="mb-6">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Promo code"
                            className="bg-white"
                            value={inputCode}
                            onChange={(e) => {
                                setInputCode(e.target.value.toUpperCase());
                                setVoucherError(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                        />
                        <Button variant="outline" onClick={handleApply} disabled={isApplying || !inputCode.trim()}>
                            {isApplying ? '...' : 'Apply'}
                        </Button>
                    </div>
                    {voucherError && (
                        <p className="text-xs text-red-500 mt-1">{voucherError}</p>
                    )}
                </div>
            )}

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
