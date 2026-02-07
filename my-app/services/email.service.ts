import { Resend } from 'resend';

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Shop <onboarding@resend.dev>';

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  orderItems: Array<{ productName: string; variantInfo: string; quantity: number; price: number }>;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
}

function buildOrderPlacedHtml(data: OrderEmailData): string {
  const itemsHtml = data.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName} (${item.variantInfo})</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Đơn hàng đã được đặt thành công</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.9;">Mã đơn hàng: <strong>${data.orderId}</strong></p>
  </div>
  <div style="background: #f9f9f9; padding: 24px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Xin chào <strong>${data.customerName}</strong>,</p>
    <p>Cảm ơn bạn đã đặt hàng! Chúng tôi đã nhận được đơn hàng của bạn và đang xử lý.</p>
    
    <h3 style="margin-top: 24px;">Chi tiết đơn hàng</h3>
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #f0f0f0;">
          <th style="padding: 12px; text-align: left;">Sản phẩm</th>
          <th style="padding: 12px; text-align: center;">SL</th>
          <th style="padding: 12px; text-align: right;">Giá</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    
    <p style="margin-top: 16px; font-size: 18px; font-weight: bold;">Tổng cộng: $${data.totalPrice.toFixed(2)}</p>
    
    <h3 style="margin-top: 24px;">Thông tin giao hàng</h3>
    <p><strong>Người nhận:</strong> ${data.receiverName}</p>
    <p><strong>Điện thoại:</strong> ${data.receiverPhone}</p>
    <p><strong>Địa chỉ:</strong> ${data.receiverAddress}</p>
    
    <p style="margin-top: 24px; color: #666; font-size: 14px;">
      Nếu bạn chọn thanh toán online, vui lòng hoàn tất thanh toán để đơn hàng được xử lý.
    </p>
  </div>
</body>
</html>
  `.trim();
}

function buildOrderSuccessHtml(data: OrderEmailData): string {
  const itemsHtml = data.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName} (${item.variantInfo})</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Thanh toán thành công!</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.9;">Đơn hàng <strong>${data.orderId}</strong> đã được thanh toán</p>
  </div>
  <div style="background: #f9f9f9; padding: 24px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Xin chào <strong>${data.customerName}</strong>,</p>
    <p>Đơn hàng của bạn đã được thanh toán thành công. Chúng tôi sẽ bắt đầu chuẩn bị và giao hàng sớm nhất.</p>
    
    <h3 style="margin-top: 24px;">Chi tiết đơn hàng</h3>
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #f0f0f0;">
          <th style="padding: 12px; text-align: left;">Sản phẩm</th>
          <th style="padding: 12px; text-align: center;">SL</th>
          <th style="padding: 12px; text-align: right;">Giá</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    
    <p style="margin-top: 16px; font-size: 18px; font-weight: bold;">Tổng cộng: $${data.totalPrice.toFixed(2)}</p>
    
    <h3 style="margin-top: 24px;">Địa chỉ giao hàng</h3>
    <p><strong>${data.receiverName}</strong><br>${data.receiverPhone}<br>${data.receiverAddress}</p>
    
    <p style="margin-top: 24px; color: #666; font-size: 14px;">
      Cảm ơn bạn đã mua sắm! Chúc bạn có trải nghiệm tuyệt vời với sản phẩm.
    </p>
  </div>
</body>
</html>
  `.trim();
}

export async function sendOrderPlacedEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('RESEND_API_KEY not set, skipping order placed email');
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `[Shop] Xác nhận đơn hàng #${data.orderId.slice(0, 8)}`,
      html: buildOrderPlacedHtml(data),
    });

    if (error) {
      console.error('Failed to send order placed email:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Order placed email error:', err);
    return { success: false, error: (err as Error).message };
  }
}

export async function sendOrderSuccessEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('RESEND_API_KEY not set, skipping order success email');
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `[Shop] Thanh toán thành công - Đơn hàng #${data.orderId.slice(0, 8)}`,
      html: buildOrderSuccessHtml(data),
    });

    if (error) {
      console.error('Failed to send order success email:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Order success email error:', err);
    return { success: false, error: (err as Error).message };
  }
}
