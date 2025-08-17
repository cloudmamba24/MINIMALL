import type { Config } from "@minimall/types";
import { and, eq } from "drizzle-orm";
import { configs } from "../schema";
import { BaseRepository } from "./base.repository";

/**
 * Config repository with business logic
 */
export class ConfigRepository extends BaseRepository<Config> {
  constructor() {
    super(configs);
  }

  /**
   * Find configs by shop
   */
  async findByShop(shopDomain: string): Promise<Config[]> {
    return this.findAll({
      where: eq(configs.shop, shopDomain),
      orderBy: [{ column: "updatedAt", direction: "desc" }],
    });
  }

  /**
   * Find config by slug
   */
  async findBySlug(shopDomain: string, slug: string): Promise<Config | null> {
    return this.findOne(and(eq(configs.shop, shopDomain), eq(configs.slug, slug)));
  }

  /**
   * Duplicate config
   */
  async duplicate(id: string, newSlug: string): Promise<Config | null> {
    const original = await this.findById(id);
    if (!original) return null;

    return this.create({
      ...original,
      id: `${original.shop}-${newSlug}`,
      slug: newSlug,
      currentVersionId: null,
    });
  }

  /**
   * Get config versions
   */
  async getVersionHistory(_configId: string): Promise<any[]> {
    // Implement version history if you have a versions table
    // For now, return empty array
    return [];
  }
}
