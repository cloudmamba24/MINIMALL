import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    template: '%s | Link in Bio',
    default: 'Link in Bio',
  },
  description: 'Ultra-fast link-in-bio storefront',
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  authors: [{ name: 'Minimall' }],
  creator: 'Minimall',
  publisher: 'Minimall',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Link in Bio',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@minimall',
  },
};

export const runtime = 'edge';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://cdn.shopify.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
        <link rel="dns-prefetch" href="https://shopify.com" />
        
        {/* Resource hints */}
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="antialiased min-h-screen bg-background font-sans">
        {children}
      </body>
    </html>
  );
}