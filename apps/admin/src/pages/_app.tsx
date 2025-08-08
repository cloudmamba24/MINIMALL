import type { AppProps } from 'next/app';
import { AppProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import '@shopify/polaris/build/esm/styles.css';
import '../styles/globals.css';

// App Bridge configuration
const appBridgeConfig = {
  apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
  host: typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('host') || ''
    : '',
  forceRedirect: true,
};

export default function AdminApp({ Component, pageProps }: AppProps) {
  // Handle the case where we're not in a Shopify iframe yet
  if (typeof window !== 'undefined' && !appBridgeConfig.host) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Shopify App Loading...</h1>
          <p className="text-gray-600">
            This app must be accessed through your Shopify admin panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppBridgeProvider config={appBridgeConfig}>
      <AppProvider
        i18n={{}}
        features={{
          newDesignLanguage: true,
        }}
      >
        <Component {...pageProps} />
      </AppProvider>
    </AppBridgeProvider>
  );
}