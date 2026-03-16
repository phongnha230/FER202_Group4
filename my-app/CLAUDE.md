# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

No test suite is configured.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, for admin operations)
- `RESEND_API_KEY` + `EMAIL_FROM` (email notifications)

## Architecture

**Next.js 15 App Router** with TailwindCSS v4, Supabase (PostgreSQL + Auth), Zustand for client state.

### Route Structure

- `app/(auth)/` — Login, register, forgot/reset password pages. No navbar/layout wrapper.
- `app/(public)/` — Customer-facing storefront (home, product pages, cart, checkout, orders, account).
- `app/admin/` — Admin dashboard (products, orders, customers, inventory, reviews).
- `app/api/` — API routes for auth callbacks, admin operations, AI chat, email notifications, payment webhook.

### Auth & Middleware

Auth is handled by Supabase SSR. `middleware.ts` runs `updateSession()` from `lib/supabase/middleware.ts` on:
- `/admin/:path*` — requires Supabase session + `role === 'admin'` (checked from `app_metadata`, `user_metadata`, or `profiles` table fallback). `/admin/login` redirects to `/login`.
- `/cart`, `/checkout`, `/my-orders` — requires any authenticated session.

Role is stored in Supabase `profiles` table and/or JWT claims (`app_metadata.role`).

### Supabase Client Patterns

- `lib/supabase/client.ts` — Browser client (singleton), use in Client Components
- `lib/supabase/server.ts` — Server client with cookie handling, use in Server Components and API routes
- `lib/supabase/admin.ts` — Service role client, use only in server-side API routes for privileged ops

### State Management

Zustand stores in `store/`:
- `cart.store.ts` — Cart items, synced via `services/cart-sync.service.ts`
- `checkout.store.ts` — Checkout flow state
- `user.store.ts` — Current user

`AuthProvider` component (`components/AuthProvider.tsx`) wraps the app and syncs Supabase auth state to the user store.

### Services Layer

Business logic lives in `services/`. API routes and Server Components call services; Client Components use `lib/api/` helpers which call API routes or Supabase directly.

### Key Conventions

- Path alias `@/` maps to project root (`my-app/`)
- UI primitives in `components/ui/` are shadcn/ui components (Radix + Tailwind)
- Database types auto-generated in `types/database.types.ts`
- SQL migrations/fixes are in `supabase/` directory
- The `app/admin/login/page.tsx` is a legacy placeholder — the middleware redirects `/admin/login` to `/login`
