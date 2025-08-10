"use client";

import { createShopifyClient, normalizeShopDomain } from "@/lib/shopify-client";
import type { UICartItem } from "@/store/app-store";

export interface ShopifyCartState {
  cartId: string | null;
  isLoading: boolean;
  lastSyncedAt: number | null;
  checkoutUrl: string | null;
}

/**
 * Shopify Cart Integration Service
 *
 * Handles syncing local cart state with Shopify's Cart API
 * Provides seamless integration between local UI cart and Shopify checkout
 */
export class ShopifyCartIntegration {
  private shopDomain: string;
  private clientPromise: ReturnType<typeof createShopifyClient>;
  private state: ShopifyCartState = {
    cartId: null,
    isLoading: false,
    lastSyncedAt: null,
    checkoutUrl: null,
  };

  constructor(shopDomain: string) {
    this.shopDomain = normalizeShopDomain(shopDomain);
    this.clientPromise = createShopifyClient(this.shopDomain);

    // Load persisted cart state
    this.loadPersistedState();
  }

  /**
   * Initialize or get existing Shopify cart
   */
  async getOrCreateCart(items: UICartItem[] = []): Promise<string | null> {
    const client = await this.clientPromise;
    if (!client) {
      console.warn("Shopify client not available, skipping cart creation");
      return null;
    }

    try {
      this.state.isLoading = true;

      // If we have an existing cart ID, try to use it
      if (this.state.cartId) {
        try {
          const existingCart = await client.getCart(this.state.cartId);
          if (existingCart) {
            this.state.checkoutUrl = existingCart.checkoutUrl;
            this.persistState();
            return this.state.cartId;
          }
        } catch (error) {
          console.warn("Existing cart not found, creating new cart:", error);
          this.state.cartId = null;
        }
      }

      // Create new cart
      const cartLines = items.map((item) => ({
        merchandiseId: item.variantId,
        quantity: item.quantity,
      }));

      const newCart = await client.createCart(cartLines);

      if (newCart) {
        this.state.cartId = newCart.id;
        this.state.checkoutUrl = newCart.checkoutUrl;
        this.state.lastSyncedAt = Date.now();
        this.persistState();

        console.log("Created Shopify cart:", this.state.cartId);
        return this.state.cartId;
      }

      return null;
    } catch (error) {
      console.error("Failed to create/get Shopify cart:", error);
      return null;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Add items to Shopify cart
   */
  async addToCart(items: UICartItem[]): Promise<boolean> {
    const client = await this.clientPromise;
    if (!client) return false;

    try {
      this.state.isLoading = true;

      // Ensure we have a cart
      const cartId = await this.getOrCreateCart();
      if (!cartId) return false;

      const cartLines = items.map((item) => ({
        merchandiseId: item.variantId,
        quantity: item.quantity,
      }));

      const updatedCart = await client.addToCart(cartId, cartLines);

      if (updatedCart) {
        this.state.checkoutUrl = updatedCart.checkoutUrl;
        this.state.lastSyncedAt = Date.now();
        this.persistState();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to add items to Shopify cart:", error);
      return false;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Sync local cart with Shopify cart
   */
  async syncCart(localItems: UICartItem[]): Promise<boolean> {
    const client = await this.clientPromise;
    if (!client || localItems.length === 0) return false;

    try {
      this.state.isLoading = true;

      // Create or update cart with all local items
      const cartId = await this.getOrCreateCart(localItems);
      return cartId !== null;
    } catch (error) {
      console.error("Failed to sync cart with Shopify:", error);
      return false;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Get checkout URL for current cart
   */
  async getCheckoutUrl(localItems: UICartItem[]): Promise<string | null> {
    const client = await this.clientPromise;
    if (!client) {
      // Fallback to basic Shopify cart URL
      const params = localItems.map((item) => `${item.variantId}:${item.quantity}`).join(",");
      return `https://${this.shopDomain}/cart/${params}`;
    }

    try {
      // Ensure cart is synced
      await this.syncCart(localItems);
      return this.state.checkoutUrl;
    } catch (error) {
      console.error("Failed to get checkout URL:", error);

      // Fallback to basic URL
      const params = localItems.map((item) => `${item.variantId}:${item.quantity}`).join(",");
      return `https://${this.shopDomain}/cart/${params}`;
    }
  }

  /**
   * Get current cart state
   */
  getState(): ShopifyCartState {
    return { ...this.state };
  }

  /**
   * Clear Shopify cart state
   */
  async clearCart(): Promise<void> {
    this.state.cartId = null;
    this.state.checkoutUrl = null;
    this.state.lastSyncedAt = null;
    this.persistState();
  }

  /**
   * Load persisted state from localStorage
   */
  private loadPersistedState(): void {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(`shopify-cart-${this.shopDomain}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          ...this.state,
          ...parsed,
          isLoading: false, // Never persist loading state
        };
      }
    } catch (error) {
      console.warn("Failed to load persisted cart state:", error);
    }
  }

  /**
   * Persist current state to localStorage
   */
  private persistState(): void {
    if (typeof window === "undefined") return;

    try {
      const toSave = {
        cartId: this.state.cartId,
        checkoutUrl: this.state.checkoutUrl,
        lastSyncedAt: this.state.lastSyncedAt,
      };
      localStorage.setItem(`shopify-cart-${this.shopDomain}`, JSON.stringify(toSave));
    } catch (error) {
      console.warn("Failed to persist cart state:", error);
    }
  }
}

// Global instances cache
const cartIntegrations = new Map<string, ShopifyCartIntegration>();

/**
 * Get or create cart integration for a shop domain
 */
export function getShopifyCartIntegration(shopDomain: string): ShopifyCartIntegration {
  const normalizedDomain = normalizeShopDomain(shopDomain);

  if (!cartIntegrations.has(normalizedDomain)) {
    cartIntegrations.set(normalizedDomain, new ShopifyCartIntegration(normalizedDomain));
  }

  return cartIntegrations.get(normalizedDomain)!;
}

/**
 * Hook to use Shopify cart integration
 */
export function useShopifyCartIntegration(shopDomain: string) {
  return getShopifyCartIntegration(shopDomain);
}
