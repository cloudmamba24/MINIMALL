import type { Shop } from "@minimall/types";
import { eq } from "drizzle-orm";
import { shops } from "../schema";
import { BaseRepository } from "./base.repository";

/**
 * Shop repository with business logic
 */
export class ShopRepository extends BaseRepository<Shop> {
  constructor() {
    super(shops);
  }

  /**
   * Find shop by domain
   */
  async findByDomain(domain: string): Promise<Shop | null> {
    return this.findOne(eq(shops.shopDomain, domain));
  }

  /**
   * Get all shops
   */
  async getAllShops(limit?: number): Promise<Shop[]> {
    const options: any = {
      orderBy: [{ column: "createdAt", direction: "desc" }],
    };

    if (limit !== undefined) {
      options.limit = limit;
    }

    return this.findAll(options);
  }

  /**
   * Create or update shop
   */
  async upsert(data: Partial<Shop>): Promise<Shop> {
    const existing = await this.findByDomain(data.shopDomain!);

    if (existing) {
      const updated = await this.update(existing.shopDomain, data);
      if (!updated) {
        throw new Error("Failed to update shop");
      }
      return updated;
    }

    return this.create(data);
  }

  /**
   * Update shop storefront token
   */
  async updateStorefrontToken(domain: string, storefrontAccessToken: string): Promise<void> {
    await this.db
      .update(shops)
      .set({
        storefrontAccessToken,
        updatedAt: new Date(),
      })
      .where(eq(shops.shopDomain, domain));
  }
}
