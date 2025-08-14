"use client";

import { useCallback, useRef, useState } from "react";
import type { ShopifyProduct } from "../lib/shopify-client";
import { useAppStore } from "../store/app-store";

interface ShopifyCartLine {
  merchandiseId: string;
  quantity: number;
}

interface UseShopifyCartOptions {
  shopDomain?: string;
}

export function useShopifyCart({ shopDomain }: UseShopifyCartOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [shopifyCartId, setShopifyCartId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get app store actions
  const { addToCart: addToLocalCart, openCartDrawer } = useAppStore();

  // Track if we've already created a Shopify cart
  const hasCreatedShopifyCart = useRef(false);

  const addToShopifyCart = useCallback(
    async (product: ShopifyProduct, variantId: string, quantity = 1) => {
      setIsLoading(true);
      setError(null);

      try {
        const variant = product.variants.find((v) => v.id === variantId);
        if (!variant) {
          throw new Error("Variant not found");
        }

        // Add to local cart immediately for instant feedback
        addToLocalCart({
          id: `${product.id}-${variantId}`,
          productId: product.id,
          variantId,
          title: product.title,
          variant: {
            title: variant.title,
            selectedOptions: variant.selectedOptions || [],
          },
          price: Number.parseFloat(variant.price.amount),
          quantity,
          image: variant.image?.url || product.images[0]?.url || "",
        });

        // Open cart drawer
        openCartDrawer();

        // Create or update Shopify cart in background
        const lines: ShopifyCartLine[] = [
          {
            merchandiseId: variantId,
            quantity,
          },
        ];

        let cartResponse: unknown;

        if (!shopifyCartId && !hasCreatedShopifyCart.current) {
          // Create new cart
          hasCreatedShopifyCart.current = true;
          const response = await fetch("/api/shopify/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              shopDomain: shopDomain || process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN,
              lines,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to create cart");
          }

          cartResponse = await response.json();
          setShopifyCartId((cartResponse as any)?.cart?.id);
        } else if (shopifyCartId) {
          // Add to existing cart
          const response = await fetch(`/api/shopify/cart/${shopifyCartId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              shopDomain: shopDomain || process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN,
              lines,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to add to cart");
          }

          cartResponse = await response.json();
        }

        // Log success but don't show to user (local cart is already updated)
        console.log("Added to Shopify cart:", (cartResponse as any)?.cart?.id);

        // Show warning if using mock data
        if ((cartResponse as any)?.source === "mock") {
          console.warn(
            "Using mock cart - configure Shopify credentials for real cart functionality"
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to add to cart";
        setError(errorMessage);
        console.error("Shopify cart error:", err);

        // Local cart is already updated, so user still has good experience
        console.log("Item added to local cart despite Shopify error");
      } finally {
        setIsLoading(false);
      }
    },
    [shopDomain, shopifyCartId, addToLocalCart, openCartDrawer]
  );

  const getCheckoutUrl = useCallback(async (): Promise<string | null> => {
    if (!shopifyCartId) {
      console.warn("No Shopify cart ID available");
      return null;
    }

    try {
      const response = await fetch(
        `/api/shopify/cart/${shopifyCartId}?shop=${shopDomain || process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}`
      );

      if (!response.ok) {
        throw new Error("Failed to get cart");
      }

      const { cart } = await response.json();
      return cart.checkoutUrl;
    } catch (err) {
      console.error("Failed to get checkout URL:", err);
      return null;
    }
  }, [shopifyCartId, shopDomain]);

  return {
    addToShopifyCart,
    getCheckoutUrl,
    isLoading,
    error,
    shopifyCartId,
  };
}
