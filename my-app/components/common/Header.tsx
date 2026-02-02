"use client";

import Link from 'next/link';
import { ShoppingCart, Search, Menu, User, X, ShoppingBag, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from "react";
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Listen for cart updates and Auth state
  useEffect(() => {
    const updateCount = () => {
      const cart = localStorage.getItem('urban_nest_cart');
      const items: { quantity: number }[] = cart ? JSON.parse(cart) : [];
      const total = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    };

    // Initial checks
    updateCount();
    
    // Check current user
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
    };
    checkUser();

    // Listeners
    window.addEventListener('cart-updated', updateCount);
    window.addEventListener('storage', updateCount);

    // Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
    });

    return () => {
      window.removeEventListener('cart-updated', updateCount);
      window.removeEventListener('storage', updateCount);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/streetwear", label: "Streetwear" },
    { href: "/new-arrivals", label: "New Arrivals" },
    { href: "/sale", label: "Sale" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">UrbanNest</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-blue-500'
                    : 'text-gray-700 hover:text-black'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden lg:flex items-center">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-8 w-64" />
              </div>
            </div>

            {/* User Account / Dropdown */}
            {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name || "User"} />
                        <AvatarFallback>{user.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.user_metadata.full_name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/account/profile" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/my-orders" className="cursor-pointer">
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            <span>My Orders</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
            )}

            {/* My Orders (Icon only visible if not logged in or purely as shortcut? keeping it for now but redundant with dropdown) */}
            {/* Actually, let's keep it but maybe hide if logged in since it's in dropdown? Or better, keep it as quick access */}
             <Button variant="ghost" size="icon" asChild title="My Orders" className="hidden sm:inline-flex">
               <Link href="/my-orders">
                 <ShoppingBag className="h-5 w-5" />
               </Link>
             </Button>


            {/* Shopping Cart */}
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 text-xs text-white flex items-center justify-center animate-in zoom-in spin-in-50 duration-300">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in-down">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-blue-500'
                      : 'text-gray-700 hover:text-black'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {/* Mobile User Actions */}
               <div className="pt-4 border-t space-y-2">
                 {user ? (
                    <>
                        <div className="flex items-center px-2 py-2 mb-2 bg-slate-50 rounded-md">
                             <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={user.user_metadata.avatar_url} />
                                <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                             </Avatar>
                             <div className="flex flex-col">
                                <span className="text-sm font-medium">{user.user_metadata.full_name}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                             </div>
                        </div>
                        <Link href="/account/profile" className="flex items-center text-sm font-medium text-gray-700 hover:text-black px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                             My Profile
                        </Link>
                        <Link href="/my-orders" className="flex items-center text-sm font-medium text-gray-700 hover:text-black px-2 py-1" onClick={() => setMobileMenuOpen(false)}>
                             My Orders
                        </Link>
                        <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="flex items-center text-sm font-medium text-red-600 px-2 py-1 w-full text-left">
                            Log out
                        </button>
                    </>
                 ) : (
                    <Link href="/login" className="flex items-center text-sm font-medium text-gray-700 hover:text-black" onClick={() => setMobileMenuOpen(false)}>
                        Log In
                    </Link>
                 )}
               </div>

              <div className="pt-4 border-t">
                <Input
                  placeholder="Search products..."
                  className="w-full"
                />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
