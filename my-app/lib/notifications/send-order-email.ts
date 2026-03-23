import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  sendOrderPlacedEmail,
  sendOrderSuccessEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  OrderEmailData,
} from '@/services/email.service';

export type OrderEmailType =
  | 'order_placed'
  | 'order_success'
  | 'order_delivered'
  | 'order_cancelled_by_user'
  | 'order_cancelled_by_admin';

export async function sendOrderEmail(
  orderId: string,
  type: OrderEmailType
): Promise<{ success: boolean; error?: string }> {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      user_id,
      total_price,
      voucher_code,
      discount_amount,
      items:order_items(
        quantity,
        price,
        variant:product_variants(
          color,
          size,
          product:products(name)
        )
      ),
      shipping:shipping_orders(
        receiver_name,
        receiver_phone,
        receiver_address,
        shipping_fee
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: orderError?.message || 'Order not found' };
  }

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(order.user_id);

  if (authError || !authUser?.user?.email) {
    return { success: false, error: authError?.message || 'User email not found' };
  }

  const customerEmail = authUser.user.email;
  const customerName =
    authUser.user.user_metadata?.full_name ||
    authUser.user.user_metadata?.name ||
    customerEmail.split('@')[0];
  const rawShipping = order.shipping;
  // Supabase might return an object for 1:1 relation or array
  const shipping = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping;
  
  const receiverName = shipping?.receiver_name || customerName;
  const receiverPhone = shipping?.receiver_phone || '';
  const receiverAddress = shipping?.receiver_address || '';
  const shippingFee = (shipping as { shipping_fee?: number } | null)?.shipping_fee || 0;

  type OrderItemRow = {
    quantity: number;
    price: number;
    variant: { color: string; size: string; product: { name: string } | null } | null;
  };

  const rawItems = (order.items || []) as unknown as OrderItemRow[];
  const items = rawItems.map((item) => ({
    productName: item.variant?.product?.name || 'Sản phẩm',
    variantInfo: [item.variant?.color, item.variant?.size].filter(Boolean).join(' / ') || '-',
    quantity: item.quantity,
    price: item.price * item.quantity,
  }));

  const itemSubtotal = items.reduce((sum, item) => sum + item.price, 0);
  const taxes = itemSubtotal * 0.08;

  const orderAny = order as typeof order & { voucher_code?: string | null; discount_amount?: number | null };

  const emailData: OrderEmailData = {
    orderId: order.id,
    customerName,
    customerEmail,
    totalPrice: order.total_price,
    shippingFee,
    itemSubtotal,
    taxes,
    orderItems: items,
    receiverName,
    receiverAddress,
    receiverPhone,
    voucherCode: orderAny.voucher_code,
    discountAmount: orderAny.discount_amount,
  };

  if (type === 'order_placed') {
    return sendOrderPlacedEmail(emailData);
  }
  if (type === 'order_delivered') {
    return sendOrderDeliveredEmail(emailData);
  }
  if (type === 'order_cancelled_by_user') {
    return sendOrderCancelledEmail({ ...emailData, cancelledBy: 'user' });
  }
  if (type === 'order_cancelled_by_admin') {
    return sendOrderCancelledEmail({ ...emailData, cancelledBy: 'admin' });
  }
  return sendOrderSuccessEmail(emailData);
}
