import { describe, expect, it, vi } from "vitest";
import { createMockSiteConfig } from "./test-utils";
import {
  debounce,
  findCategoryById,
  formatPrice,
  generateConfigId,
  isValidHexColor,
  validateSiteConfig,
} from "./utils";

describe("utils", () => {
  describe("validateSiteConfig", () => {
    it("should validate a correct site config", () => {
      const config = createMockSiteConfig();
      expect(validateSiteConfig(config)).toBe(true);
    });

    it("should reject invalid config", () => {
      expect(validateSiteConfig(null)).toBe(false);
      expect(validateSiteConfig({})).toBe(false);
      expect(validateSiteConfig({ id: "test" })).toBe(false);
    });
  });

  describe("generateConfigId", () => {
    it("should generate a 10-character ID", () => {
      const id = generateConfigId();
      expect(id).toHaveLength(10);
      expect(typeof id).toBe("string");
    });

    it("should generate unique IDs", () => {
      const id1 = generateConfigId();
      const id2 = generateConfigId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("findCategoryById", () => {
    it("should find category by ID", () => {
      const config = createMockSiteConfig();
      const category = findCategoryById(config.categories, "instagram");
      expect(category).toBeTruthy();
      expect(category?.id).toBe("instagram");
    });

    it("should return null for non-existent ID", () => {
      const config = createMockSiteConfig();
      const category = findCategoryById(config.categories, "non-existent");
      expect(category).toBeNull();
    });
  });

  describe("formatPrice", () => {
    it("should format price correctly", () => {
      expect(formatPrice(2999)).toBe("$29.99");
      expect(formatPrice(100)).toBe("$1.00");
      expect(formatPrice(0)).toBe("$0.00");
    });
  });

  describe("isValidHexColor", () => {
    it("should validate hex colors", () => {
      expect(isValidHexColor("#000000")).toBe(true);
      expect(isValidHexColor("#FFFFFF")).toBe(true);
      expect(isValidHexColor("#123ABC")).toBe(true);
    });

    it("should reject invalid hex colors", () => {
      expect(isValidHexColor("#000")).toBe(false);
      expect(isValidHexColor("000000")).toBe(false);
      expect(isValidHexColor("#GGGGGG")).toBe(false);
    });
  });

  describe("debounce", () => {
    it("should debounce function calls", async () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn("test1");
      debouncedFn("test2");
      debouncedFn("test3");

      expect(fn).not.toHaveBeenCalled();

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith("test3");
    });
  });
});
