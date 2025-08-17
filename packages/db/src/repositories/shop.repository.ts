import { eq, and, or, like } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { shops } from '../schema';
import type { Shop } from '@minimall/types';

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
    return this.findOne(eq(shops.domain, domain));
  }

  /**
   * Find active shops
   */
  async findActiveShops(limit?: number): Promise<Shop[]> {
    return this.findAll({
      where: eq(shops.status, 'active'),
      orderBy: [{ column: 'createdAt', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Search shops by name or domain
   */
  async searchShops(query: string): Promise<Shop[]> {
    return this.findAll({
      where: or(
        like(shops.name, `%${query}%`),
        like(shops.domain, `%${query}%`)
      ),
    });
  }

  /**
   * Create or update shop
   */
  async upsert(data: Partial<Shop>): Promise<Shop> {
    const existing = await this.findByDomain(data.domain!);
    
    if (existing) {
      return this.update(existing.id, data)!;
    }
    
    return this.create(data);
  }

  /**
   * Mark shop as uninstalled
   */
  async markUninstalled(domain: string): Promise<void> {
    await this.db
      .update(shops)
      .set({
        status: 'uninstalled',
        uninstalledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(shops.domain, domain));
  }

  /**
   * Update shop access token
   */
  async updateAccessToken(domain: string, accessToken: string): Promise<void> {
    await this.db
      .update(shops)
      .set({
        accessToken,
        updatedAt: new Date(),
      })
      .where(eq(shops.domain, domain));
  }

  /**
   * Get shop statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    uninstalled: number;
  }> {
    const stats = await this.db
      .select({
        status: shops.status,
        count: sql`count(*)`,
      })
      .from(shops)
      .groupBy(shops.status);
    
    const result = {
      total: 0,
      active: 0,
      inactive: 0,
      uninstalled: 0,
    };
    
    for (const stat of stats) {
      const count = Number(stat.count);
      result.total += count;
      result[stat.status] = count;
    }
    
    return result;
  }
}