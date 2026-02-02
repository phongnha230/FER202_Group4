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

  // fetching user from supabase
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname;

  // ADMIN ROUTE PROTECTION
  if (path.startsWith('/admin')) {
    // If not logged in, redirect to admin login
    if (!user && path !== '/admin/login') {
       const url = request.nextUrl.clone()
       url.pathname = '/admin/login'
       return NextResponse.redirect(url)
    }

    // If logged in, check role
    if (user) {
        // We need to fetch the role from profiles
        // getUser doesn't return custom claims/role by default unless set in metadata
        // So we query the profiles table
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        
        const role = profile?.role;

        if (path === '/admin/login') {
             // Already logged in as admin -> dashboard
             if (role === 'admin') {
                 const url = request.nextUrl.clone()
                 url.pathname = '/admin/dashboard'
                 return NextResponse.redirect(url)
             }
             // Logged in but not admin -> error or home?
             // Maybe verify if they are trying to login as admin but are customer?
             // For now, let them stay or redirect to home? 
             // Let's redirect to home if customer
             if (role !== 'admin') {
                const url = request.nextUrl.clone()
                 url.pathname = '/'
                 return NextResponse.redirect(url)
             }
        } else {
             // Accessing other /admin routes
             if (role !== 'admin') {
                 const url = request.nextUrl.clone()
                 url.pathname = '/' // or 403 page
                 return NextResponse.redirect(url)
             }
        }
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
