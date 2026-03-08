# 🛒 Shop_nextJs - Full-Stack E-Commerce Experience

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

Welcome to **Shop_nextJs**! 🎉 This is a modern, high-performance, and feature-rich full-stack e-commerce project built with the latest technologies.

_Note: The root repository mainly serves as the GitHub landing page and workspace container, while the core application source code lives inside the `my-app/` directory._

---

## ✨ Project Highlights

Our application provides a seamless shopping experience for customers and a powerful management interface for administrators.

- **🛍️ Public Storefront**: Built with the elegant Next.js App Router for dynamic and highly optimized pages.
- **📦 End-to-End Shopping Flow**: Smooth navigation from product browsing and viewing details, to managing the cart, checking out, and placing orders.
- **🧑‍💻 Customer Portal**: Dedicated pages for account management and detailed order history.
- **⚙️ Admin Dashboard**: A comprehensive control panel managing products, inventory, customer orders, users, and product reviews.
- **🔐 Robust Backend & Auth**: Powered by Supabase for secure authentication, real-time database operations, and scalable SQL setup.
- **🤖 Smart Integrations (Optional)**: Features like AI chat assistance (Google Gemini) and automated email notifications (Resend).

---

## 📂 Repository Architecture

```text
Shop_nextJs/
├── my-app/        👉 Main Next.js application logic
├── .vscode/       👉 Local editor settings
└── README.md      👉 You are reading this right now!
```

---

## 🏗️ Deep Dive into `my-app/`

The heart of the project resides in `my-app/`. Here's how it's organized:

- 📄 `app/`: Next.js App Router pages, layouts, and fast API endpoints.
- 🧩 `components/`: Reusable, styled UI and feature-specific components.
- 🛠️ `services/`: Core business logic and database interactions.
- 🔗 `lib/`: Utility helpers, adapters, Supabase clients, and external API configurations.
- 🏪 `store/`: Fast, client-side state management using Zustand.
- 🐘 `supabase/`: Essential SQL scripts for database initialization, migration, and policies.
- 🖼️ `public/`: Static files, images, and brand assets.

---

## 💻 Tech Stack Powering the App

We leverage industry-leading tools to ensure maximum speed and developer experience:

- **Framework:** Next.js 15
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 & Radix UI primitives
- **Database & Auth:** Supabase
- **State Management:** Zustand
- **Data Visualization:** Recharts
- **Email Service:** Resend 📧
- **AI Integration:** Google Gemini API 🧠

---

## 🚀 Getting Started

Follow these simple steps to run the application locally!

### 1. Enter the App Directory

```bash
cd my-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the example environment file:

```bash
# Mac / Linux
cp .env.example .env.local

# Windows (PowerShell)
Copy-Item .env.example .env.local
```

Fill in the required keys in `.env.local` (see _Environment Variables_ section below).

### 4. Ignite the Server

```bash
npm run dev
```

🎉 Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🔑 Environment Variables

To fully run the app, ensure these keys are populated in your `my-app/.env.local` file (refer to `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` _(Optional)_
- `RESEND_API_KEY` _(Optional)_
- `EMAIL_FROM` _(Optional)_

⚠️ **Security Warning:** Never commit real secrets to source control.

---

## 📜 Useful Commands

Run these scripts inside the `my-app/` directory based on your needs:

| Command         | Action                        |
| --------------- | ----------------------------- |
| `npm run dev`   | Starts the development server |
| `npm run build` | Builds the app for production |
| `npm run start` | Starts the production server  |
| `npm run lint`  | Lints the codebase for errors |

---

## 🗄️ Database Initialization

Supabase SQL setup files are kept neatly in `my-app/supabase/`.

When setting up your Supabase project, you can use these common files:

- `setup.sql` — Main schema initialization
- `indexes.sql` — Performance optimization
- Feature-specific scripts like policies, storage config, carts, orders, reviews, and profiles setup.

---

## 📌 Final Notes

- This `README.md` serves as the high-level project entry point.
- For hyper-specific App details, check out `my-app/README.md` (if available).
- **Deployment Ready?** Double-check that all Supabase and third-party environment variables are set in your hosting platform (like Vercel)!

Made with ❤️ for Next.js and E-commerce.
