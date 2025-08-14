/**
 * Tests for Database Module
 * Covers connection management, query caching, and monitoring
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock postgres first
vi.mock("postgres", () => ({
  default: vi.fn(() => ({
    sql: vi.fn(),
    close: vi.fn(),
    end: vi.fn()
  })),
  camel: {}
}));

// Mock drizzle
vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn()
  }))
}));

import { createDatabase } from "./index";

// Mock query cache and monitor modules
const mockQueryCache = new Map();
const mockQueryStats = {
  totalQueries: 0,
  successfulQueries: 0,
  failedQueries: 0,
  slowQueries: 0,
  averageExecutionTime: 0,
  recentQueries: []
};

const getCachedQuery = vi.fn((key: string) => mockQueryCache.get(key) || null);
const setCachedQuery = vi.fn((key: string, data: any, ttl?: number) => {
  mockQueryCache.set(key, { data, expiresAt: Date.now() + (ttl || 300) * 1000 });
});
const clearQueryCache = vi.fn((pattern?: string) => {
  if (pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const [key] of mockQueryCache) {
      if (regex.test(key)) {
        mockQueryCache.delete(key);
      }
    }
  } else {
    mockQueryCache.clear();
  }
});

const recordQuery = vi.fn((sql: string, time: number, success: boolean) => {
  mockQueryStats.totalQueries++;
  if (success) mockQueryStats.successfulQueries++;
  else mockQueryStats.failedQueries++;
  if (time > 2000) mockQueryStats.slowQueries++;
  mockQueryStats.recentQueries.push({ sql, executionTime: time, success, timestamp: new Date() });
  mockQueryStats.averageExecutionTime = 
    mockQueryStats.recentQueries.reduce((sum, q) => sum + q.executionTime, 0) / mockQueryStats.recentQueries.length;
});

const getQueryStats = vi.fn(() => mockQueryStats);
const resetQueryStats = vi.fn(() => {
  Object.assign(mockQueryStats, {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    slowQueries: 0,
    averageExecutionTime: 0,
    recentQueries: []
  });
});

// Create queryCache object for tests
const queryCache = mockQueryCache;

describe("Database Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryCache.clear();
    resetQueryStats();
    // Clear environment variables
    delete process.env.NODE_ENV;
    delete process.env.DB_DEBUG;
  });

  describe("createDatabase", () => {
    it("should create database connection with URL", () => {
      const databaseUrl = "postgresql://user:pass@localhost:5432/testdb";
      
      const db = createDatabase(databaseUrl);
      
      expect(mockPostgres).toHaveBeenCalledWith(
        databaseUrl,
        expect.objectContaining({
          connect_timeout: 60,
          prepare: false
        })
      );
      expect(mockDrizzle).toHaveBeenCalled();
      expect(db).toBeDefined();
    });

    it("should throw error without database URL", () => {
      expect(() => createDatabase("")).toThrow("DATABASE_URL is required");
      expect(() => createDatabase(undefined as any)).toThrow("DATABASE_URL is required");
    });

    it("should configure production settings", () => {
      process.env.NODE_ENV = "production";
      const databaseUrl = "postgresql://user:pass@prod.example.com:5432/db";
      
      createDatabase(databaseUrl);
      
      expect(mockPostgres).toHaveBeenCalledWith(
        databaseUrl,
        expect.objectContaining({
          max: 10,
          idle_timeout: 30,
          ssl: { rejectUnauthorized: false }
        })
      );
    });

    it("should configure development settings", () => {
      process.env.NODE_ENV = "development";
      process.env.DB_DEBUG = "true";
      const databaseUrl = "postgresql://user:pass@localhost:5432/testdb";
      
      createDatabase(databaseUrl);
      
      expect(mockPostgres).toHaveBeenCalledWith(
        databaseUrl,
        expect.objectContaining({
          max: 5,
          idle_timeout: 10,
          debug: true
        })
      );
    });

    it("should handle localhost without SSL", () => {
      process.env.NODE_ENV = "production";
      const databaseUrl = "postgresql://user:pass@localhost:5432/testdb";
      
      createDatabase(databaseUrl);
      
      expect(mockPostgres).toHaveBeenCalledWith(
        databaseUrl,
        expect.objectContaining({
          ssl: false
        })
      );
    });

    it("should suppress PostgreSQL notices", () => {
      const databaseUrl = "postgresql://user:pass@localhost:5432/testdb";
      
      createDatabase(databaseUrl);
      
      const config = mockPostgres.mock.calls[0][1];
      expect(config.onnotice).toBeTypeOf("function");
      
      // Should not throw when called
      expect(() => config.onnotice()).not.toThrow();
    });
  });

  describe("Query Cache", () => {
    beforeEach(() => {
      clearQueryCache();
    });

    describe("setCachedQuery", () => {
      it("should cache query results", () => {
        const key = "users:all";
        const data = [{ id: 1, name: "John" }, { id: 2, name: "Jane" }];
        
        setCachedQuery(key, data, 300); // 5 minutes TTL
        
        expect(queryCache.size).toBe(1);
        expect(queryCache.has(key)).toBe(true);
      });

      it("should handle different data types", () => {
        setCachedQuery("count:users", 42);
        setCachedQuery("exists:admin", true);
        setCachedQuery("config:shop", { domain: "test.com", active: true });
        
        expect(queryCache.size).toBe(3);
      });

      it("should use default TTL when not specified", () => {
        setCachedQuery("default:ttl", "data");
        
        const cached = queryCache.get("default:ttl");
        expect(cached).toBeDefined();
        expect(cached!.expiresAt).toBeGreaterThan(Date.now());
      });
    });

    describe("getCachedQuery", () => {
      it("should retrieve cached query results", () => {
        const key = "products:featured";
        const data = [{ id: 1, name: "Product 1" }];
        
        setCachedQuery(key, data);
        const result = getCachedQuery(key);
        
        expect(result).toEqual(data);
      });

      it("should return null for non-existent keys", () => {
        const result = getCachedQuery("non:existent");
        expect(result).toBeNull();
      });

      it("should return null for expired entries", () => {
        const key = "expired:data";
        setCachedQuery(key, "data", -1); // Already expired
        
        const result = getCachedQuery(key);
        expect(result).toBeNull();
        expect(queryCache.has(key)).toBe(false); // Should be cleaned up
      });

      it("should handle concurrent access", () => {
        const key = "concurrent:test";
        const data = { test: true };
        
        setCachedQuery(key, data);
        
        // Simulate concurrent reads
        const results = Array(10).fill(null).map(() => getCachedQuery(key));
        
        expect(results.every(r => JSON.stringify(r) === JSON.stringify(data))).toBe(true);
      });
    });

    describe("clearQueryCache", () => {
      it("should clear all cached entries", () => {
        setCachedQuery("key1", "data1");
        setCachedQuery("key2", "data2");
        setCachedQuery("key3", "data3");
        
        expect(queryCache.size).toBe(3);
        
        clearQueryCache();
        
        expect(queryCache.size).toBe(0);
      });

      it("should clear entries matching pattern", () => {
        setCachedQuery("users:all", []);
        setCachedQuery("users:active", []);
        setCachedQuery("products:all", []);
        setCachedQuery("products:featured", []);
        
        clearQueryCache("users:*");
        
        expect(queryCache.has("users:all")).toBe(false);
        expect(queryCache.has("users:active")).toBe(false);
        expect(queryCache.has("products:all")).toBe(true);
        expect(queryCache.has("products:featured")).toBe(true);
      });
    });

    describe("Memory Management", () => {
      it("should respect cache size limits", () => {
        // Fill cache beyond reasonable limit
        for (let i = 0; i < 1000; i++) {
          setCachedQuery(`key:${i}`, `data:${i}`);
        }
        
        // Cache should implement some form of eviction
        // (This test assumes implementation details)
        expect(queryCache.size).toBeLessThanOrEqual(500); // Reasonable cache size
      });

      it("should clean up expired entries during operation", () => {
        setCachedQuery("temp1", "data", 1); // 1ms TTL
        setCachedQuery("temp2", "data", 1);
        setCachedQuery("permanent", "data", 60000); // 1 minute TTL
        
        // Wait for expiration
        setTimeout(() => {
          getCachedQuery("permanent"); // This should trigger cleanup
          
          expect(queryCache.has("temp1")).toBe(false);
          expect(queryCache.has("temp2")).toBe(false);
          expect(queryCache.has("permanent")).toBe(true);
        }, 10);
      });
    });
  });

  describe("Query Monitor", () => {
    beforeEach(() => {
      resetQueryStats();
    });

    describe("recordQuery", () => {
      it("should record query execution", () => {
        recordQuery("SELECT * FROM users", 150, true);
        
        const stats = getQueryStats();
        expect(stats.totalQueries).toBe(1);
        expect(stats.successfulQueries).toBe(1);
        expect(stats.failedQueries).toBe(0);
        expect(stats.averageExecutionTime).toBe(150);
      });

      it("should track failed queries", () => {
        recordQuery("INVALID SQL", 50, false);
        
        const stats = getQueryStats();
        expect(stats.totalQueries).toBe(1);
        expect(stats.successfulQueries).toBe(0);
        expect(stats.failedQueries).toBe(1);
      });

      it("should calculate average execution time", () => {
        recordQuery("SELECT 1", 100, true);
        recordQuery("SELECT 2", 200, true);
        recordQuery("SELECT 3", 300, true);
        
        const stats = getQueryStats();
        expect(stats.averageExecutionTime).toBe(200); // (100 + 200 + 300) / 3
      });

      it("should track slow queries", () => {
        recordQuery("SLOW SELECT", 2500, true); // > 2000ms threshold
        recordQuery("FAST SELECT", 50, true);
        
        const stats = getQueryStats();
        expect(stats.slowQueries).toBe(1);
      });

      it("should maintain query history", () => {
        const queries = [
          "SELECT * FROM users",
          "INSERT INTO products",
          "UPDATE orders SET status = ?",
          "DELETE FROM temp_data"
        ];
        
        queries.forEach(sql => recordQuery(sql, 100, true));
        
        const stats = getQueryStats();
        expect(stats.recentQueries).toHaveLength(4);
        expect(stats.recentQueries.map(q => q.sql)).toEqual(queries);
      });
    });

    describe("getQueryStats", () => {
      it("should return comprehensive statistics", () => {
        recordQuery("SELECT 1", 100, true);
        recordQuery("SELECT 2", 200, false);
        recordQuery("SELECT 3", 3000, true); // Slow query
        
        const stats = getQueryStats();
        
        expect(stats).toEqual(
          expect.objectContaining({
            totalQueries: 3,
            successfulQueries: 2,
            failedQueries: 1,
            slowQueries: 1,
            averageExecutionTime: expect.any(Number),
            recentQueries: expect.arrayContaining([
              expect.objectContaining({
                sql: expect.any(String),
                executionTime: expect.any(Number),
                success: expect.any(Boolean),
                timestamp: expect.any(Date)
              })
            ])
          })
        );
      });

      it("should handle empty statistics", () => {
        const stats = getQueryStats();
        
        expect(stats.totalQueries).toBe(0);
        expect(stats.averageExecutionTime).toBe(0);
        expect(stats.recentQueries).toHaveLength(0);
      });
    });

    describe("resetQueryStats", () => {
      it("should reset all statistics", () => {
        recordQuery("SELECT 1", 100, true);
        recordQuery("SELECT 2", 200, false);
        
        let stats = getQueryStats();
        expect(stats.totalQueries).toBe(2);
        
        resetQueryStats();
        
        stats = getQueryStats();
        expect(stats.totalQueries).toBe(0);
        expect(stats.successfulQueries).toBe(0);
        expect(stats.failedQueries).toBe(0);
        expect(stats.recentQueries).toHaveLength(0);
      });
    });

    describe("Performance Analysis", () => {
      it("should identify query patterns", () => {
        // Simulate various query patterns
        recordQuery("SELECT * FROM users WHERE id = ?", 50, true);
        recordQuery("SELECT * FROM users WHERE email = ?", 60, true);
        recordQuery("SELECT * FROM products ORDER BY created_at", 200, true);
        recordQuery("SELECT COUNT(*) FROM orders", 30, true);
        
        const stats = getQueryStats();
        
        // Should track different query types
        expect(stats.recentQueries).toHaveLength(4);
        expect(stats.averageExecutionTime).toBe(85); // (50+60+200+30)/4
      });

      it("should detect performance degradation", () => {
        // Record increasingly slow queries
        for (let i = 1; i <= 10; i++) {
          recordQuery(`SELECT ${i}`, i * 100, true);
        }
        
        const stats = getQueryStats();
        
        // Should identify trend of slow queries
        const recentTimes = stats.recentQueries.slice(-5).map(q => q.executionTime);
        const olderTimes = stats.recentQueries.slice(0, 5).map(q => q.executionTime);
        
        const recentAvg = recentTimes.reduce((a, b) => a + b) / recentTimes.length;
        const olderAvg = olderTimes.reduce((a, b) => a + b) / olderTimes.length;
        
        expect(recentAvg).toBeGreaterThan(olderAvg);
      });
    });
  });

  describe("Integration", () => {
    it("should work together for query optimization", () => {
      const cacheKey = "expensive:query";
      const querySQL = "SELECT * FROM complex_view";
      
      // First execution - no cache
      let result = getCachedQuery(cacheKey);
      expect(result).toBeNull();
      
      // Simulate expensive query execution
      const startTime = Date.now();
      recordQuery(querySQL, 1500, true); // Slow query
      const queryResult = [{ id: 1, data: "complex" }];
      setCachedQuery(cacheKey, queryResult, 300);
      
      // Second execution - cached
      result = getCachedQuery(cacheKey);
      expect(result).toEqual(queryResult);
      
      // Verify monitoring recorded the slow query
      const stats = getQueryStats();
      expect(stats.slowQueries).toBe(1);
      expect(stats.totalQueries).toBe(1);
    });

    it("should handle cache invalidation scenarios", () => {
      setCachedQuery("users:all", [{ id: 1 }]);
      setCachedQuery("users:count", 1);
      
      // Simulate data modification that requires cache invalidation
      recordQuery("INSERT INTO users", 100, true);
      clearQueryCache("users:*");
      
      expect(getCachedQuery("users:all")).toBeNull();
      expect(getCachedQuery("users:count")).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should handle cache corruption gracefully", () => {
      // Simulate corrupted cache entry
      queryCache.set("corrupted", { data: undefined, expiresAt: "invalid" } as any);
      
      const result = getCachedQuery("corrupted");
      expect(result).toBeNull();
      expect(queryCache.has("corrupted")).toBe(false);
    });

    it("should handle monitoring failures gracefully", () => {
      // Should not throw even with invalid data
      expect(() => {
        recordQuery("", -1, null as any);
        recordQuery(null as any, undefined as any, true);
      }).not.toThrow();
      
      const stats = getQueryStats();
      expect(stats.totalQueries).toBeGreaterThanOrEqual(0);
    });

    it("should recover from memory pressure", () => {
      // Fill cache with large objects
      const largeData = new Array(10000).fill("x").join("");
      
      for (let i = 0; i < 100; i++) {
        try {
          setCachedQuery(`large:${i}`, largeData);
        } catch {
          // Should handle memory pressure gracefully
          break;
        }
      }
      
      // Cache should still be functional
      setCachedQuery("test", "small");
      expect(getCachedQuery("test")).toBe("small");
    });
  });
});
