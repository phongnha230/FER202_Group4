'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PayOSReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const code = searchParams.get('code');       // '00' = success
  const cancel = searchParams.get('cancel');   // 'true' if user cancelled

  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    if (cancel === 'true' || (code && code !== '00')) {
      setStatus('failed');
    } else {
      setStatus('success');
    }
  }, [code, cancel]);

  // Auto-redirect to order confirmation on success
  useEffect(() => {
    if (status === 'success' && orderId) {
      const timer = setTimeout(() => {
        router.push(`/order-confirmation?orderId=${orderId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, orderId, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-2">PayOS</h1>
        <p className="text-gray-500 mb-6">
          Đơn hàng: #{orderId?.slice(0, 8).toUpperCase()}
        </p>

        {status === 'loading' && (
          <div className="py-8">
            <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
            <p>Đang xử lý kết quả thanh toán...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <p className="text-lg font-semibold text-green-600">Thanh toán thành công!</p>
            <p className="text-gray-500 mt-2">Đang chuyển đến trang xác nhận đơn hàng...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="py-8">
            <XCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
            <p className="text-lg font-semibold text-red-600">
              Thanh toán thất bại hoặc bị hủy
            </p>
            <div className="flex gap-3 mt-6 justify-center">
              <Button onClick={() => router.push('/checkout')} variant="outline">
                Thử lại
              </Button>
              <Button onClick={() => router.push('/')}>Về trang chủ</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PayOSReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      }
    >
      <PayOSReturnContent />
    </Suspense>
  );
}
