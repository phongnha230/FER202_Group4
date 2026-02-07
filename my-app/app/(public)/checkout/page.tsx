import { Suspense } from 'react';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import { Lock } from 'lucide-react';

export default function CheckoutPage() {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold">UrbanNest</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Lock className="h-4 w-4" />
                    SECURE CHECKOUT
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7">
                    <CheckoutForm />
                </div>
                <div className="lg:col-span-12 xl:col-span-5">
                    <Suspense fallback={<div className="bg-gray-50 p-6 rounded-lg h-full animate-pulse">Loading summary...</div>}>
                        <OrderSummary />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
