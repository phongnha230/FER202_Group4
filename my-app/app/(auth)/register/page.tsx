'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Simple Toast Notification Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 text-sm rounded-lg shadow-lg animate-in slide-in-from-right-5 fade-in duration-300 ${
            type === 'success' ? 'text-green-800 bg-green-50 border border-green-200' : 'text-red-800 bg-red-50 border border-red-200'
        }`} role="alert">
            {type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-4 hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default function RegisterPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'register' | 'verify'>('register');
    const [loading, setLoading] = useState(false);
    
    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Check if email confirmation is required (session is null implies email needs confirming)
            if (data.user && !data.session) {
                showNotification(`Confirmation code sent to ${email}. Please enter it below.`, 'success');
                setStep('verify');
            } else if (data.session) {
                // If no email confirmation is required (unlikely given settings), redirect immediately
                 router.push('/');
                 router.refresh();
            }

        } catch (error) {
            showNotification(error instanceof Error ? error.message : 'An error occurred during registration', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup'
            });

            if (error) throw error;

            if (data.session) {
                showNotification('Account verified! Logging you in...', 'success');
                router.push('/');
                router.refresh();
            }

        } catch (error) {
            showNotification(error instanceof Error ? error.message : 'Invalid verification code', 'error');
        } finally {
            setLoading(false);
        }
    };

    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        if (resendTimer > 0) {
            const interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [resendTimer]);

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });
            if (error) throw error;
            showNotification('Verification code resent!', 'success');
            setResendTimer(30);
        } catch (error) {
            showNotification(error instanceof Error ? error.message : 'Failed to resend code', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-white h-[calc(100vh-4rem)] overflow-hidden relative">
            {/* Notification Toast */}
            {notification && (
                <Toast 
                    message={notification.message} 
                    type={notification.type} 
                    onClose={() => setNotification(null)} 
                />
            )}

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
                            {step === 'register' ? 'Join the Nest' : 'Verify Account'}
                        </h1>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {step === 'register' 
                                ? 'Secure your fit. Create an account for faster checkout and exclusive drops.'
                                : `Enter the 8-digit code sent to ${email}.`
                            }
                        </p>
                    </div>

                    {step === 'register' ? (
                        <form className="space-y-6" onSubmit={handleRegister}>
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
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        disabled={loading}
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
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
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
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={loading}
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

                            <Button 
                                type="submit" 
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide py-7 uppercase text-sm mt-4"
                                disabled={loading}
                            >
                                {loading ? 'Sending Code...' : 'Create Account'}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleVerify}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Verification Code
                                    </Label>
                                    <Input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        placeholder="Enter 8-digit code"
                                        required
                                        className="bg-slate-50 border-input-border py-6 font-medium tracking-[0.5em] text-center text-xl"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        disabled={loading}
                                        maxLength={8}
                                    />
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide py-7 uppercase text-sm mt-4 transition-colors"
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </Button>
                            
                             <div className="mt-6 flex flex-col items-center space-y-3">
                                <button 
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendTimer > 0 || loading}
                                    className={`text-sm font-medium ${resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-900 hover:text-black underline'}`}
                                >
                                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Verification Code'}
                                </button>
                                
                                <button 
                                    type="button"
                                    onClick={() => setStep('register')}
                                    className="text-xs font-medium text-slate-500 hover:text-slate-900"
                                >
                                    Wrong email? Go back
                                </button>
                            </div>
                        </form>
                    )}

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
