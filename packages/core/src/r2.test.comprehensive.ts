/**
 * Comprehensive tests for R2 Storage Service
 * Covers file upload, download, optimization, and error handling
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { R2ConfigService, edgeCache, getR2Service, r2Service } from "./r2";
import type { SiteConfig } from "./types";

// Mock AWS S3 client
const mockS3Client = {
  send: vi.fn(),
  config: {
    region: "auto",
    endpoint: "https://test.r2.cloudflarestorage.com",
  },
};

// Mock commands
const mockPutObjectCommand = vi.fn();
const mockGetObjectCommand = vi.fn();
const mockDeleteObjectCommand = vi.fn();
const mockHeadObjectCommand = vi.fn();
const mockListObjectsV2Command = vi.fn();
const mockCopyObjectCommand = vi.fn();
const mockCreateMultipartUploadCommand = vi.fn();
const mockUploadPartCommand = vi.fn();
const mockCompleteMultipartUploadCommand = vi.fn();
const mockAbortMultipartUploadCommand = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => mockS3Client),
  PutObjectCommand: mockPutObjectCommand,
  GetObjectCommand: mockGetObjectCommand,
  DeleteObjectCommand: mockDeleteObjectCommand,
  HeadObjectCommand: mockHeadObjectCommand,
  ListObjectsV2Command: mockListObjectsV2Command,
  CopyObjectCommand: mockCopyObjectCommand,
  CreateMultipartUploadCommand: mockCreateMultipartUploadCommand,
  UploadPartCommand: mockUploadPartCommand,
  CompleteMultipartUploadCommand: mockCompleteMultipartUploadCommand,
  AbortMultipartUploadCommand: mockAbortMultipartUploadCommand,
}));

// Mock sharp for image processing
const mockSharp = {
  resize: vi.fn().mockReturnThis(),
  webp: vi.fn().mockReturnThis(),
  jpeg: vi.fn().mockReturnThis(),
  png: vi.fn().mockReturnThis(),
  toBuffer: vi.fn().mockResolvedValue(Buffer.from("optimized-image")),
  metadata: vi.fn().mockResolvedValue({
    width: 1920,
    height: 1080,
    format: "jpeg",
    size: 1024000,
  }),
};

vi.mock("sharp", () => ({
  default: vi.fn(() => mockSharp),
}));

// Mock fetch for R2Client HTTP calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Define R2Config interface for tests
interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region?: string;
}

// Define additional interfaces for comprehensive testing
interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

interface OptimizationOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: "webp" | "jpeg" | "png" | "avif";
}

describe("R2 Storage Service - Comprehensive Tests", () => {
  const mockConfig: R2Config = {
    endpoint: "https://test.r2.cloudflarestorage.com",
    accessKeyId: "test-access-key",
    secretAccessKey: "test-secret-key",
    bucketName: "test-bucket",
    region: "auto",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    mockFetch.mockReset();
    // Mock environment variables
    process.env.R2_ENDPOINT = mockConfig.endpoint;
    process.env.R2_ACCESS_KEY = mockConfig.accessKeyId;
    process.env.R2_SECRET = mockConfig.secretAccessKey;
    process.env.R2_BUCKET_NAME = mockConfig.bucketName;
  });

  afterEach(() => {
    // Clean up environment
    process.env.R2_ENDPOINT = undefined;
    process.env.R2_ACCESS_KEY = undefined;
    process.env.R2_SECRET = undefined;
    process.env.R2_BUCKET_NAME = undefined;
  });

  describe("R2ConfigService Class", () => {
    it("should initialize with proper environment configuration", () => {
      const service = new R2ConfigService();
      expect(service).toBeInstanceOf(R2ConfigService);
    });

    it("should validate environment variables on initialization", () => {
      // Clear one required env var
      process.env.R2_ENDPOINT = undefined;

      expect(() => new R2ConfigService()).toThrow("Missing required R2 environment variables");
    });

    it("should have proper error message for missing variables", () => {
      process.env.R2_ENDPOINT = undefined;
      process.env.R2_ACCESS_KEY = undefined;
      process.env.R2_SECRET = undefined;
      process.env.R2_BUCKET_NAME = undefined;

      expect(() => new R2ConfigService()).toThrow(
        "Missing required R2 environment variables. Required: R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET, R2_BUCKET_NAME"
      );
    });
  });

  describe("getR2Service", () => {
    it("should return service instance with valid environment", () => {
      const service = getR2Service();
      expect(service).toBeInstanceOf(R2ConfigService);
    });

    it("should return null with missing environment variables", () => {
      process.env.R2_ENDPOINT = undefined;

      const service = getR2Service();
      expect(service).toBeNull();
    });
  });

  describe("r2Service proxy", () => {
    it("should provide access to service methods", () => {
      // Mock successful fetch response
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('{"test": "config"}'),
      });

      expect(typeof r2Service.getConfig).toBe("function");
      expect(typeof r2Service.saveConfig).toBe("function");
      expect(typeof r2Service.deleteConfig).toBe("function");
    });
  });

  describe("File Upload Operations", () => {
    describe("putObject via R2ConfigService", () => {
      it("should upload object successfully", async () => {
        const mockResponse = {
          ok: true,
          status: 200,
          statusText: "OK",
        };

        mockFetch.mockResolvedValueOnce(mockResponse);
        const service = new R2ConfigService();

        const result = await service.putObject("images/test.jpg", "test content", {
          contentType: "image/jpeg",
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("images/test.jpg"),
          expect.objectContaining({
            method: "PUT",
            body: "test content",
            headers: expect.objectContaining({
              "Content-Type": "image/jpeg",
            }),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle upload errors", async () => {
        const mockResponse = {
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        };

        mockFetch.mockResolvedValueOnce(mockResponse);
        const service = new R2ConfigService();

        await expect(service.putObject("test.jpg", "content")).rejects.toThrow(
          "Failed to upload to R2: 500 Internal Server Error"
        );
      });

      it("should support different content types", async () => {
        const mockResponse = { ok: true, status: 200, statusText: "OK" };
        mockFetch.mockResolvedValueOnce(mockResponse);

        const service = new R2ConfigService();

        await service.putObject("data.json", '{"test": "data"}', {
          contentType: "application/json",
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
          })
        );
      });

      it("should handle Buffer and ArrayBuffer uploads", async () => {
        const mockResponse = { ok: true, status: 200, statusText: "OK" };
        mockFetch.mockResolvedValue(mockResponse);

        const service = new R2ConfigService();
        const buffer = Buffer.from("test content");

        await service.putObject("test.bin", buffer, {
          contentType: "application/octet-stream",
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: "PUT",
            body: "test content", // Buffer gets converted to string
          })
        );
      });
    });

    describe("Configuration Operations", () => {
      const mockSiteConfig: SiteConfig = {
        id: "test-config-123",
        version: "1.0.0",
        categories: [],
        settings: {
          theme: "modern",
          layout: "grid",
        } as any,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      };

      describe("saveConfig", () => {
        it("should save configuration successfully", async () => {
          const mockResponse = { ok: true, status: 200, statusText: "OK" };
          mockFetch.mockResolvedValueOnce(mockResponse);

          const service = new R2ConfigService();

          await service.saveConfig("test-config", mockSiteConfig);

          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("configs/test-config/current.json"),
            expect.objectContaining({
              method: "PUT",
              body: JSON.stringify(mockSiteConfig, null, 2),
              headers: expect.objectContaining({
                "Content-Type": "application/json",
              }),
            })
          );
        });

        it("should save versioned configuration", async () => {
          const mockResponse = { ok: true, status: 200, statusText: "OK" };
          mockFetch.mockResolvedValueOnce(mockResponse);

          const service = new R2ConfigService();

          await service.saveConfig("test-config", mockSiteConfig, "v1.1.0");

          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("configs/test-config/versions/v1.1.0.json"),
            expect.any(Object)
          );
        });

        it("should handle save errors", async () => {
          const mockResponse = {
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
          };
          mockFetch.mockResolvedValueOnce(mockResponse);

          const service = new R2ConfigService();

          await expect(service.saveConfig("test-config", mockSiteConfig)).rejects.toThrow(
            "Failed to upload to R2: 500 Internal Server Error"
          );
        });
      });

      describe("getConfig", () => {
        it("should retrieve configuration successfully", async () => {
          const mockResponse = {
            ok: true,
            text: () => Promise.resolve(JSON.stringify(mockSiteConfig)),
          };
          mockFetch.mockResolvedValueOnce(mockResponse);

          const service = new R2ConfigService();
          const result = await service.getConfig("test-config");

          expect(result).toEqual(mockSiteConfig);
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("configs/test-config/current.json"),
            expect.objectContaining({
              method: "GET",
            })
          );
        });

        it("should retrieve versioned configuration", async () => {
          const mockResponse = {
            ok: true,
            text: () => Promise.resolve(JSON.stringify(mockSiteConfig)),
          };
          mockFetch.mockResolvedValueOnce(mockResponse);

          const service = new R2ConfigService();
          await service.getConfig("test-config", "v1.1.0");

          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("configs/test-config/versions/v1.1.0.json"),
            expect.any(Object)
          );
        });

        it("should handle configuration not found", async () => {
          const mockResponse = {
            ok: false,
            status: 404,
            statusText: "Not Found",
          };
          mockFetch.mockResolvedValueOnce(mockResponse);

          const service = new R2ConfigService();

          await expect(service.getConfig("nonexistent-config")).rejects.toThrow(
            "Configuration not found: nonexistent-config"
          );
        });
      });

      describe("deleteConfig", () => {
        it("should delete configuration successfully", async () => {
          const mockResponse = { ok: true, status: 200, statusText: "OK" };
          mockFetch.mockResolvedValueOnce(mockResponse);

          const service = new R2ConfigService();
          await service.deleteConfig("test-config");

          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("configs/test-config/current.json"),
            expect.objectContaining({
              method: "DELETE",
            })
          );
        });
      });

      describe("generateUploadUrl", () => {
        it("should generate presigned upload URL", async () => {
          const service = new R2ConfigService();
          const result = await service.generateUploadUrl("shop123", "image.jpg", "image/jpeg");

          expect(result.key).toMatch(/^uploads\/shop123\/\d+-image\.jpg$/);
          expect(result.url).toContain("X-Amz-Signature");
          expect(result.url).toContain("image.jpg");
        });
      });
    });

    describe("Edge Cache Operations", () => {
      describe("basic caching", () => {
        it("should cache and retrieve data", () => {
          const testData = { test: "cached data" };

          edgeCache.set("test-key", testData, 300);
          const result = edgeCache.get("test-key");

          expect(result).toEqual(testData);
        });

        it("should respect TTL expiration", () => {
          const testData = { test: "expired data" };

          edgeCache.set("expire-test", testData, -1); // Already expired
          const result = edgeCache.get("expire-test");

          expect(result).toBeNull();
        });

        it("should handle cache invalidation by pattern", () => {
          edgeCache.set("invalidate-test", { data: "test" }, 300);

          const invalidated = edgeCache.invalidateByPattern(/^invalidate-/);
          const result = edgeCache.get("invalidate-test");

          expect(invalidated).toBe(1);
          expect(result).toBeNull();
        });

        it("should handle cache invalidation by tags", () => {
          edgeCache.set("tag-test", { data: "test" }, 300, ["user:123", "config"]);

          const invalidated = edgeCache.invalidateByTags(["user:123"]);
          const result = edgeCache.get("tag-test");

          expect(invalidated).toBe(1);
          expect(result).toBeNull();
        });

        it("should provide cache statistics", () => {
          edgeCache.clear(); // Start fresh
          edgeCache.set("stats-test-1", { data: 1 }, 300);
          edgeCache.set("stats-test-2", { data: 2 }, -1); // Expired

          const stats = edgeCache.getStats();

          expect(stats.total).toBe(2);
          expect(stats.valid).toBe(1);
          expect(stats.expired).toBe(1);
        });
      });
    });

    describe("Error Handling and Edge Cases", () => {
      it("should handle network failures gracefully", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const service = new R2ConfigService();

        await expect(service.getConfig("test-config")).rejects.toThrow("Network error");
      });

      it("should handle malformed JSON responses", async () => {
        const mockResponse = {
          ok: true,
          text: () => Promise.resolve("invalid-json-{"),
        };
        mockFetch.mockResolvedValueOnce(mockResponse);

        const service = new R2ConfigService();

        await expect(service.getConfig("test-config")).rejects.toThrow();
      });
    });
  });
});
