'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Wallet, Smartphone, QrCode } from 'lucide-react';

export default function CheckoutForm() {
    return (
        <form className="space-y-10 py-4">
            {/* 01. Contact Information */}
            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">01. Contact information</h2>
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input id="email" placeholder="jordan@example.com" type="email" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="marketing" />
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
                        <Input id="firstName" placeholder="Jordan" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input id="lastName" placeholder="Smith" />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" placeholder="123 Street Name, Apt 4B" />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="Ho Chi Minh City" />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="country">Country</Label>
                        <Select defaultValue="vietnam">
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
                <h2 className="text-xl font-bold text-gray-900 mb-6">03. Payment method</h2>
                <RadioGroup defaultValue="card" className="space-y-4">
                    <div className="border rounded-lg p-4 flex items-start space-x-3 [&:has(:checked)]:border-black [&:has(:checked)]:bg-gray-50">
                        <RadioGroupItem value="card" id="card" className="mt-1" />
                        <div className="flex-1">
                            <Label htmlFor="card" className="font-semibold flex items-center gap-2 cursor-pointer">
                                Credit Card
                                <div className="ml-auto flex gap-2 text-gray-400">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                            </Label>

                            {/* Card Details (Only visible if selected - mocked always visible for now based on design) */}
                            <div className="mt-4 grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="cardNumber" className="text-xs text-gray-500">Card number</Label>
                                    <Input id="cardNumber" placeholder="0000 0000 0000 0000" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="expiry" className="text-xs text-gray-500">Expiration (MM / YY)</Label>
                                        <Input id="expiry" placeholder="MM / YY" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="cvc" className="text-xs text-gray-500">Security code</Label>
                                        <Input id="cvc" placeholder="CVC" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cardName" className="text-xs text-gray-500">Name on card</Label>
                                    <Input id="cardName" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border rounded-lg p-4 flex items-center space-x-3 [&:has(:checked)]:border-black">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="font-semibold flex-1 flex items-center cursor-pointer">
                            PayPal
                            <Wallet className="ml-auto h-5 w-5 text-gray-500" />
                        </Label>
                    </div>
                    <div className="border rounded-lg p-4 flex items-center space-x-3 [&:has(:checked)]:border-black">
                        <RadioGroupItem value="apple" id="apple" />
                        <Label htmlFor="apple" className="font-semibold flex-1 flex items-center cursor-pointer">
                            Apple Pay
                            <Smartphone className="ml-auto h-5 w-5 text-gray-500" />
                        </Label>
                    </div>
                    <div className="border rounded-lg p-4 flex items-center space-x-3 [&:has(:checked)]:border-black">
                        <RadioGroupItem value="momo" id="momo" />
                        <Label htmlFor="momo" className="font-semibold flex-1 flex items-center cursor-pointer">
                            MoMo
                            <QrCode className="ml-auto h-5 w-5 text-gray-500" />
                        </Label>
                    </div>
                </RadioGroup>
            </section>
        </form>
    );
}
