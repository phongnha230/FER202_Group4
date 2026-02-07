This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Email Notifications (Order)

The app sends email notifications to customers via [Resend](https://resend.com):

- **Khi đặt hàng**: Gửi email xác nhận đơn hàng đã được đặt
- **Khi thanh toán thành công**: Gửi email thông báo thanh toán hoàn tất

### Setup

1. Tạo tài khoản [Resend](https://resend.com) và lấy API key
2. Thêm vào `.env.local`:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Shop <noreply@yourdomain.com>   # Optional, mặc định dùng onboarding@resend.dev
```

3. Verify domain trong Resend dashboard để gửi từ domain của bạn (hoặc dùng `onboarding@resend.dev` cho testing)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
