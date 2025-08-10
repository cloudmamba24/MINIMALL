"use client";

import { type ShopifyProduct, ShopifyClient, getMockProduct } from "@/lib/shopify-client";
import { useSiteConfig } from "@/contexts/site-config-context";
import { useEffect, useState } from "react";

interface UseShopifyProductResult {
  product: ShopifyProduct | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch a single Shopify product by ID
 * Uses config-specific Shopify tokens when available
 * Falls back to environment tokens, then mock data
 */
export function useShopifyProduct(
  productId: string | undefined,
  overrideShopDomain?: string
): UseShopifyProductResult {
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get config from context (may not be available in all contexts)
  let siteConfig = null;
  let configShopDomain = overrideShopDomain;
  let configAccessToken = null;
  
  try {
    const config = useSiteConfig();
    siteConfig = config.config;
    configShopDomain = overrideShopDomain || config.shopDomain;
    configAccessToken = config.config.settings.shopify?.storefrontAccessToken;
  } catch {
    // Context not available, use fallbacks
  }

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to get real Shopify data with proper token resolution
        if (configShopDomain) {
          const { createShopifyClient } = await import("@/lib/shopify-client");
          const client = await createShopifyClient(configShopDomain, configAccessToken || undefined);
          
          if (client) {
            const shopifyProduct = await client.getProduct(productId);
            if (shopifyProduct) {
              setProduct(shopifyProduct);
              setLoading(false);
              return;
            }
          } else {
            console.warn(`Failed to create Shopify client for ${configShopDomain}`);
          }
        }

        // Fall back to mock data in development
        if (process.env.NODE_ENV === "development") {
          console.log(`Using mock data for product ${productId}`);
          const mockProduct = getMockProduct(productId);
          setProduct(mockProduct);

          if (!mockProduct) {
            setError(`Mock product ${productId} not found`);
          } else {
            setError("Using mock data - no Shopify token available");
          }
        } else {
          setError("Shopify integration not configured");
        }
      } catch (err) {
        console.error("Error fetching product:", err);

        // Try mock data as final fallback in development
        if (process.env.NODE_ENV === "development") {
          const mockProduct = getMockProduct(productId);
          if (mockProduct) {
            setProduct(mockProduct);
            setError("Using mock data due to API error");
          } else {
            setError(err instanceof Error ? err.message : "Failed to fetch product");
            setProduct(null);
          }
        } else {
          setError(err instanceof Error ? err.message : "Failed to fetch product");
          setProduct(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, configShopDomain, configAccessToken]);

  return { product, loading, error };
}

/**
 * Hook to get shop domain from current config context
 * Falls back to demo domain if no config is available
 */
export function useShopDomain(): string {
  try {
    const { shopDomain } = useSiteConfig();
    return shopDomain;
  } catch {
    // Context not available, return demo domain
    return "demo-shop.myshopify.com";
  }
}
