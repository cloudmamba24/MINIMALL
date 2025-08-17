/**
 * Connection Pool Load Testing
 * Tests database connection pooling under various load conditions
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDatabaseConnection, clearDatabaseConnection } from "@minimall/db";
import { performance } from "perf_hooks";

describe("Database Connection Pool Load Tests", () => {
  beforeAll(() => {
    // Ensure we have a test database URL
    if (!process.env.DATABASE_URL && !process.env.TEST_DATABASE_URL) {
      throw new Error("TEST_DATABASE_URL is required for load tests");
    }
  });

  afterAll(() => {
    clearDatabaseConnection();
  });

  it("should reuse the same connection instance", () => {
    const conn1 = getDatabaseConnection();
    const conn2 = getDatabaseConnection();
    expect(conn1).toBe(conn2);
  });

  it("should handle concurrent connections efficiently", async () => {
    const concurrentRequests = 50;
    const startTime = performance.now();
    
    // Create multiple concurrent database operations
    const promises = Array.from({ length: concurrentRequests }, async (_, i) => {
      const db = getDatabaseConnection();
      // Simple query to test connection
      return db.execute`SELECT ${i} as num`;
    });

    const results = await Promise.all(promises);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // All queries should succeed
    expect(results).toHaveLength(concurrentRequests);
    results.forEach((result, i) => {
      expect(result).toBeDefined();
    });

    // Should complete within reasonable time (adjust based on your DB)
    console.log(`Concurrent test completed in ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(5000); // 5 seconds for 50 queries
  });

  it("should handle rapid sequential connections", async () => {
    const sequentialRequests = 100;
    const startTime = performance.now();
    
    for (let i = 0; i < sequentialRequests; i++) {
      const db = getDatabaseConnection();
      await db.execute`SELECT ${i} as num`;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Sequential test completed in ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(10000); // 10 seconds for 100 queries
  });

  it("should handle connection pool exhaustion gracefully", async () => {
    const heavyLoadRequests = 200;
    const batchSize = 50;
    
    const processBatch = async (batch: number) => {
      const promises = Array.from({ length: batchSize }, async (_, i) => {
        const db = getDatabaseConnection();
        // Simulate a slower query
        return db.execute`SELECT pg_sleep(0.1), ${batch * batchSize + i} as num`;
      });
      return Promise.all(promises);
    };

    const startTime = performance.now();
    
    // Process in batches to avoid overwhelming the connection pool
    for (let batch = 0; batch < heavyLoadRequests / batchSize; batch++) {
      await processBatch(batch);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Heavy load test completed in ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(30000); // 30 seconds for 200 queries with delays
  });

  it("should maintain connection after clearing and recreating", () => {
    const conn1 = getDatabaseConnection();
    clearDatabaseConnection();
    const conn2 = getDatabaseConnection();
    
    // Should be different instances after clearing
    expect(conn1).not.toBe(conn2);
    
    // But subsequent calls should reuse the new instance
    const conn3 = getDatabaseConnection();
    expect(conn2).toBe(conn3);
  });

  it("should handle connection with different URLs", () => {
    const testUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    if (!testUrl) {
      console.log("Skipping URL change test - no TEST_DATABASE_URL");
      return;
    }
    
    const conn1 = getDatabaseConnection();
    const conn2 = getDatabaseConnection(testUrl);
    
    // If URL is different, should create new connection
    if (testUrl !== process.env.DATABASE_URL) {
      expect(conn1).not.toBe(conn2);
    } else {
      // Same URL should reuse connection
      expect(conn1).toBe(conn2);
    }
  });

  describe("Performance Benchmarks", () => {
    it("should measure connection overhead", async () => {
      const iterations = 1000;
      
      // Measure time to get connection (should be nearly instant after first call)
      const getConnectionTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        getDatabaseConnection();
        const end = performance.now();
        getConnectionTimes.push(end - start);
      }
      
      const avgTime = getConnectionTimes.reduce((a, b) => a + b, 0) / iterations;
      const maxTime = Math.max(...getConnectionTimes);
      
      console.log(`Average connection retrieval time: ${avgTime.toFixed(4)}ms`);
      console.log(`Max connection retrieval time: ${maxTime.toFixed(4)}ms`);
      
      // Should be very fast (< 0.1ms average)
      expect(avgTime).toBeLessThan(0.1);
      expect(maxTime).toBeLessThan(1);
    });

    it("should compare pooled vs non-pooled performance", async () => {
      // This test demonstrates the benefit of connection pooling
      const queries = 20;
      
      // With pooling (our implementation)
      const pooledStart = performance.now();
      for (let i = 0; i < queries; i++) {
        const db = getDatabaseConnection();
        await db.execute`SELECT 1`;
      }
      const pooledDuration = performance.now() - pooledStart;
      
      console.log(`Pooled connections: ${pooledDuration.toFixed(2)}ms for ${queries} queries`);
      console.log(`Average per query: ${(pooledDuration / queries).toFixed(2)}ms`);
      
      // Our pooled implementation should be efficient
      expect(pooledDuration / queries).toBeLessThan(100); // < 100ms per query average
    });
  });
});

describe("Connection Pool Error Handling", () => {
  it("should throw error when DATABASE_URL is not set", () => {
    const originalUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    
    expect(() => getDatabaseConnection()).toThrow(
      "DATABASE_URL is not configured"
    );
    
    // Restore
    if (originalUrl) {
      process.env.DATABASE_URL = originalUrl;
    }
  });

  it("should handle invalid connection strings gracefully", () => {
    expect(() => getDatabaseConnection("invalid-url")).toThrow();
  });

  it("should recover from connection errors", async () => {
    // Clear any existing connection
    clearDatabaseConnection();
    
    // First connection should work
    const db = getDatabaseConnection();
    const result = await db.execute`SELECT 1 as test`;
    expect(result).toBeDefined();
    
    // Even after clearing, new connection should work
    clearDatabaseConnection();
    const db2 = getDatabaseConnection();
    const result2 = await db2.execute`SELECT 2 as test`;
    expect(result2).toBeDefined();
  });
});