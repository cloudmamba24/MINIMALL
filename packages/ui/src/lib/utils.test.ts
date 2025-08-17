import { describe, expect, it } from "vitest";
import { capitalize, cn, formatBytes, generateId, sleep, throttle, truncate } from "./utils";

describe("UI utils", () => {
  describe("cn (className utility)", () => {
    it("should merge class names correctly", () => {
      expect(cn("base", "additional")).toBe("base additional");
    });

    it("should handle conditional classes", () => {
      expect(cn("base", true && "conditional")).toBe("base conditional");
      expect(cn("base", false && "conditional")).toBe("base");
    });

    it("should handle undefined and null", () => {
      expect(cn("base", undefined, null)).toBe("base");
    });

    it("should merge Tailwind CSS classes correctly", () => {
      // This assumes tailwind-merge is working correctly
      expect(cn("p-4", "p-2")).toBe("p-2");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("should handle arrays of classes", () => {
      expect(cn(["base", "array"], "additional")).toBe("base array additional");
    });

    it("should handle objects with boolean values", () => {
      expect(
        cn({
          base: true,
          conditional: false,
          active: true,
        })
      ).toBe("base active");
    });
  });

  describe("formatBytes", () => {
    it("should format bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(1073741824)).toBe("1 GB");
    });

    it("should handle decimals", () => {
      expect(formatBytes(1536, 1)).toBe("1.5 KB");
      expect(formatBytes(1536, 0)).toBe("2 KB");
    });
  });

  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
    });
  });

  describe("sleep", () => {
    it("should delay execution", async () => {
      const start = Date.now();
      await sleep(100);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(90); // Allow some timing variance
    });
  });

  describe("throttle", () => {
    it("should throttle function calls", async () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn("call1");
      throttledFn("call2");
      throttledFn("call3");

      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith("call1");

      // Wait for throttle to reset
      await sleep(150);

      throttledFn("call4");
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith("call4");
    });
  });

  describe("capitalize", () => {
    it("should capitalize strings", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("WORLD")).toBe("WORLD");
      expect(capitalize("")).toBe("");
      expect(capitalize("a")).toBe("A");
    });
  });

  describe("truncate", () => {
    it("should truncate long strings", () => {
      expect(truncate("Hello World", 5)).toBe("Hello...");
      expect(truncate("Hello World", 20)).toBe("Hello World");
      expect(truncate("Test", 10)).toBe("Test");
    });
  });
});
