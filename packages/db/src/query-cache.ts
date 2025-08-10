interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

export class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize = 1000, defaultTtl = 300000) {
    // 5 minutes default TTL
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get cached value or execute query function
   */
  async get<T>(key: string, queryFn: () => Promise<T>, ttl = this.defaultTtl): Promise<T> {
    const cached = this.cache.get(key);

    // Check if cached entry is still valid
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      cached.hits++;
      this.stats.hits++;
      return cached.data as T;
    }

    // Cache miss or expired - execute query
    this.stats.misses++;
    const data = await queryFn();

    // Store in cache
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Store value in cache
   */
  set<T>(key: string, data: T, ttl = this.defaultTtl): void {
    // Evict least recently used entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    });
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear entries matching pattern
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let deletedCount = 0;

    for (const [key] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    // Rough memory usage calculation (in bytes)
    const memoryUsage = JSON.stringify([...this.cache.entries()]).length * 2;

    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage,
    };
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0 && process.env.NODE_ENV === "development") {
      console.log(`🧹 Cache cleanup: removed ${removedCount} expired entries`);
    }
  }

  /**
   * Evict least recently used entry (by hits)
   */
  private evictLRU(): void {
    let lruKey = "";
    let minHits = Number.MAX_SAFE_INTEGER;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      // Prefer entries with fewer hits, but also consider age
      const score = entry.hits + (Date.now() - entry.timestamp) / 1000000;

      if (score < minHits || (score === minHits && entry.timestamp < oldestTimestamp)) {
        lruKey = key;
        minHits = score;
        oldestTimestamp = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}

// Create singleton cache instance
export const queryCache = new QueryCache(
  // Configurable max cache size (default 1000 entries)
  Number(process.env.QUERY_CACHE_SIZE) || 1000,
  // Configurable default TTL (default 5 minutes)
  Number(process.env.QUERY_CACHE_TTL) || 300000
);

/**
 * Utility function to create cache keys
 */
export function createCacheKey(type: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (result, key) => {
        result[key] = params[key];
        return result;
      },
      {} as Record<string, unknown>
    );

  return `${type}:${JSON.stringify(sortedParams)}`;
}

/**
 * Cache-aware query wrapper
 */
export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return queryCache.get(cacheKey, queryFn, ttl);
}

/**
 * Invalidate cache entries by pattern (useful for mutations)
 */
export function invalidateCache(pattern: string): number {
  const deletedCount = queryCache.deletePattern(pattern);

  if (deletedCount > 0 && process.env.NODE_ENV === "development") {
    console.log(`🗑️ Cache invalidation: removed ${deletedCount} entries matching "${pattern}"`);
  }

  return deletedCount;
}

// Cache keys for common queries
export const CacheKeys = {
  config: (configId: string, version?: string) => createCacheKey("config", { configId, version }),
  configList: (shop: string, limit: number, offset: number) =>
    createCacheKey("config_list", { shop, limit, offset }),
  analytics: (configId?: string, timeframe?: string, startDate?: string, endDate?: string) =>
    createCacheKey("analytics", { configId, timeframe, startDate, endDate }),
  performance: (configId?: string, timeframe?: string) =>
    createCacheKey("performance", { configId, timeframe }),
} as const;
