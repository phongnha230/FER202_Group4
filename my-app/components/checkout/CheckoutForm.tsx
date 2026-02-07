'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, QrCode, Banknote, Wallet } from 'lucide-react';
import { useCheckoutStore } from '@/store/checkout.store';
import { useEffect } from 'react';
import { useUserStore } from '@/store/user.store';

export default function CheckoutForm() {
    const { formData, setFormData, error } = useCheckoutStore();
    const { user } = useUserStore();

    // Pre-fill email from user if authenticated
    useEffect(() => {
        if (user?.email && !formData.email) {
            setFormData({ email: user.email });
        }
    }, [user?.email, formData.email, setFormData]);

    const handlePaymentMethodChange = (value: string) => {
        setFormData({ 
            paymentMethod: value as 'card' | 'vnpay' | 'momo' | 'cod' 
        });
    };

    return (
        <form className="space-y-10 py-4" id="checkout-form">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* 01. Contact Information */}
            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">01. Contact information</h2>
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input 
                            id="email" 
                            placeholder="jordan@example.com" 
                            type="email" 
                            value={formData.email}
                            onChange={(e) => setFormData({ email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="marketing" 
                            checked={formData.marketingConsent}
                            onCheckedChange={(checked) => setFormData({ marketingConsent: checked === true })}
                        />
                        <Label htmlFor="marketing" className="text-sm font-normal text-gray-600">
                            Email me with news and offers
                        </Label>
                    </div>
                </div>
            </section>

            {/* 02. Shipping Address */}
            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">02. Shipping address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input 
                            id="firstName" 
                            placeholder="Jordan" 
                            value={formData.firstName}
                            onChange={(e) => setFormData({ firstName: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input 
                            id="lastName" 
                            placeholder="Smith" 
                            value={formData.lastName}
                            onChange={(e) => setFormData({ lastName: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="phone">Phone number</Label>
                        <Input 
                            id="phone" 
                            placeholder="+84 123 456 789" 
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ phone: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input 
                            id="address" 
                            placeholder="123 Street Name, Apt 4B" 
                            value={formData.address}
                            onChange={(e) => setFormData({ address: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="city">City</Label>
                        <Input 
                            id="city" 
                            placeholder="Ho Chi Minh City" 
                            value={formData.city}
                            onChange={(e) => setFormData({ city: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="country">Country</Label>
                        <Select 
                            value={formData.country}
                            onValueChange={(value) => setFormData({ country: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vietnam">🇻🇳 Vietnam</SelectItem>
                                <SelectItem value="thailand">🇹🇭 Thailand</SelectItem>
                                <SelectItem value="singapore">🇸🇬 Singapore</SelectItem>
                                <SelectItem value="malaysia">🇲🇾 Malaysia</SelectItem>
                                <SelectItem value="indonesia">🇮🇩 Indonesia</SelectItem>
                                <SelectItem value="philippines">🇵🇭 Philippines</SelectItem>
                                <SelectItem value="myanmar">🇲🇲 Myanmar</SelectItem>
                                <SelectItem value="cambodia">🇰🇭 Cambodia</SelectItem>
                                <SelectItem value="laos">🇱🇦 Laos</SelectItem>
                                <SelectItem value="brunei">🇧🇳 Brunei</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            {/* 03. Payment Method */}
            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">03. Phương thức thanh toán</h2>
                <RadioGroup 
                    value={formData.paymentMethod} 
                    onValueChange={handlePaymentMethodChange}
                    className="space-y-4"
                >
                    {/* Credit Card */}
                    <div className="border rounded-lg p-4 flex items-start space-x-3 [&:has(:checked)]:border-black [&:has(:checked)]:bg-gray-50">
                        <RadioGroupItem value="card" id="card" className="mt-1" />
                        <div className="flex-1">
                            <Label htmlFor="card" className="font-semibold flex items-center gap-2 cursor-pointer">
                                Credit Card
                                <div className="ml-auto flex gap-2 text-gray-400">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                            </Label>

                            {/* Card Details (Only visible if selected) */}
                            {formData.paymentMethod === 'card' && (
                                <div className="mt-4 grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="cardNumber" className="text-xs text-gray-500">Số thẻ</Label>
                                        <Input 
                                            id="cardNumber" 
                                            placeholder="0000 0000 0000 0000" 
                                            value={formData.cardNumber || ''}
                                            onChange={(e) => setFormData({ cardNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="expiry" className="text-xs text-gray-500">Ngày hết hạn (MM / YY)</Label>
                                            <Input 
                                                id="expiry" 
                                                placeholder="MM / YY" 
                                                value={formData.expiry || ''}
                                                onChange={(e) => setFormData({ expiry: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="cvc" className="text-xs text-gray-500">Mã bảo mật</Label>
                                            <Input 
                                                id="cvc" 
                                                placeholder="CVC" 
                                                value={formData.cvc || ''}
                                                onChange={(e) => setFormData({ cvc: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="cardName" className="text-xs text-gray-500">Tên trên thẻ</Label>
                                        <Input 
                                            id="cardName" 
                                            value={formData.cardName || ''}
                                            onChange={(e) => setFormData({ cardName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* VNPay */}
                    <div className="border rounded-lg p-4 flex items-center space-x-3 [&:has(:checked)]:border-black [&:has(:checked)]:bg-gray-50">
                        <RadioGroupItem value="vnpay" id="vnpay" />
                        <Label htmlFor="vnpay" className="font-semibold flex-1 flex items-center cursor-pointer">
                            VNPay
                            <Wallet className="ml-auto h-5 w-5 text-gray-500" />
                        </Label>
                    </div>

                    {/* MoMo */}
                    <div className="border rounded-lg p-4 flex items-center space-x-3 [&:has(:checked)]:border-black [&:has(:checked)]:bg-gray-50">
                        <RadioGroupItem value="momo" id="momo" />
                        <Label htmlFor="momo" className="font-semibold flex-1 flex items-center cursor-pointer">
                            Ví MoMo
                            <QrCode className="ml-auto h-5 w-5 text-[#a50064]" />
                        </Label>
                    </div>

                    {/* COD */}
                    <div className="border rounded-lg p-4 flex items-center space-x-3 [&:has(:checked)]:border-black [&:has(:checked)]:bg-gray-50">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="font-semibold flex-1 flex items-center cursor-pointer">
                            Thanh toán khi nhận hàng (COD)
                            <Banknote className="ml-auto h-5 w-5 text-green-600" />
                        </Label>
                    </div>
                </RadioGroup>
            </section>
        </form>
    );
}
