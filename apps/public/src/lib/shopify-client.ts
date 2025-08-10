/**
 * Shopify Client for Public App
 *
 * Environment-aware Shopify client that uses domain from config
 * with proper error handling and caching.
 */

import {
  type ShopifyProduct,
  createShopifyStorefrontService,
  transformProduct,
} from "@minimall/core/client";

// Re-export for components
export type { ShopifyProduct } from "@minimall/core/client";

// Cache for Shopify service instances per domain
const serviceCache = new Map<string, ReturnType<typeof createShopifyStorefrontService>>();

/**
 * Get or create Shopify service for a domain
 */
function getShopifyService(domain: string, accessToken: string) {
  const cacheKey = `${domain}:${accessToken}`;

  if (!serviceCache.has(cacheKey)) {
    serviceCache.set(cacheKey, createShopifyStorefrontService(domain, accessToken));
  }

  return serviceCache.get(cacheKey)!;
}

/**
 * Product cache with TTL
 */
interface CachedProduct {
  product: ShopifyProduct;
  timestamp: number;
  ttl: number;
}

const productCache = new Map<string, CachedProduct>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached product or fetch from API
 */
async function getCachedProduct(
  domain: string,
  accessToken: string,
  productId: string
): Promise<ShopifyProduct | null> {
  const cacheKey = `${domain}:${productId}`;
  const cached = productCache.get(cacheKey);

  // Return cached if valid
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.product;
  }

  try {
    const service = getShopifyService(domain, accessToken);
    const graphqlProduct = await service.getProduct(productId, true);

    if (!graphqlProduct) {
      return null;
    }

    const product = transformProduct(graphqlProduct);

    // Cache the result
    productCache.set(cacheKey, {
      product,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    });

    return product;
  } catch (error) {
    console.error(`Failed to fetch product ${productId} from ${domain}:`, error);
    return null;
  }
}

/**
 * Public API for components
 */
export class ShopifyClient {
  private domain: string;
  private accessToken: string;

  constructor(domain: string, accessToken: string) {
    this.domain = domain;
    this.accessToken = accessToken;
  }

  /**
   * Get single product by ID
   */
  async getProduct(productId: string): Promise<ShopifyProduct | null> {
    return getCachedProduct(this.domain, this.accessToken, productId);
  }

  /**
   * Get multiple products by IDs
   */
  async getProducts(productIds: string[]): Promise<ShopifyProduct[]> {
    const products = await Promise.allSettled(productIds.map((id) => this.getProduct(id)));

    return products
      .filter(
        (result): result is PromiseFulfilledResult<ShopifyProduct> =>
          result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value);
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    first = 20
  ): Promise<{ products: ShopifyProduct[]; hasNextPage: boolean }> {
    try {
      const service = getShopifyService(this.domain, this.accessToken);
      const result = await service.searchProducts(query, first);

      return {
        products: result.products.map(transformProduct),
        hasNextPage: result.hasNextPage,
      };
    } catch (error) {
      console.error(`Failed to search products for "${query}":`, error);
      return { products: [], hasNextPage: false };
    }
  }

  /**
   * Get products from collection
   */
  async getCollectionProducts(
    handle: string,
    first = 20
  ): Promise<{ products: ShopifyProduct[]; hasNextPage: boolean }> {
    try {
      const service = getShopifyService(this.domain, this.accessToken);
      const result = await service.getCollectionProducts(handle, first);

      return {
        products: result.products.map(transformProduct),
        hasNextPage: result.hasNextPage,
      };
    } catch (error) {
      console.error(`Failed to get collection "${handle}" products:`, error);
      return { products: [], hasNextPage: false };
    }
  }

  /**
   * Create cart
   */
  async createCart(lines?: Array<{ merchandiseId: string; quantity: number }>) {
    try {
      const service = getShopifyService(this.domain, this.accessToken);
      return await service.createCart(lines);
    } catch (error) {
      console.error("Failed to create cart:", error);
      throw error;
    }
  }

  /**
   * Add to existing cart
   */
  async addToCart(cartId: string, lines: Array<{ merchandiseId: string; quantity: number }>) {
    try {
      const service = getShopifyService(this.domain, this.accessToken);
      return await service.addToCart(cartId, lines);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error;
    }
  }

  /**
   * Get cart by ID
   */
  async getCart(cartId: string) {
    try {
      const service = getShopifyService(this.domain, this.accessToken);
      return await service.getCart(cartId);
    } catch (error) {
      console.error("Failed to get cart:", error);
      throw error;
    }
  }
}

/**
 * Create Shopify client from shop domain
 * Uses environment variables for access token
 */
export function createShopifyClient(shopDomain: string): ShopifyClient | null {
  // In a real app, you'd get the access token from your database
  // For now, use environment variable
  const accessToken =
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn("Shopify Storefront API access token not found");
    return null;
  }

  return new ShopifyClient(shopDomain, accessToken);
}

/**
 * Extract shop domain from various formats
 */
export function normalizeShopDomain(domain: string): string {
  // Remove protocol and paths
  const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0] || domain;

  // Ensure .myshopify.com suffix
  if (!cleanDomain.endsWith(".myshopify.com")) {
    return `${cleanDomain}.myshopify.com`;
  }

  return cleanDomain;
}

/**
 * Mock products for development when Shopify is not available
 */
export const mockProducts: ShopifyProduct[] = [
  {
    id: "prod_abc",
    title: "Essential Tee",
    handle: "essential-tee",
    description: "A comfortable and stylish essential tee made from 100% organic cotton.",
    images: [
      {
        id: "img_1",
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop",
        altText: "Essential Tee - Black",
        width: 600,
        height: 600,
      },
      {
        id: "img_2",
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&sat=-100",
        altText: "Essential Tee - White",
        width: 600,
        height: 600,
      },
    ],
    variants: [
      {
        id: "var_1",
        title: "Black / M",
        price: { amount: "29.00", currencyCode: "USD" },
        compareAtPrice: { amount: "39.00", currencyCode: "USD" },
        availableForSale: true,
        selectedOptions: [
          { name: "Color", value: "Black" },
          { name: "Size", value: "M" },
        ],
        image: {
          id: "img_1",
          url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop",
          altText: "Essential Tee - Black",
          width: 600,
          height: 600,
        },
        requiresShipping: true,
      },
    ],
    priceRange: {
      minVariantPrice: { amount: "29.00", currencyCode: "USD" },
      maxVariantPrice: { amount: "29.00", currencyCode: "USD" },
    },
    tags: ["cotton", "essential", "casual"],
    productType: "Apparel",
    vendor: "Demo Store",
    availableForSale: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

/**
 * Get mock product by ID (for development)
 */
export function getMockProduct(productId: string): ShopifyProduct | null {
  return mockProducts.find((p) => p.id === productId) || null;
}
