import type { Metadata } from 'next';
import { ShopifyAppProvider } from '../providers/shopify-app-provider';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'MiniMall Admin',
  description: 'Admin dashboard for MiniMall link-in-bio platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ShopifyAppProvider>
          {children}
        </ShopifyAppProvider>
      </body>
    </html>
  );
}