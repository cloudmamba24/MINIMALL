import { eq, and, desc } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { configs } from '../schema';
import type { Config } from '@minimall/types';

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
  async findByShop(shopId: string): Promise<Config[]> {
    return this.findAll({
      where: eq(configs.shopId, shopId),
      orderBy: [{ column: 'updatedAt', direction: 'desc' }],
    });
  }

  /**
   * Find published configs for a shop
   */
  async findPublishedByShop(shopId: string): Promise<Config[]> {
    return this.findAll({
      where: and(
        eq(configs.shopId, shopId),
        eq(configs.status, 'published')
      ),
      orderBy: [{ column: 'publishedAt', direction: 'desc' }],
    });
  }

  /**
   * Find config by slug
   */
  async findBySlug(shopId: string, slug: string): Promise<Config | null> {
    return this.findOne(and(
      eq(configs.shopId, shopId),
      eq(configs.slug, slug)
    ));
  }

  /**
   * Publish config
   */
  async publish(id: string): Promise<Config | null> {
    return this.update(id, {
      status: 'published',
      publishedAt: new Date(),
      version: sql`version + 1`,
    });
  }

  /**
   * Archive config
   */
  async archive(id: string): Promise<Config | null> {
    return this.update(id, {
      status: 'archived',
    });
  }

  /**
   * Duplicate config
   */
  async duplicate(id: string, newName: string): Promise<Config | null> {
    const original = await this.findById(id);
    if (!original) return null;
    
    return this.create({
      ...original,
      id: undefined,
      name: newName,
      slug: this.generateSlug(newName),
      status: 'draft',
      publishedAt: null,
      version: 1,
    });
  }

  /**
   * Get config versions
   */
  async getVersionHistory(configId: string): Promise<any[]> {
    // Implement version history if you have a versions table
    // For now, return empty array
    return [];
  }

  /**
   * Generate unique slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}