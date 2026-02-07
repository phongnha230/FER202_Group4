'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function PaymentMockContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');
    const method = searchParams.get('method');
    
    const [status, setStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
    const [countdown, setCountdown] = useState(3);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Auto-process payment after 3 seconds (simulating payment gateway)
    useEffect(() => {
        if (status !== 'pending') return;
        
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handlePayment('success');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const handlePayment = async (result: 'success' | 'failed') => {
        if (!orderId) return;
        
        setStatus('processing');
        setErrorMessage(null);
        
        try {
            // Call API route to update payment status (server-side with admin privileges)
            const response = await fetch('/api/payment/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    status: result,
                    transactionCode: result === 'success' ? `${method?.toUpperCase()}-${Date.now()}` : undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Payment update error:', data);
                setErrorMessage(data.error || 'Payment update failed');
                setStatus('failed');
                return;
            }
            
            console.log('Payment update success:', data);
            setStatus(result);
            
            // Redirect after short delay
            setTimeout(() => {
                if (result === 'success') {
                    router.push(`/order-confirmation?orderId=${orderId}`);
                } else {
                    router.push(`/checkout?paymentFailed=true`);
                }
            }, 1500);
        } catch (err) {
            console.error('Payment error:', err);
            setErrorMessage((err as Error)?.message || 'Network error');
            setStatus('failed');
        }
    };

    const getMethodName = () => {
        switch (method) {
            case 'momo': return 'MoMo';
            case 'vnpay': return 'VNPay';
            case 'card': return 'Credit Card';
            default: return 'Online Payment';
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
                <h1 className="text-2xl font-bold mb-2">{getMethodName()} Payment</h1>
                <p className="text-gray-500 mb-6">Order ID: {orderId?.slice(0, 8)}...</p>
                
                {status === 'pending' && (
                    <>
                        <div className="mb-6">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            </div>
                            <p className="text-lg">Processing payment in {countdown}s...</p>
                            <p className="text-sm text-gray-400 mt-2">(This is a mock payment page)</p>
                        </div>
                        
                        <div className="flex gap-3">
                            <Button 
                                onClick={() => handlePayment('success')}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Pay Now
                            </Button>
                            <Button 
                                onClick={() => handlePayment('failed')}
                                variant="destructive"
                                className="flex-1"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </>
                )}
                
                {status === 'processing' && (
                    <div className="py-8">
                        <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
                        <p>Processing payment...</p>
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="py-8">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                        <p className="text-lg font-semibold text-green-600">Payment Successful!</p>
                        <p className="text-gray-500 mt-2">Redirecting to order confirmation...</p>
                    </div>
                )}
                
                {status === 'failed' && (
                    <div className="py-8">
                        <XCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
                        <p className="text-lg font-semibold text-red-600">Payment Failed</p>
                        {errorMessage && (
                            <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
                        )}
                        <p className="text-gray-500 mt-2">Redirecting back...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PaymentMockPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        }>
            <PaymentMockContent />
        </Suspense>
    );
}
