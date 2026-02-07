import { create } from 'zustand';
import { CreateOrderRequest } from '@/types/order.type';

interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  paymentMethod: 'card' | 'vnpay' | 'momo' | 'cod';
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  cardName?: string;
  marketingConsent: boolean;
}

interface CheckoutState {
  formData: CheckoutFormData;
  isSubmitting: boolean;
  error: string | null;
  setFormData: (data: Partial<CheckoutFormData>) => void;
  resetForm: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  getShippingInfo: () => CreateOrderRequest['shipping_info'];
}

const initialFormData: CheckoutFormData = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  city: '',
  country: 'vietnam',
  paymentMethod: 'card',
  marketingConsent: false,
};

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  formData: initialFormData,
  isSubmitting: false,
  error: null,

  setFormData: (data) => 
    set((state) => ({ 
      formData: { ...state.formData, ...data } 
    })),

  resetForm: () => 
    set({ formData: initialFormData, error: null }),

  setSubmitting: (isSubmitting) => 
    set({ isSubmitting }),

  setError: (error) => 
    set({ error }),

  getShippingInfo: () => {
    const { formData } = get();
    return {
      receiver_name: `${formData.firstName} ${formData.lastName}`.trim(),
      receiver_phone: formData.phone,
      receiver_address: `${formData.address}, ${formData.city}, ${formData.country}`,
    };
  },
}));
