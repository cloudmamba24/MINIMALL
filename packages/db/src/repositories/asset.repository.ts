import { eq } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { assets } from '../schema';
import type { Asset } from '@minimall/types';

/**
 * Asset repository
 */
export class AssetRepository extends BaseRepository<Asset> {
  constructor() {
    super(assets);
  }

  /**
   * Find assets by shop
   */
  async findByShop(shopDomain: string): Promise<Asset[]> {
    return this.findAll({
      where: eq(assets.shopDomain, shopDomain),
      orderBy: [{ column: 'createdAt', direction: 'desc' }],
    });
  }
}