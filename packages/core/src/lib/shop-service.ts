import { db, shops } from "@minimall/db";
import { eq } from "drizzle-orm";

/**
 * Service for managing per-shop Shopify integration data
 */
export class ShopService {
  /**
   * Get shop configuration including storefront access token
   */
  static async getShop(shopDomain: string) {
    if (!db) {
      console.warn("Database not available");
      return null;
    }

    try {
      const shop = await db.query.shops.findFirst({
        where: eq(shops.shopDomain, shopDomain),
      });

      return shop || null;
    } catch (error) {
      console.error(`Failed to get shop ${shopDomain}:`, error);
      return null;
    }
  }

  /**
   * Get storefront access token for a shop
   */
  static async getStorefrontToken(shopDomain: string): Promise<string | null> {
    const shop = await this.getShop(shopDomain);
    return shop?.storefrontAccessToken || null;
  }

  /**
   * Create or update shop with storefront access token
   */
  static async upsertShop(shopDomain: string, storefrontAccessToken: string) {
    if (!db) {
      console.warn("Database not available");
      return null;
    }

    try {
      const result = await db
        .insert(shops)
        .values({
          shopDomain,
          storefrontAccessToken,
        })
        .onConflictDoUpdate({
          target: shops.shopDomain,
          set: {
            storefrontAccessToken,
            updatedAt: new Date(),
          },
        })
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error(`Failed to upsert shop ${shopDomain}:`, error);
      return null;
    }
  }

  /**
   * Delete shop configuration
   */
  static async deleteShop(shopDomain: string) {
    if (!db) {
      console.warn("Database not available");
      return false;
    }

    try {
      const result = await db
        .delete(shops)
        .where(eq(shops.shopDomain, shopDomain))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error(`Failed to delete shop ${shopDomain}:`, error);
      return false;
    }
  }

  /**
   * Get token with fallback chain:
   * 1. Config-specific token from settings
   * 2. Shop-specific token from database  
   * 3. Environment variable
   */
  static async getTokenWithFallback(
    shopDomain: string,
    configToken?: string
  ): Promise<string | null> {
    // 1. Use config-specific token if provided
    if (configToken) {
      return configToken;
    }

    // 2. Try shop-specific token from database
    const shopToken = await this.getStorefrontToken(shopDomain);
    if (shopToken) {
      return shopToken;
    }

    // 3. Fallback to environment variable
    const envToken =
      process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
      process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    return envToken || null;
  }
}