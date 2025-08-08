'use client';

import { useState, useEffect } from 'react';
import { createShopifyClient, getMockProduct, type ShopifyProduct } from '@/lib/shopify-client';
import { transformProduct, type ShopifyProduct as CoreShopifyProduct } from '@minimall/core';

interface UseShopifyProductResult {
  product: ShopifyProduct | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch a single Shopify product by ID
 * Falls back to mock data in development when Shopify is unavailable
 */
export function useShopifyProduct(
  productId: string | undefined, 
  shopDomain?: string
): UseShopifyProductResult {
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        // Try to get real Shopify data first
        if (shopDomain) {
          const client = createShopifyClient(shopDomain);
          if (client) {
            console.log(`Fetching product ${productId} from ${shopDomain}`);
            const shopifyProduct = await client.getProduct(productId);
            if (shopifyProduct) {
              setProduct(shopifyProduct);
              setLoading(false);
              return;
            }
          }
        }

        // Fall back to mock data
        console.log(`Using mock data for product ${productId}`);
        const mockProduct = getMockProduct(productId);
        setProduct(mockProduct);
        
        if (!mockProduct) {
          setError(`Product ${productId} not found`);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        
        // Try mock data as final fallback
        const mockProduct = getMockProduct(productId);
        if (mockProduct) {
          setProduct(mockProduct);
          setError('Using mock data due to API error');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch product');
          setProduct(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, shopDomain]);

  return { product, loading, error };
}

/**
 * Hook to get shop domain from current config context
 * This would typically come from a config context in a real app
 */
export function useShopDomain(): string | undefined {
  // For demo purposes, return the demo shop domain
  // In a real app, this would come from the current site config context
  return 'demo-shop.myshopify.com';
}

