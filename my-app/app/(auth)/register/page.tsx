'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight } from 'lucide-react';

export default function RegisterPage() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-white h-[calc(100vh-4rem)] overflow-hidden">
            {/* Left Side: Form */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:p-16 xl:p-24 overflow-y-auto">
                <div className="flex justify-between items-center mb-12">
                    <span className="text-xl font-bold tracking-tight">URBANNEST</span>
                    <Link href="/login" className="text-sm font-bold tracking-wider uppercase hover:underline">
                        Log In
                    </Link>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                    <div className="space-y-2 mb-10">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase">
                            Join the Nest
                        </h1>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Secure your fit. Create an account for faster checkout and exclusive drops.
                        </p>
                    </div>

                    <form className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Full Name
                                </Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="EX: ALEX STONE"
                                    required
                                    className="bg-slate-50 border-input-border py-6 uppercase placeholder:normal-case font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    className="bg-slate-50 border-input-border py-6 font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Create Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className="bg-slate-50 border-input-border py-6 pr-10 font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 pt-2">
                            <Checkbox id="newsletter" className="mt-1" />
                            <div className="grid gap-1.5 leading-none">
                                <Label
                                    htmlFor="newsletter"
                                    className="text-sm text-slate-600 font-medium leading-normal cursor-pointer"
                                >
                                    Join the Nest newsletter for early drops and exclusive offers.
                                </Label>
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide py-7 uppercase text-sm mt-4">
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="font-bold text-slate-900 border-b-2 border-slate-900 pb-0.5 hover:opacity-80">
                                Log In
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-auto pt-10 text-center lg:text-left">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        © 2026 Urbannest. All Rights Reserved.
                    </p>
                </div>
            </div>

            {/* Right Side: Image */}
            <div className="hidden lg:block w-1/2 bg-slate-100 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
                <div className="relative h-full w-full flex items-center justify-center p-20">
                    <div className="relative w-full aspect-square max-w-lg animate-fade-in-up">
                        {/* Placeholder for the shoe image seen in design - using a shoe placeholder or abstract 3d object */}
                        <Image
                            src="/banners/neon-nights.jpg"
                            alt="Exclusive Footwear"
                            fill
                            className="object-cover drop-shadow-2xl grayscale hover:grayscale-0 transition-all duration-500"
                        />
                        {/* Fallback to text if image fails or use a different known image */}
                        <div className="absolute inset-0 flex items-center justify-center -z-10">
                            <span className="text-9xl font-black text-white/50 select-none">NEST</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
