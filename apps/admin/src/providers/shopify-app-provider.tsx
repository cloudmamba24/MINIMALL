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

  if (!apiKey) {
    console.error("NEXT_PUBLIC_SHOPIFY_API_KEY environment variable is required");
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Configuration Error</h2>
        <p>Shopify API key is not configured. Please check your environment variables.</p>
      </div>
    );
  }

  // App Bridge configuration
  const config = {
    apiKey,
    host:
      new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get(
        "host"
      ) || 
      new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get(
        "shop"
      ) || "",
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
