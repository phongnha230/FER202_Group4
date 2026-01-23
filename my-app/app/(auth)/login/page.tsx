import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="w-full max-w-[400px] space-y-8">
                {/* Logo and Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-6">
                        <span className="text-sm font-bold tracking-widest uppercase border border-slate-900 px-3 py-1">
                            URBANNEST
                        </span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your details to access your account.
                    </p>
                </div>

                {/* Login Form */}
                <form className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="name@example.com"
                                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-medium text-slate-500 hover:text-slate-900"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors pr-10"
                                />
                                {/* Eye icon placeholder - in a real app use lucide-react Eye/EyeOff */}
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide py-6">
                        SIGN IN
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full py-5 border-slate-200 hover:bg-slate-50">
                        {/* Google Icon Placeholder or SVG */}
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                        Google
                    </Button>
                    <Button variant="outline" className="w-full py-5 border-slate-200 hover:bg-slate-50">
                        {/* Apple Icon Placeholder or SVG */}
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24.02-1.25.53-2.31.32-3.32-.88C3.15 15.1 4.54 7.6 10.39 7.37c1.37.05 2.4.67 3.22.67.81 0 2.21-.77 3.51-.62.58.07 2.26.25 3.35 1.83-2.86 1.74-2.38 5.75.56 7.01-.58 1.69-1.39 3.07-2.37 4.02h-.01zM13.06 4.88c.7-.85 1.18-2.04.99-3.24-1.04.05-2.31.71-3.03 1.58-.64.76-1.21 1.94-1.03 3.12 1.15.09 2.34-.65 3.07-1.46z" />
                        </svg>
                        Apple
                    </Button>
                </div>

                {/* Footer Link */}
                <div className="text-center text-sm">
                    <span className="text-muted-foreground">New here? </span>
                    <Link href="/register" className="font-semibold text-slate-900 hover:underline">
                        Create account
                    </Link>
                </div>
            </div>
        </div>
    );
}
