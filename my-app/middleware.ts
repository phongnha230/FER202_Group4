import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on every request
export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Check if it's an admin path
    if (path.startsWith('/admin')) {
        // Get the session cookie
        const adminSession = request.cookies.get('admin_session')?.value;

        // If on login page and already logged in, redirect to dashboard
        if (path === '/admin/login' && adminSession) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }

        // If not on login page and not logged in, redirect to login
        if (path !== '/admin/login' && !adminSession) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        // If trying to access root /admin, redirect to /admin/dashboard
        if (path === '/admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
    matcher: [
        // Match all paths starting with /admin
        '/admin/:path*',
    ],
};
