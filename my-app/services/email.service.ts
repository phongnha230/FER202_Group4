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
  shippingFee: number;
  itemSubtotal?: number;
  taxes?: number;
  orderItems: Array<{ productName: string; variantInfo: string; quantity: number; price: number }>;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  cancelledBy?: 'user' | 'admin';
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
    
    <div style="margin-top: 16px; background: white; border-radius: 8px; padding: 12px; border: 1px solid #eee;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;">
        <span>Tạm tính</span>
        <span>$${(data.itemSubtotal ?? (data.totalPrice - data.shippingFee)).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;">
        <span>Phí vận chuyển</span>
        <span>${data.shippingFee > 0 ? `$$${data.shippingFee.toFixed(2)}` : 'Miễn phí'}</span>
      </div>
      ${data.taxes != null ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;"><span>Thuế</span><span>$$${data.taxes.toFixed(2)}</span></div>` : ''}
      <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #eee; font-size: 18px; font-weight: bold;">
        <span>Tổng cộng</span>
        <span>$${data.totalPrice.toFixed(2)}</span>
      </div>
    </div>
    
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
    
    <div style="margin-top: 16px; background: white; border-radius: 8px; padding: 12px; border: 1px solid #eee;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;">
        <span>Tạm tính</span>
        <span>$${(data.itemSubtotal ?? (data.totalPrice - data.shippingFee)).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;">
        <span>Phí vận chuyển</span>
        <span>${data.shippingFee > 0 ? `$$${data.shippingFee.toFixed(2)}` : 'Miễn phí'}</span>
      </div>
      ${data.taxes != null ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;"><span>Thuế</span><span>$$${data.taxes.toFixed(2)}</span></div>` : ''}
      <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #eee; font-size: 18px; font-weight: bold;">
        <span>Tổng cộng</span>
        <span>$${data.totalPrice.toFixed(2)}</span>
      </div>
    </div>
    
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

function buildOrderDeliveredHtml(data: OrderEmailData): string {
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
  <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
    <div style="font-size: 48px; margin-bottom: 8px;">✅</div>
    <h1 style="margin: 0; font-size: 24px;">Đơn hàng đã giao thành công!</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.9;">Mã đơn hàng: <strong>${data.orderId.slice(0, 8).toUpperCase()}</strong></p>
  </div>
  <div style="background: #f9f9f9; padding: 24px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Xin chào <strong>${data.customerName}</strong>,</p>
    <p>Tuyệt vời! Đơn hàng của bạn đã được giao đến địa chỉ nhận hàng thành công. Chúng tôi hy vọng bạn hài lòng với sản phẩm! 🎉</p>

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

    <div style="margin-top: 16px; background: white; border-radius: 8px; padding: 12px; border: 1px solid #eee;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;">
        <span>Tạm tính</span>
        <span>$${(data.itemSubtotal ?? (data.totalPrice - data.shippingFee)).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;">
        <span>Phí vận chuyển</span>
        <span>${data.shippingFee > 0 ? `$$${data.shippingFee.toFixed(2)}` : 'Miễn phí'}</span>
      </div>
      ${data.taxes != null ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;"><span>Thuế</span><span>$$${data.taxes.toFixed(2)}</span></div>` : ''}
      <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #eee; font-size: 18px; font-weight: bold;">
        <span>Tổng cộng</span>
        <span>$${data.totalPrice.toFixed(2)}</span>
      </div>
    </div>

    <h3 style="margin-top: 24px;">Địa chỉ giao hàng</h3>
    <p><strong>${data.receiverName}</strong><br>${data.receiverPhone}<br>${data.receiverAddress}</p>

    <div style="margin-top: 24px; padding: 16px; background: #ecfdf5; border-left: 4px solid #16a34a; border-radius: 4px;">
      <p style="margin: 0; color: #15803d; font-weight: bold;">Bạn có hài lòng với đơn hàng không?</p>
      <p style="margin: 8px 0 0 0; color: #166534; font-size: 14px;">Hãy để lại đánh giá để giúp chúng tôi cải thiện dịch vụ tốt hơn nhé!</p>
    </div>

    <p style="margin-top: 24px; color: #666; font-size: 14px;">
      Cảm ơn bạn đã tin tưởng và mua sắm tại Shop chúng tôi. Hẹn gặp lại! 👋
    </p>
  </div>
</body>
</html>
  `.trim();
}

export async function sendOrderDeliveredEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('RESEND_API_KEY not set, skipping order delivered email');
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `[Shop] Đơn hàng #${data.orderId.slice(0, 8).toUpperCase()} đã giao thành công! 🎉`,
      html: buildOrderDeliveredHtml(data),
    });

    if (error) {
      console.error('Failed to send order delivered email:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Order delivered email error:', err);
    return { success: false, error: (err as Error).message };
  }
}

function buildOrderCancelledHtml(data: OrderEmailData): string {
  const cancelledByAdmin = data.cancelledBy === 'admin';
  const itemsHtml = data.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${item.productName} (${item.variantInfo})</td>
      <td style="padding: 8px; border-bottom: 1px solid #fecaca; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #fecaca; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const subtotal = data.totalPrice - data.shippingFee;
  const shippingText = data.shippingFee > 0 ? `$${data.shippingFee.toFixed(2)}` : 'Miễn phí';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
    <div style="font-size: 48px; margin-bottom: 8px;">❌</div>
    <h1 style="margin: 0; font-size: 24px;">Đơn hàng đã bị hủy</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.9;">Mã đơn hàng: <strong>${data.orderId.slice(0, 8).toUpperCase()}</strong></p>
  </div>
  <div style="background: #fff5f5; padding: 24px; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Xin chào <strong>${data.customerName}</strong>,</p>
    <p>${cancelledByAdmin
      ? 'Đơn hàng của bạn đã bị hủy bởi <strong>quản trị viên</strong>. Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi để được hỗ trợ.'
      : 'Đơn hàng của bạn đã được hủy thành công theo yêu cầu của bạn.'}
    </p>

    <h3 style="margin-top: 24px; color: #b91c1c;">Chi tiết đơn hàng bị hủy</h3>
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #fecaca;">
      <thead>
        <tr style="background: #fef2f2;">
          <th style="padding: 12px; text-align: left; color: #b91c1c;">Sản phẩm</th>
          <th style="padding: 12px; text-align: center; color: #b91c1c;">SL</th>
          <th style="padding: 12px; text-align: right; color: #b91c1c;">Giá</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div style="margin-top: 16px; background: white; border-radius: 8px; padding: 12px; border: 1px solid #fecaca;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;">
        <span>Tạm tính</span>
        <span>$${subtotal.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;">
        <span>Phí vận chuyển</span>
        <span>${shippingText}</span>
      </div>
      ${data.taxes != null ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #555;"><span>Thuế</span><span>$$${data.taxes.toFixed(2)}</span></div>` : ''}
      <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #fecaca; font-size: 18px; font-weight: bold; color: #b91c1c;">
        <span>Tổng đơn hàng</span>
        <span>$${data.totalPrice.toFixed(2)}</span>
      </div>
    </div>

    ${data.totalPrice > 0 ? `
    <div style="margin-top: 20px; padding: 16px; background: #fef9c3; border-left: 4px solid #ca8a04; border-radius: 4px;">
      <p style="margin: 0; color: #854d0e; font-weight: bold;">Thông tin hoàn tiền</p>
      <p style="margin: 8px 0 0 0; color: #713f12; font-size: 14px;">Nếu bạn đã thanh toán, số tiền <strong>$${data.totalPrice.toFixed(2)}</strong> sẽ được hoàn trả trong vòng 3–5 ngày làm việc.</p>
    </div>` : ''}

    <p style="margin-top: 24px; color: #666; font-size: 14px;">
      Cảm ơn bạn đã mua sắm tại Shop chúng tôi. Chúng tôi mong được phục vụ bạn trong lần tới! 🙏
    </p>
  </div>
</body>
</html>
  `.trim();
}

export async function sendOrderCancelledEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    console.warn('RESEND_API_KEY not set, skipping order cancelled email');
    return { success: true };
  }

  const cancelledByLabel = data.cancelledBy === 'admin' ? 'bởi Admin' : 'theo yêu cầu của bạn';

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `[Shop] Đơn hàng #${data.orderId.slice(0, 8).toUpperCase()} đã bị hủy ${cancelledByLabel}`,
      html: buildOrderCancelledHtml(data),
    });

    if (error) {
      console.error('Failed to send order cancelled email:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Order cancelled email error:', err);
    return { success: false, error: (err as Error).message };
  }
}
