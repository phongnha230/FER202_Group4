import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
    const shopLinks = [
        { label: 'Hoodies', href: '/hoodies' },
        { label: 'Outerwear', href: '/outerwear' },
        { label: 'Accessories', href: '/accessories' },
        { label: 'Archive', href: '/archive' },
    ];

    const accountLinks = [
        { label: 'Login', href: '/login' },
        { label: 'Register', href: '/register' },
        { label: 'My Orders', href: '/account/orders' },
        { label: 'Help', href: '/help' },
    ];

    const socialLinks = [
        { label: 'Instagram', href: 'https://instagram.com' },
        { label: 'TikTok', href: 'https://tiktok.com' },
        { label: 'Twitter', href: 'https://twitter.com' },
    ];

    return (
        <footer className="bg-[#0d1b2a] text-white">
            {/* Main Footer Content */}
            <div className="max-w-6xl mx-auto px-6 md:px-8 py-16 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

                    {/* Newsletter Section - Left Side */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Heading */}
                        <div>
                            <h3 className="text-3xl md:text-4xl font-extrabold leading-tight">
                                JOIN THE
                            </h3>
                            <h3 className="text-3xl md:text-4xl font-extrabold text-cyan-400 leading-tight">
                                NEST
                            </h3>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                            Drop your email to get early access to our most limited drops and seasonal lookbooks.
                        </p>

                        {/* Email Input */}
                        <div className="flex items-center border-b border-slate-600 pb-3 max-w-xs mt-8">
                            <input
                                type="email"
                                placeholder="YOUR EMAIL ADDRESS"
                                className="bg-transparent text-xs text-white placeholder:text-slate-500 outline-none flex-1 tracking-widest"
                            />
                            <button className="text-white hover:text-cyan-400 transition-colors ml-4">
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Links Section - Right Side */}
                    <div className="lg:col-span-8 lg:col-start-6">
                        <div className="grid grid-cols-3 gap-8">
                            {/* Shop Links */}
                            <div>
                                <h4 className="text-[10px] tracking-[0.25em] text-slate-500 uppercase mb-5">
                                    Shop
                                </h4>
                                <ul className="space-y-3">
                                    {shopLinks.map((link) => (
                                        <li key={link.href}>
                                            <Link
                                                href={link.href}
                                                className="text-sm text-slate-300 hover:text-white transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Account Links */}
                            <div>
                                <h4 className="text-[10px] tracking-[0.25em] text-slate-500 uppercase mb-5">
                                    Account
                                </h4>
                                <ul className="space-y-3">
                                    {accountLinks.map((link) => (
                                        <li key={link.href}>
                                            <Link
                                                href={link.href}
                                                className="text-sm text-slate-300 hover:text-white transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Social Links */}
                            <div>
                                <h4 className="text-[10px] tracking-[0.25em] text-slate-500 uppercase mb-5">
                                    Social
                                </h4>
                                <ul className="space-y-3">
                                    {socialLinks.map((link) => (
                                        <li key={link.href}>
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-slate-300 hover:text-white transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800/50">
                <div className="max-w-6xl mx-auto px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        <span className="font-bold text-sm tracking-wider">URBANNEST</span>
                    </Link>

                    {/* Copyright */}
                    <p className="text-[10px] text-slate-500 tracking-wide">
                        © {new Date().getFullYear()} URBANNEST CLOTHING INC. ALL RIGHTS RESERVED. BUILT FOR THE STREETS.
                    </p>
                </div>
            </div>
        </footer>
    );
}
