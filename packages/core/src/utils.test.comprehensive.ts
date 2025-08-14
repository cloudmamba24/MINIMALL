/**
 * Comprehensive tests for core utility functions
 * Covers configuration management, product handling, and performance utilities
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { validateSiteConfig, generateConfigId } from "./utils";
import {
	generateUniqueId,
	formatProductPrice,
	formatShopifyHandle,
	parseShopifyProductId,
	isValidShopifyId,
	calculatePerformanceScore,
	shouldPreloadImages,
	optimizeImageUrl,
	generateCacheKey,
	validatePerformanceMetrics,
	generateShopifyCheckoutUrl,
	extractProductIdFromHandle,
	sanitizeFilename,
	validateImageFormat,
	slugify,
	parseUrlParams,
	formatFileSize,
	calculateAspectRatio,
	debounce,
	throttle,
	retry,
	isValidUrl
} from "./utils-extended";
import type { SiteConfig, PerformanceMetrics, ShopifyProduct } from "./types";

describe("Core Utilities - Comprehensive Tests", () => {
	describe("Configuration Management", () => {
		describe("validateSiteConfig", () => {
			it("should validate valid site config", () => {
				const validConfig: SiteConfig = {
					id: "test123",
					version: "1.0.0",
					categories: [],
					settings: {
						checkoutLink: "https://shop.example.com",
						shopDomain: "example.myshopify.com",
						theme: {
							primaryColor: "#000000",
							backgroundColor: "#ffffff"
						}
					},
					createdAt: "2023-01-01T00:00:00Z",
					updatedAt: "2023-01-01T00:00:00Z"
				};

				expect(validateSiteConfig(validConfig)).toBe(true);
			});

			it("should reject invalid config missing required fields", () => {
				const invalidConfig = {
					id: "test123",
					categories: []
					// missing settings
				};

				expect(validateSiteConfig(invalidConfig)).toBe(false);
			});

			it("should reject null config", () => {
				expect(validateSiteConfig(null)).toBe(false);
			});

			it("should reject primitive values", () => {
				expect(validateSiteConfig("string")).toBe(false);
				expect(validateSiteConfig(123)).toBe(false);
				expect(validateSiteConfig(true)).toBe(false);
			});
		});

		describe("generateConfigId", () => {
			it("should generate 10 character string", () => {
				const id = generateConfigId();
				expect(id).toHaveLength(10);
			});

			it("should generate unique IDs", () => {
				const ids = new Set();
				for (let i = 0; i < 100; i++) {
					ids.add(generateConfigId());
				}
				expect(ids.size).toBe(100);
			});

			it("should only contain alphanumeric characters", () => {
				const id = generateConfigId();
				expect(id).toMatch(/^[A-Za-z0-9]+$/);
			});
		});

		describe("generateUniqueId", () => {
			it("should generate unique identifier with prefix", () => {
				const id = generateUniqueId("prod");
				expect(id).toMatch(/^prod-[A-Za-z0-9]+$/);
			});

			it("should generate different IDs on subsequent calls", () => {
				const id1 = generateUniqueId("test");
				const id2 = generateUniqueId("test");
				expect(id1).not.toBe(id2);
			});
		});
	});

	describe("Product Utilities", () => {
		describe("formatProductPrice", () => {
			it("should format USD price correctly", () => {
				const price = formatProductPrice(1999, "USD");
				expect(price).toBe("$19.99");
			});

			it("should format EUR price correctly", () => {
				const price = formatProductPrice(2550, "EUR");
				expect(price).toBe("€25.50");
			});

			it("should handle zero price", () => {
				const price = formatProductPrice(0, "USD");
				expect(price).toBe("$0.00");
			});

			it("should handle large amounts", () => {
				const price = formatProductPrice(999999, "USD");
				expect(price).toBe("$9,999.99");
			});
		});

		describe("formatShopifyHandle", () => {
			it("should convert title to valid handle", () => {
				const handle = formatShopifyHandle("My Awesome Product!");
				expect(handle).toBe("my-awesome-product");
			});

			it("should handle special characters", () => {
				const handle = formatShopifyHandle("Product@#$%^&*()Name");
				expect(handle).toBe("productname");
			});

			it("should handle unicode characters", () => {
				const handle = formatShopifyHandle("Café & Résumé");
				expect(handle).toBe("cafe-resume");
			});

			it("should handle consecutive spaces", () => {
				const handle = formatShopifyHandle("Multiple    Spaces");
				expect(handle).toBe("multiple-spaces");
			});
		});

		describe("parseShopifyProductId", () => {
			it("should extract numeric ID from GID", () => {
				const id = parseShopifyProductId("gid://shopify/Product/123456789");
				expect(id).toBe("123456789");
			});

			it("should return original if not a GID", () => {
				const id = parseShopifyProductId("123456789");
				expect(id).toBe("123456789");
			});

			it("should handle variant IDs", () => {
				const id = parseShopifyProductId("gid://shopify/ProductVariant/987654321");
				expect(id).toBe("987654321");
			});
		});

		describe("isValidShopifyId", () => {
			it("should validate correct Shopify GID format", () => {
				expect(isValidShopifyId("gid://shopify/Product/123")).toBe(true);
				expect(isValidShopifyId("gid://shopify/ProductVariant/456")).toBe(true);
			});

			it("should reject invalid formats", () => {
				expect(isValidShopifyId("123")).toBe(false);
				expect(isValidShopifyId("product_123")).toBe(false);
				expect(isValidShopifyId("gid://invalid/Product/123")).toBe(false);
			});

			it("should handle edge cases", () => {
				expect(isValidShopifyId("")).toBe(false);
				expect(isValidShopifyId(undefined)).toBe(false);
				expect(isValidShopifyId(null)).toBe(false);
			});
		});
	});

	describe("Performance Utilities", () => {
		describe("calculatePerformanceScore", () => {
			it("should calculate score for good metrics", () => {
				const metrics: PerformanceMetrics = {
					configId: "test",
					lcp: 1200, // Good LCP
					fid: 80,   // Good FID
					cls: 0.05, // Good CLS
					ttfb: 150, // Good TTFB
					loadTime: 1000,
					timestamp: new Date()
				};

				const score = calculatePerformanceScore(metrics);
				expect(score).toBeGreaterThan(80); // Should be good score
			});

			it("should calculate score for poor metrics", () => {
				const metrics: PerformanceMetrics = {
					configId: "test",
					lcp: 3000, // Poor LCP
					fid: 200,  // Poor FID
					cls: 0.25, // Poor CLS
					ttfb: 500, // Poor TTFB
					loadTime: 5000,
					timestamp: new Date()
				};

				const score = calculatePerformanceScore(metrics);
				expect(score).toBeLessThan(50); // Should be poor score
			});

			it("should handle missing metrics", () => {
				const metrics: PerformanceMetrics = {
					configId: "test",
					timestamp: new Date()
				};

				const score = calculatePerformanceScore(metrics);
				expect(score).toBeGreaterThanOrEqual(0);
				expect(score).toBeLessThanOrEqual(100);
			});
		});

		describe("shouldPreloadImages", () => {
			it("should recommend preloading for above-fold images", () => {
				const shouldPreload = shouldPreloadImages({
					position: "above-fold",
					priority: "high",
					size: "large"
				});
				expect(shouldPreload).toBe(true);
			});

			it("should not recommend preloading for below-fold images", () => {
				const shouldPreload = shouldPreloadImages({
					position: "below-fold",
					priority: "low",
					size: "small"
				});
				expect(shouldPreload).toBe(false);
			});
		});

		describe("validatePerformanceMetrics", () => {
			it("should validate correct metrics format", () => {
				const metrics: PerformanceMetrics = {
					configId: "test123",
					lcp: 1500,
					fid: 100,
					cls: 0.1,
					timestamp: new Date()
				};

				expect(validatePerformanceMetrics(metrics)).toBe(true);
			});

			it("should reject metrics with invalid values", () => {
				const invalidMetrics = {
					configId: "test123",
					lcp: -100, // Invalid negative value
					timestamp: new Date()
				};

				expect(validatePerformanceMetrics(invalidMetrics as any)).toBe(false);
			});
		});
	});

	describe("Image Utilities", () => {
		describe("optimizeImageUrl", () => {
			it("should add optimization parameters", () => {
				const url = "https://cdn.shopify.com/image.jpg";
				const optimized = optimizeImageUrl(url, {
					width: 800,
					height: 600,
					quality: 80,
					format: "webp"
				});

				expect(optimized).toContain("800x600");
			});

			it("should handle non-Shopify URLs", () => {
				const url = "https://example.com/image.jpg";
				const optimized = optimizeImageUrl(url, { width: 800 });
				expect(optimized).toBe(url); // Should return original
			});
		});

		describe("validateImageFormat", () => {
			it("should validate supported formats", () => {
				expect(validateImageFormat("image/jpeg")).toBe(true);
				expect(validateImageFormat("image/png")).toBe(true);
				expect(validateImageFormat("image/webp")).toBe(true);
				expect(validateImageFormat("image/avif")).toBe(true);
			});

			it("should reject unsupported formats", () => {
				expect(validateImageFormat("image/bmp")).toBe(false);
				expect(validateImageFormat("image/tiff")).toBe(false);
				expect(validateImageFormat("video/mp4")).toBe(false);
			});
		});

		describe("calculateAspectRatio", () => {
			it("should calculate correct aspect ratio", () => {
				expect(calculateAspectRatio(1920, 1080)).toBe("16:9");
				expect(calculateAspectRatio(1080, 1080)).toBe("1:1");
				expect(calculateAspectRatio(1080, 1350)).toBe("4:5");
			});

			it("should handle edge cases", () => {
				expect(calculateAspectRatio(0, 100)).toBe("0:1");
				expect(calculateAspectRatio(100, 0)).toBe("1:0");
			});
		});
	});

	describe("Utility Functions", () => {
		describe("slugify", () => {
			it("should convert text to URL-friendly slug", () => {
				expect(slugify("Hello World!")).toBe("hello-world");
				expect(slugify("My Awesome Product")).toBe("my-awesome-product");
				expect(slugify("UPPERCASE Text")).toBe("uppercase-text");
			});

			it("should handle special characters", () => {
				expect(slugify("Café & Restaurant")).toBe("cafe-restaurant");
				expect(slugify("100% Natural")).toBe("100-natural");
			});

			it("should handle consecutive spaces and dashes", () => {
				expect(slugify("Multiple   Spaces")).toBe("multiple-spaces");
				expect(slugify("Already-Has--Dashes")).toBe("already-has-dashes");
			});
		});

		describe("formatFileSize", () => {
			it("should format bytes correctly", () => {
				expect(formatFileSize(0)).toBe("0 B");
				expect(formatFileSize(1024)).toBe("1.0 KB");
				expect(formatFileSize(1048576)).toBe("1.0 MB");
				expect(formatFileSize(1073741824)).toBe("1.0 GB");
			});

			it("should handle decimal places", () => {
				expect(formatFileSize(1536)).toBe("1.5 KB");
				expect(formatFileSize(2621440)).toBe("2.5 MB");
			});
		});

		describe("parseUrlParams", () => {
			it("should parse URL parameters correctly", () => {
				const params = parseUrlParams("?name=John&age=25&active=true");
				expect(params).toEqual({
					name: "John",
					age: "25",
					active: "true"
				});
			});

			it("should handle empty query string", () => {
				expect(parseUrlParams("")).toEqual({});
				expect(parseUrlParams("?")).toEqual({});
			});

			it("should handle URL encoding", () => {
				const params = parseUrlParams("?search=hello%20world&filter=A%26B");
				expect(params.search).toBe("hello world");
				expect(params.filter).toBe("A&B");
			});
		});

		describe("isValidUrl", () => {
			it("should validate correct URLs", () => {
				expect(isValidUrl("https://example.com")).toBe(true);
				expect(isValidUrl("http://localhost:3000")).toBe(true);
				expect(isValidUrl("https://sub.example.com/path?query=1")).toBe(true);
			});

			it("should reject invalid URLs", () => {
				expect(isValidUrl("not-a-url")).toBe(false);
				expect(isValidUrl("ftp://example.com")).toBe(false);
				expect(isValidUrl("")).toBe(false);
			});
		});

		describe("sanitizeFilename", () => {
			it("should remove invalid filename characters", () => {
				expect(sanitizeFilename("file<>:\"/\\|?*.txt")).toBe("file.txt");
				expect(sanitizeFilename("normal-file.jpg")).toBe("normal-file.jpg");
			});

			it("should handle edge cases", () => {
				expect(sanitizeFilename("")).toBe("untitled");
				expect(sanitizeFilename("...")).toBe("untitled");
				expect(sanitizeFilename("CON")).toBe("CON_file"); // Windows reserved name
			});
		});
	});

	describe("Async Utilities", () => {
		describe("debounce", () => {
			it("should debounce function calls", async () => {
				const mockFn = vi.fn();
				const debouncedFn = debounce(mockFn, 100);

				debouncedFn();
				debouncedFn();
				debouncedFn();

				expect(mockFn).not.toHaveBeenCalled();

				await new Promise(resolve => setTimeout(resolve, 150));
				expect(mockFn).toHaveBeenCalledTimes(1);
			});
		});

		describe("throttle", () => {
			it("should throttle function calls", async () => {
				const mockFn = vi.fn();
				const throttledFn = throttle(mockFn, 100);

				throttledFn();
				throttledFn();
				throttledFn();

				expect(mockFn).toHaveBeenCalledTimes(1);

				await new Promise(resolve => setTimeout(resolve, 150));
				throttledFn();
				expect(mockFn).toHaveBeenCalledTimes(2);
			});
		});

		describe("retry", () => {
			it("should retry failed operations", async () => {
				let attempts = 0;
				const mockFn = vi.fn().mockImplementation(() => {
					attempts++;
					if (attempts < 3) {
						throw new Error("Temporary failure");
					}
					return "success";
				});

				const result = await retry(mockFn, { maxAttempts: 3, delay: 10 });
				expect(result).toBe("success");
				expect(mockFn).toHaveBeenCalledTimes(3);
			});

			it("should throw after max attempts", async () => {
				const mockFn = vi.fn().mockRejectedValue(new Error("Persistent failure"));

				await expect(retry(mockFn, { maxAttempts: 2, delay: 10 }))
					.rejects.toThrow("Persistent failure");
				expect(mockFn).toHaveBeenCalledTimes(2);
			});
		});
	});

	describe("Cache Utilities", () => {
		describe("generateCacheKey", () => {
			it("should generate consistent cache keys", () => {
				const key1 = generateCacheKey("products", { shop: "test", page: 1 });
				const key2 = generateCacheKey("products", { shop: "test", page: 1 });
				expect(key1).toBe(key2);
			});

			it("should generate different keys for different data", () => {
				const key1 = generateCacheKey("products", { shop: "test", page: 1 });
				const key2 = generateCacheKey("products", { shop: "test", page: 2 });
				expect(key1).not.toBe(key2);
			});

			it("should handle complex objects", () => {
				const key = generateCacheKey("config", {
					shop: "test",
					filters: { category: "clothes", price: { min: 10, max: 100 } }
				});
				expect(key).toContain("config");
				expect(typeof key).toBe("string");
			});
		});
	});

	describe("Shopify Integration", () => {
		describe("generateShopifyCheckoutUrl", () => {
			it("should generate correct checkout URL", () => {
				const items = [
					{ variantId: "123", quantity: 2 },
					{ variantId: "456", quantity: 1 }
				];
				const url = generateShopifyCheckoutUrl("test-shop.myshopify.com", items);
				
				expect(url).toContain("test-shop.myshopify.com");
				expect(url).toContain("cart");
				expect(url).toContain("123:2");
				expect(url).toContain("456:1");
			});

			it("should handle single item", () => {
				const items = [{ variantId: "123", quantity: 1 }];
				const url = generateShopifyCheckoutUrl("shop.myshopify.com", items);
				
				expect(url).toContain("123:1");
			});

			it("should handle empty cart", () => {
				const url = generateShopifyCheckoutUrl("shop.myshopify.com", []);
				expect(url).toContain("cart");
			});
		});

		describe("extractProductIdFromHandle", () => {
			it("should extract product ID from handle", () => {
				const id = extractProductIdFromHandle("awesome-t-shirt-123");
				expect(id).toBe("123");
			});

			it("should handle handle without ID", () => {
				const id = extractProductIdFromHandle("awesome-t-shirt");
				expect(id).toBeNull();
			});

			it("should handle complex handles", () => {
				const id = extractProductIdFromHandle("super-awesome-product-v2-456789");
				expect(id).toBe("456789");
			});
		});
	});
});
