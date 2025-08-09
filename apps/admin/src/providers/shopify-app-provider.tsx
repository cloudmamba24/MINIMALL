"use client";

import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import { AppProvider } from "@shopify/polaris";
import React, { type ReactNode } from "react";
import "@shopify/polaris/build/esm/styles.css";

interface ShopifyAppProviderProps {
  children: ReactNode;
}

export function ShopifyAppProvider({ children }: ShopifyAppProviderProps) {
  // Get API key from environment variables
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

  // In development or when API key is missing, render without App Bridge
  if (!apiKey) {
    console.warn("NEXT_PUBLIC_SHOPIFY_API_KEY not found - running in development mode");
    return (
      <AppProvider
        i18n={{
          Polaris: {
            Common: {
              checkbox: "checkbox",
              undo: "Undo",
              cancel: "Cancel",
              clear: "Clear",
              close: "Close",
              submit: "Submit",
              more: "More",
            },
            ResourceList: {
              sortingLabel: "Sort by",
              defaultItemSingular: "item",
              defaultItemPlural: "items",
              showing: "Showing",
              of: "of",
            },
          },
        }}
      >
        {children}
      </AppProvider>
    );
  }

  // Get host parameter more safely
  const searchParams = typeof window !== "undefined" 
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
  
  const host = searchParams.get("host") || searchParams.get("shop") || "";

  // App Bridge configuration
  const config = {
    apiKey,
    host,
    forceRedirect: true,
  };

  return (
    <AppBridgeProvider config={config}>
      <AppProvider
        i18n={{
          Polaris: {
            Common: {
              checkbox: "checkbox",
              undo: "Undo",
              cancel: "Cancel",
              clear: "Clear",
              close: "Close",
              submit: "Submit",
              more: "More",
            },
            ResourceList: {
              sortingLabel: "Sort by",
              defaultItemSingular: "item",
              defaultItemPlural: "items",
              showing: "Showing",
              of: "of",
            },
          },
        }}
      >
        {children}
      </AppProvider>
    </AppBridgeProvider>
  );
}
