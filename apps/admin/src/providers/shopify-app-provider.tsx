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

  // If no host parameter, render development mode without App Bridge
  if (!host && typeof window !== "undefined") {
    console.warn("No host parameter found - running in standalone mode");
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
        <div style={{ padding: "20px", background: "#f6f6f7", minHeight: "100vh" }}>
          <div style={{ 
            background: "white", 
            padding: "20px", 
            borderRadius: "8px", 
            textAlign: "center",
            maxWidth: "600px",
            margin: "0 auto"
          }}>
            <h2 style={{ color: "#202223", marginBottom: "16px" }}>
              🔧 Shopify App Setup Required
            </h2>
            <p style={{ color: "#6d7175", marginBottom: "16px" }}>
              This admin panel needs to be installed as a Shopify app. 
            </p>
            <div style={{ 
              background: "#f6f6f7", 
              padding: "12px", 
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "14px",
              marginBottom: "16px"
            }}>
              https://minimall-admin.vercel.app/api/auth/shopify/install?shop=your-store.myshopify.com
            </div>
            <p style={{ color: "#6d7175", fontSize: "14px" }}>
              Replace "your-store" with your actual Shopify store name.
            </p>
          </div>
          {children}
        </div>
      </AppProvider>
    );
  }

  // App Bridge configuration
  const config = {
    apiKey,
    host,
    forceRedirect: true,
  };

  try {
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
  } catch (error) {
    console.error("App Bridge initialization error:", error);
    
    // Fallback to standalone mode if App Bridge fails
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
        <div style={{ padding: "20px", background: "#f6f6f7", minHeight: "100vh" }}>
          <div style={{ 
            background: "white", 
            padding: "20px", 
            borderRadius: "8px", 
            textAlign: "center",
            maxWidth: "600px",
            margin: "0 auto"
          }}>
            <h2 style={{ color: "#dc2626", marginBottom: "16px" }}>
              ⚠️ App Bridge Error
            </h2>
            <p style={{ color: "#6d7175", marginBottom: "16px" }}>
              There was an error initializing the Shopify App Bridge. 
            </p>
            <details style={{ marginTop: "16px", textAlign: "left" }}>
              <summary style={{ cursor: "pointer", color: "#6d7175" }}>Error Details</summary>
              <pre style={{ 
                background: "#f6f6f7", 
                padding: "12px", 
                borderRadius: "4px",
                fontSize: "12px",
                overflow: "auto",
                marginTop: "8px"
              }}>
                {error instanceof Error ? error.message : String(error)}
              </pre>
            </details>
          </div>
          {children}
        </div>
      </AppProvider>
    );
  }
}
