'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, AlertCircle, CheckCircle2, X, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
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

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            showNotification('Password reset link sent! Check your email.', 'success');
            setEmailSent(true);
        } catch (error) {
            showNotification(error instanceof Error ? error.message : 'An error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-white h-[calc(100vh-4rem)] overflow-hidden relative">
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
                    <div className="mb-6">
                        <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>
                    </div>

                    <div className="space-y-2 mb-10">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase">
                            Reset Password
                        </h1>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {emailSent 
                                ? 'Check your email for a link to reset your password.'
                                : 'Enter your email address and we&apos;ll send you a link to reset your password.'
                            }
                        </p>
                    </div>

                    {!emailSent ? (
                        <form className="space-y-6" onSubmit={handleResetRequest}>
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

                            <Button 
                                type="submit" 
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide py-7 uppercase text-sm mt-4"
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                    We are sent a password reset link to <span className="font-semibold">{email}</span>
                                </p>
                            </div>
                            
                            <Button 
                                onClick={() => setEmailSent(false)}
                                variant="outline"
                                className="w-full py-6"
                            >
                                Send to different email
                            </Button>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Remember your password?{' '}
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
                        <Image
                            src="/banners/neon-nights.jpg"
                            alt="Urban Fashion"
                            fill
                            sizes="(max-width: 1024px) 0vw, 50vw"
                            className="object-cover drop-shadow-2xl grayscale hover:grayscale-0 transition-all duration-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center -z-10">
                            <span className="text-9xl font-black text-white/50 select-none">NEST</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
