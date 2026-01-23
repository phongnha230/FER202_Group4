import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/theme.css';
import '../styles/animations.css';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'UrbanNest - Modern Streetwear Fashion',
  description: 'Discover the latest in urban streetwear fashion. Quality clothing for the modern lifestyle. Shop hoodies, tees, cargo pants, and more.',
  keywords: ['streetwear', 'fashion', 'urban', 'clothing', 'hoodies', 'tees', 'cargo pants'],
  authors: [{ name: 'UrbanNest' }],
  openGraph: {
    title: 'UrbanNest - Modern Streetwear Fashion',
    description: 'Discover the latest in urban streetwear fashion',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
