"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useShopifyCart } from "../../../../../hooks/use-shopify-cart";
import type { ShopifyProduct } from "../../../../../lib/shopify-client";
import { useAppStore } from "../../../../../store/app-store";

/**
 * Product Quick View Modal Route
 *
 * This page handles the /g/[configId]/qv/[productId] route
 * and automatically opens the product quick view modal.
 */
export default function ProductQuickViewPage() {
  const router = useRouter();
  const params = useParams();
  const { openProductQuickView } = useAppStore();
  // const { addToShopifyCart } = useShopifyCart();

  const configId = params.configId as string;
  const productId = params.productId as string;

  useEffect(() => {
    // Fetch product data and open modal
    const loadProductAndOpenModal = async () => {
      try {
        // Fetch product from API
        const response = await fetch(`/api/shopify/products/${productId}`);

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const { product } = (await response.json()) as { product: ShopifyProduct };

        // Open the modal with the product data
        openProductQuickView(productId, product);

        // Navigate back to the main page but keep the modal in the URL
        // This allows the modal to be bookmarkable and shareable
        router.replace(`/g/${configId}`, { scroll: false });
      } catch (error) {
        console.error("Failed to load product:", error);

        // If product fetch fails, still open modal but without product data
        // The modal will handle the loading state and error
        openProductQuickView(productId, null);
        router.replace(`/g/${configId}`, { scroll: false });
      }
    };

    loadProductAndOpenModal();
  }, [productId, configId, openProductQuickView, router]);

  // This page doesn't render anything visible
  // The modal will be shown by the modal components
  return null;
}
