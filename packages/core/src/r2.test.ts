import { beforeEach, describe, expect, it, vi } from "vitest";
import { EdgeCache, getR2Service, r2Service } from "./r2";
import { createMockSiteConfig } from "./test-utils";

// Mock the global fetch
global.fetch = vi.fn();

// Mock environment variables
vi.stubEnv("R2_ENDPOINT", "https://test.r2.cloudflarestorage.com");
vi.stubEnv("R2_ACCESS_KEY", "test-access-key");
vi.stubEnv("R2_SECRET", "test-secret");
vi.stubEnv("R2_BUCKET_NAME", "test-bucket");

describe("R2Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("EdgeCache", () => {
    it("should cache and retrieve data", () => {
      const cache = EdgeCache.getInstance();
      const testData = { test: "data" };

      cache.set("test-key", testData, 60);
      const retrieved = cache.get<typeof testData>("test-key");

      expect(retrieved).toEqual(testData);
    });

    it("should return null for expired data", async () => {
      const cache = EdgeCache.getInstance();

      cache.set("expired-key", "data", 0.1); // 100ms TTL

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 200));

      const retrieved = cache.get("expired-key");
      expect(retrieved).toBeNull();
    });

    it("should delete data correctly", () => {
      const cache = EdgeCache.getInstance();

      cache.set("delete-key", "data", 60);
      cache.delete("delete-key");

      const retrieved = cache.get("delete-key");
      expect(retrieved).toBeNull();
    });

    it("should clear all data", () => {
      const cache = EdgeCache.getInstance();

      cache.set("key1", "data1", 60);
      cache.set("key2", "data2", 60);

      cache.clear();

      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
    });
  });

  describe("r2Service integration", () => {
    it("should be properly configured when environment variables are present", () => {
      // This test validates that the proxy is created
      // Actual functionality testing would require real R2 credentials
      expect(r2Service).toBeDefined();
      expect(typeof r2Service).toBe("object");
    });
  });
});
