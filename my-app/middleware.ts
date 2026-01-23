import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on every request
export function middleware(request: NextRequest) {
    // For now, just pass through all requests
    // You can add authentication logic here later
    return NextResponse.next();
}

// Configure which paths the middleware should run on
// Empty matcher means it won't run on any paths by default
export const config = {
    matcher: [
        // Add protected routes here when needed
        // '/admin/:path*',
        // '/account/:path*',
    ],
};
