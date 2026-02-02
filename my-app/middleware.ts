import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Configure which paths the middleware should run on
export const config = {
    matcher: [
        // Match all paths starting with /admin
        '/admin/:path*',
        '/cart',
        '/checkout',
        '/my-orders',
    ],
};
