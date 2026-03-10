'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Lock, User, RefreshCcw, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerificationSent, setIsVerificationSent] = useState(false);
    const [otp, setOtp] = useState('');

    // Toast notification
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 6000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    confirmPassword,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Unable to create account');
            }

            showToast('Account created! Please sign in.', 'success');
            
            // Add 5-second delay before redirection
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            router.push('/login');
        } catch (error) {
            showToast((error as Error).message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const supabase = createClient();

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup',
            });

            if (error) throw error;

            showToast('Email verified successfully!', 'success');
            router.push('/');
        } catch (error) {
            showToast((error as Error).message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

     const handleGoogleLogin = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
    };


    return (
         <div className="flex w-full min-h-full bg-transparent items-center justify-center p-4">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-[100] px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] text-white font-bold flex items-center gap-3 border-2 ${
                            toast.type === 'success' 
                            ? 'bg-slate-900 border-cyan-400/30' 
                            : 'bg-red-500 border-white/20'
                        }`}
                    >
                        {toast.type === 'success' && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px] relative">
                 {/* Right Panel - Brand (Hidden on Mobile) - Mirrored Layout */}
                 <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-center items-center text-white p-12 overflow-hidden order-2"
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-10 right-10 w-32 h-32 rounded-full border-4 border-white/20"></div>
                    <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full border-8 border-white/10"></div>
                    </div>

                    <div className="relative z-10 text-center">
                        <div className="bg-white/10 p-4 rounded-full inline-block mb-6 backdrop-blur-sm">
                            <Flame className="w-12 h-12 text-cyan-400" />
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter mb-4">ONE OF <span className="text-cyan-400">US?</span></h2>
                        <p className="text-slate-300 max-w-sm mx-auto text-lg mb-8 font-light">
                            If you already have an account, just sign in. We&apos;ve missed you!
                        </p>
                        <Link href="/login">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="border-2 border-white/30 hover:border-white text-white px-10 py-3 rounded-full font-bold tracking-widest uppercase transition-all"
                            >
                                Sign In
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* Left Panel - Register Form - Mirrored Layout */}
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                    className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative bg-white order-1"
                >
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center lg:text-left">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">CREATE ACCOUNT</h2>
                            <p className="text-slate-500 font-medium">Use your email for registration</p>
                        </div>

                        {!isVerificationSent ? (
                            <>
                                <div className="flex gap-4 justify-center lg:justify-start">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        className="w-full h-12 rounded-full border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold"
                                    >
                                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        Continue with Google
                                    </Button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">
                                            Or
                                        </span>
                                    </div>
                                </div>

                                <form onSubmit={handleRegister} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <Input
                                                type="text"
                                                placeholder="Full Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                className="pl-12 h-12 rounded-full bg-slate-50 border-slate-200 focus:border-slate-900 focus:ring-slate-900/20"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <Input
                                                type="email"
                                                placeholder="Email Address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="pl-12 h-12 rounded-full bg-slate-50 border-slate-200 focus:border-slate-900 focus:ring-slate-900/20"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <Input
                                                type="password"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="pl-12 h-12 rounded-full bg-slate-50 border-slate-200 focus:border-slate-900 focus:ring-slate-900/20"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <Input
                                                type="password"
                                                placeholder="Confirm Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="pl-12 h-12 rounded-full bg-slate-50 border-slate-200 focus:border-slate-900 focus:ring-slate-900/20"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        disabled={isLoading}
                                        className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-widest uppercase shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02]"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        ) : null}
                                        Sign Up
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <div className="space-y-6 text-center animate-in fade-in duration-500">
                                <div className="inline-block p-4 rounded-full bg-green-100 mb-2">
                                    <Mail className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Verify your Email</h3>
                                <p className="text-slate-500">
                                    We&apos;ve sent a verification code to <span className="font-semibold text-slate-900">{email}</span>
                                </p>

                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <Input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                        className="text-center text-2xl tracking-[0.5em] h-14 font-mono rounded-full bg-slate-50 border-slate-200 focus:border-slate-900"
                                    />
                                    <Button
                                        className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                        Verify Account
                                    </Button>
                                </form>

                                <button
                                    onClick={() => setIsVerificationSent(false)}
                                    className="text-sm font-bold text-slate-400 hover:text-slate-900 uppercase tracking-wide flex items-center justify-center w-full"
                                >
                                    <RefreshCcw className="w-4 h-4 mr-2" />
                                    Use a different email
                                </button>
                            </div>
                        )}

                        <div className="lg:hidden text-center mt-6">
                            <p className="text-slate-500 font-medium">
                                Already have an account?{' '}
                                <Link href="/login" className="text-slate-900 font-bold hover:underline">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
