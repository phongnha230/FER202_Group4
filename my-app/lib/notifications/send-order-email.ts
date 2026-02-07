import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderPlacedEmail, sendOrderSuccessEmail, OrderEmailData } from '@/services/email.service';

export type OrderEmailType = 'order_placed' | 'order_success';

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
        receiver_address
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

  const shipping = (
    order.shipping as Array<{ receiver_name: string; receiver_phone: string; receiver_address: string }>
  )?.[0];
  const receiverName = shipping?.receiver_name || customerName;
  const receiverPhone = shipping?.receiver_phone || '';
  const receiverAddress = shipping?.receiver_address || '';

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

  const emailData: OrderEmailData = {
    orderId: order.id,
    customerName,
    customerEmail,
    totalPrice: order.total_price,
    orderItems: items,
    receiverName,
    receiverAddress,
    receiverPhone,
  };

  if (type === 'order_placed') {
    return sendOrderPlacedEmail(emailData);
  }
  return sendOrderSuccessEmail(emailData);
}
