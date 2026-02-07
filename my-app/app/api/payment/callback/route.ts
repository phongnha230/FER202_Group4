import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/services/notification.service';
import { sendOrderEmail } from '@/lib/notifications/send-order-email';

// Create admin client with service role key for bypassing RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, status, transactionCode } = body;

        if (!orderId || !status) {
            return NextResponse.json(
                { error: 'Missing orderId or status' },
                { status: 400 }
            );
        }

        if (!['success', 'failed'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be "success" or "failed"' },
                { status: 400 }
            );
        }

        console.log(`Processing payment callback for order ${orderId} with status ${status}`);

        // Update payment record
        const { error: paymentError } = await supabaseAdmin
            .from('payments')
            .update({
                status,
                transaction_code: transactionCode || null,
                paid_at: status === 'success' ? new Date().toISOString() : null,
            })
            .eq('order_id', orderId);

        if (paymentError) {
            console.error('Payment update error:', paymentError);
            return NextResponse.json(
                { error: 'Failed to update payment status', details: paymentError.message },
                { status: 500 }
            );
        }

        // Update order status if payment is successful
        if (status === 'success') {
            const { data: order, error: orderError } = await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'paid',
                    order_status: 'paid',
                })
                .eq('id', orderId)
                .select('user_id')
                .single();

            if (orderError) {
                console.error('Order update error:', orderError);
                return NextResponse.json(
                    { error: 'Failed to update order status', details: orderError.message },
                    { status: 500 }
                );
            }

            // Create in-app notification for customer
            if (order?.user_id) {
                await createNotification(
                    order.user_id,
                    'Thanh toán thành công',
                    `Đơn hàng #${orderId.slice(0, 8).toUpperCase()} đã được thanh toán thành công.`,
                    'success'
                );
            }

            // Send email to customer
            const emailResult = await sendOrderEmail(orderId, 'order_success');
            if (!emailResult.success) {
                console.warn('Order success email failed:', emailResult.error);
            }
        }

        console.log(`Payment callback processed successfully for order ${orderId}`);

        return NextResponse.json({ 
            success: true, 
            message: `Payment ${status} for order ${orderId}` 
        });

    } catch (error) {
        console.error('Payment callback error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
