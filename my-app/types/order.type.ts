import { Order as DBOrder, OrderItem as DBOrderItem, Product, ProductVariant, ShippingOrder, Payment } from './database.types';

// Extended OrderItem with product details
export interface OrderItemWithProduct extends DBOrderItem {
  variant?: ProductVariant;
  product?: Product & {
    images?: Array<{ image_url: string }>;
  };
}

// Extended Order with all related data
export interface OrderWithDetails extends DBOrder {
  items?: OrderItemWithProduct[];
  shipping?: ShippingOrder;
  payment?: Payment;
}

// Request types for creating orders
export interface CreateOrderRequest {
  cart_id: string;
  total_price: number;
  payment_method: 'online' | 'cod';
  /** Gateway for online payment: momo, vnpay, card. Required when payment_method is 'online'. */
  payment_gateway?: 'momo' | 'vnpay' | 'card';
  shipping_info: {
    receiver_name: string;
    receiver_phone: string;
    receiver_address: string;
  };
}

// Order status update request
export interface UpdateOrderStatusRequest {
  order_status: DBOrder['order_status'];
}

// Order filters for listing
export interface OrderFilters {
  status?: DBOrder['order_status'];
  payment_status?: DBOrder['payment_status'];
  limit?: number;
  offset?: number;
}

// Order statistics
export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  completed_orders: number;
}
