import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create an unmodified response if we don't need to refresh the session
  // checking cookies on the request is enough for now to see if we have a session
  // But strictly we should call getUser

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getSession() to read from cookies directly (no network call)
  // getUser() requires a Supabase API call which can fail and incorrectly redirect logged-in users
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const path = request.nextUrl.pathname;

  // ADMIN ROUTE PROTECTION
  if (path.startsWith('/admin')) {
    // Skip the old /admin/login page - redirect to main login
    if (path === '/admin/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // If not logged in, redirect to main login page
    if (!user) {
       const url = request.nextUrl.clone()
       url.pathname = '/login'
       return NextResponse.redirect(url)
    }

    // If logged in with Supabase, check role
    if (user) {
        // Prefer token claims first to avoid an extra DB query on every admin route.
        let role = user.app_metadata?.role || user.user_metadata?.role;
        
        // Fallback to profiles when claim is not present.
        if (!role) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            role = profile?.role;
        }

        // If not admin, redirect to home
        if (role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
        // If admin, allow access
    }
  }

  // CUSTOMER ROUTE PROTECTION
  const protectedCustomerRoutes = ['/cart', '/checkout', '/my-orders'];
  if (protectedCustomerRoutes.some(route => path.startsWith(route))) {
      if (!user) {
          const url = request.nextUrl.clone()
          url.pathname = '/login' // Assuming general login page is /login or (auth)/login checks
          return NextResponse.redirect(url)
      }
  }

  return response
}
