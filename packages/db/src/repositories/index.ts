/**
 * Repository pattern for database operations
 * Single source of truth for all database queries
 */

import { AnalyticsRepository } from "./analytics.repository";
import { AssetRepository } from "./asset.repository";
import { ConfigRepository } from "./config.repository";
import { SessionRepository } from "./session.repository";
import { ShopRepository } from "./shop.repository";

// Singleton instances
let shopRepo: ShopRepository;
let configRepo: ConfigRepository;
let assetRepo: AssetRepository;
let analyticsRepo: AnalyticsRepository;
let sessionRepo: SessionRepository;

/**
 * Get shop repository
 */
export function getShopRepository(): ShopRepository {
  if (!shopRepo) {
    shopRepo = new ShopRepository();
  }
  return shopRepo;
}

/**
 * Get config repository
 */
export function getConfigRepository(): ConfigRepository {
  if (!configRepo) {
    configRepo = new ConfigRepository();
  }
  return configRepo;
}

/**
 * Get asset repository
 */
export function getAssetRepository(): AssetRepository {
  if (!assetRepo) {
    assetRepo = new AssetRepository();
  }
  return assetRepo;
}

/**
 * Get analytics repository
 */
export function getAnalyticsRepository(): AnalyticsRepository {
  if (!analyticsRepo) {
    analyticsRepo = new AnalyticsRepository();
  }
  return analyticsRepo;
}

/**
 * Get session repository
 */
export function getSessionRepository(): SessionRepository {
  if (!sessionRepo) {
    sessionRepo = new SessionRepository();
  }
  return sessionRepo;
}

// Export all repositories
export * from "./base.repository";
export * from "./shop.repository";
export * from "./config.repository";
export * from "./asset.repository";
export * from "./analytics.repository";
export * from "./session.repository";
