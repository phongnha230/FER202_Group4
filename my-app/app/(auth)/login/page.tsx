'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Lock, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
    
    // Toast notification
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const supabase = createClient();

        try {
            if (loginMethod === 'password') {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Check for admin role
                let role = data.user?.user_metadata?.role;
                
                // If no role in metadata, fetch from profiles table
                if (!role && data.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single();
                    role = profile?.role;
                }

                showToast('Successfully logged in!', 'success');
                router.refresh();
                
                if (role === 'admin') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/');
                }
            } else {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: `${location.origin}/api/auth/callback`,
                    },
                });
                if (error) throw error;
                showToast('Check your email for the login link!', 'success');
            }
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
                redirectTo: `${location.origin}/api/auth/callback`,
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
                        className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-full shadow-lg text-white font-medium ${
                            toast.type === 'success' ? 'bg-slate-900' : 'bg-red-500'
                        }`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px] relative">
                {/* Left Panel - Brand (Hidden on Mobile) */}
                <motion.div 
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-center items-center text-white p-12 overflow-hidden"
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-white/20"></div>
                    <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full border-8 border-white/10"></div>
                    </div>

                    <div className="relative z-10 text-center">
                        <div className="bg-white/10 p-4 rounded-full inline-block mb-6 backdrop-blur-sm">
                            <Flame className="w-12 h-12 text-cyan-400" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter mb-4">
                            WELCOME <span className="text-cyan-400">BACK!</span>
                        </h1>
                        <p className="text-slate-300 max-w-sm mx-auto text-lg mb-8 font-light">
                            To keep connected with us please login with your personal info
                        </p>
                        <Link href="/register">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="border-2 border-white/30 hover:border-white text-white px-10 py-3 rounded-full font-bold tracking-widest uppercase transition-all"
                            >
                                Sign Up
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* Right Panel - Login Form */}
                <motion.div 
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                    className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative"
                >
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center lg:text-left">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">LOGIN</h2>
                            <p className="text-slate-500 font-medium">Login to your account to continue</p>
                        </div>

                        {/* Method Toggle */}
                        <div className="flex gap-6 border-b border-slate-200 pb-1">
                            <button
                                onClick={() => setLoginMethod('password')}
                                className={`pb-2 text-sm font-bold tracking-wide uppercase transition-colors ${
                                    loginMethod === 'password'
                                        ? 'text-slate-900 border-b-2 border-slate-900'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Password
                            </button>
                            <button
                                onClick={() => setLoginMethod('otp')}
                                className={`pb-2 text-sm font-bold tracking-wide uppercase transition-colors ${
                                    loginMethod === 'otp'
                                        ? 'text-slate-900 border-b-2 border-slate-900'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Magic Link
                            </button>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-4">
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
                                
                                {loginMethod === 'password' && (
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
                                )}
                            </div>

                            {loginMethod === 'password' && (
                                <div className="flex justify-end">
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-wide"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                            )}

                            <Button 
                                disabled={isLoading} 
                                className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-widest uppercase shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02]"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : null}
                                {loginMethod === 'password' ? 'Log In' : 'Send Magic Link'}
                            </Button>
                        </form>

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

                        <div className="lg:hidden text-center mt-6">
                            <p className="text-slate-500 font-medium">
                                Don&apos;t have an account?{' '}
                                <Link href="/register" className="text-slate-900 font-bold hover:underline">
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
