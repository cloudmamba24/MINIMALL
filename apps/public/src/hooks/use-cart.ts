"use client";

import { useCallback, useState } from "react";

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  title: string;
  price: number;
  image?: string;
}

export function useCart() {
  const [isLoading, setIsLoading] = useState(false);

  const addToCart = useCallback(async (productId: string, variantId?: string, quantity = 1) => {
    setIsLoading(true);

    try {
      // In production, this would call the Shopify Cart API
      // For now, we'll just log the action and provide user feedback
      console.log("Adding to cart:", { productId, variantId, quantity });

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // You could integrate with Shopify's cart API here:
      // const response = await fetch('/api/cart/add', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ productId, variantId, quantity })
      // });

      // Show success feedback (could be a toast notification)
      console.log("Successfully added to cart");

      return { success: true };
    } catch (error) {
      console.error("Failed to add to cart:", error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addToCart,
    isLoading,
  };
}
