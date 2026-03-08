import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
    const featureMessages = [
        {
            eyebrow: 'Fast Dispatch',
            title: 'Ship in 24 hours',
            description: 'Priority packing for the latest drops so your order moves out quickly.',
        },
        {
            eyebrow: 'Premium Quality',
            title: 'Built for daily wear',
            description: 'Heavyweight fabrics, clean stitching, and durable finishes on every piece.',
        },
        {
            eyebrow: 'Easy Returns',
            title: '7-day exchange support',
            description: 'Wrong fit or color? We keep the exchange flow simple and responsive.',
        },
        {
            eyebrow: 'Member Access',
            title: 'Early drop notifications',
            description: 'Subscribers get first-look alerts for limited collections and restocks.',
        },
    ];

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
        <footer className="bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),transparent_18%),radial-gradient(circle_at_82%_24%,rgba(110,231,183,0.24),transparent_30%),radial-gradient(circle_at_18%_78%,rgba(251,191,36,0.16),transparent_24%),linear-gradient(135deg,#f7faf4_0%,#e3eee3_48%,#d8e9df_100%)] text-white">
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_30%),linear-gradient(180deg,rgba(20,31,28,0.94),rgba(10,17,15,0.98))]">
                <div className="max-w-6xl mx-auto px-6 md:px-8 py-10 md:py-12">
                    <div className="mx-auto mb-8 max-w-2xl text-center">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/80">
                            Why Shop With Us
                        </p>
                        <h2 className="mt-3 text-2xl font-extrabold text-white md:text-3xl">
                            Fast support for every order
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            Everything from dispatch to returns is designed to feel quick, simple, and premium.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-5">
                        {featureMessages.map((message) => (
                            <div
                                key={message.title}
                                className="rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-5 backdrop-blur-sm"
                            >
                                <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">
                                    {message.eyebrow}
                                </p>
                                <h3 className="mt-3 text-lg font-bold text-white">
                                    {message.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                    {message.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-6 md:px-8">
                <div className="h-px w-full bg-[linear-gradient(90deg,rgba(148,163,184,0),rgba(148,163,184,0.52),rgba(148,163,184,0))]" />
            </div>

            {/* Main Footer Content */}
            <div className="max-w-6xl mx-auto px-6 md:px-8 py-16 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

                    {/* Newsletter Section - Left Side */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Heading */}
                        <div>
                            <h3 className="text-3xl md:text-4xl font-extrabold leading-tight text-slate-900">
                                JOIN THE
                            </h3>
                            <h3 className="text-3xl md:text-4xl font-extrabold text-emerald-700 leading-tight">
                                NEST
                            </h3>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                            Drop your email to get early access to our most limited drops and seasonal lookbooks.
                        </p>

                        {/* Email Input */}
                        <div className="flex items-center border-b border-slate-400 pb-3 max-w-xs mt-8">
                            <input
                                type="email"
                                placeholder="YOUR EMAIL ADDRESS"
                                className="bg-transparent text-xs text-slate-900 placeholder:text-slate-500 outline-none flex-1 tracking-widest"
                            />
                            <button className="text-slate-900 hover:text-emerald-700 transition-colors ml-4">
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
                                                className="text-sm text-slate-700 hover:text-slate-950 transition-colors"
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
                                                className="text-sm text-slate-700 hover:text-slate-950 transition-colors"
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
                                                className="text-sm text-slate-700 hover:text-slate-950 transition-colors"
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
            <div className="border-t border-white/40 bg-white/35 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 text-slate-900">
                        <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        <span className="font-bold text-sm tracking-wider">URBANNEST</span>
                    </Link>

                    {/* Copyright */}
                    <p className="text-[10px] text-slate-600 tracking-wide">
                        &copy; {new Date().getFullYear()} URBANNEST CLOTHING INC. ALL RIGHTS RESERVED. BUILT FOR THE STREETS.
                    </p>
                </div>
            </div>
        </footer>
    );
}



