import type { AppProps } from 'next/app';
import { AppProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import '@shopify/polaris/build/esm/styles.css';
import '../styles/globals.css';
import { useState, useEffect } from 'react';

export default function AdminApp({ Component, pageProps }: AppProps) {
  const [appBridgeConfig, setAppBridgeConfig] = useState<any>(null);

  useEffect(() => {
    const host = new URLSearchParams(window.location.search).get('host');
    if (host) {
      setAppBridgeConfig({
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
        host,
        forceRedirect: true,
      });
    }
  }, []);

  if (!appBridgeConfig) {
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