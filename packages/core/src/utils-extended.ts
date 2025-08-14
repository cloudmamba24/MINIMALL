/**
 * Extended utility functions for comprehensive testing
 * This file contains additional utilities that extend the core utils
 */

import type { SiteConfig, PerformanceMetrics } from "./types";

// ID Generation utilities
export function generateUniqueId(prefix: string = "id"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${prefix}-${timestamp}-${random}`;
}

// Product utilities
export function formatProductPrice(cents: number, currency: string = "USD"): string {
  const amount = cents / 100;
  
  const formatters: Record<string, Intl.NumberFormat> = {
    USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    EUR: new Intl.NumberFormat("en-EU", { style: "currency", currency: "EUR" }),
    GBP: new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }),
  };

  const formatter = formatters[currency];
  if (formatter) {
    return formatter.format(amount);
  }

  // Add commas for large numbers
  const formattedAmount = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${formattedAmount} ${currency}`;
}

export function formatShopifyHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim()
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export function parseShopifyProductId(gid: string): string {
  if (gid.startsWith("gid://shopify/")) {
    return gid.split("/").pop() || gid;
  }
  return gid;
}

export function isValidShopifyId(id: any): boolean {
  if (!id || typeof id !== "string") return false;
  
  const gidPattern = /^gid:\/\/shopify\/(Product|ProductVariant|Collection|Customer)\/\d+$/;
  return gidPattern.test(id);
}

// Performance utilities
export function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100;
  
  // LCP scoring (target: <1500ms)
  if (metrics.lcp) {
    if (metrics.lcp > 2500) score -= 30;
    else if (metrics.lcp > 1500) score -= 15;
  }
  
  // FID scoring (target: <120ms)
  if (metrics.fid) {
    if (metrics.fid > 300) score -= 25;
    else if (metrics.fid > 120) score -= 10;
  }
  
  // CLS scoring (target: <0.1)
  if (metrics.cls) {
    if (metrics.cls > 0.25) score -= 25;
    else if (metrics.cls > 0.1) score -= 10;
  }
  
  // TTFB scoring (target: <200ms)
  if (metrics.ttfb) {
    if (metrics.ttfb > 600) score -= 20;
    else if (metrics.ttfb > 200) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

export function shouldPreloadImages(options: {
  position: "above-fold" | "below-fold";
  priority: "high" | "medium" | "low";
  size: "small" | "medium" | "large";
}): boolean {
  return options.position === "above-fold" && 
         (options.priority === "high" || options.size === "large");
}

export function validatePerformanceMetrics(metrics: any): metrics is PerformanceMetrics {
  return (
    typeof metrics === "object" &&
    metrics !== null &&
    typeof metrics.configId === "string" &&
    typeof metrics.timestamp === "object" &&
    (metrics.lcp === undefined || (typeof metrics.lcp === "number" && metrics.lcp >= 0)) &&
    (metrics.fid === undefined || (typeof metrics.fid === "number" && metrics.fid >= 0)) &&
    (metrics.cls === undefined || (typeof metrics.cls === "number" && metrics.cls >= 0))
  );
}

// Image utilities
export function optimizeImageUrl(url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpg" | "png";
}): string {
  // Only optimize Shopify CDN URLs
  if (!url.includes("cdn.shopify.com")) {
    return url;
  }

  const { width, height, quality, format } = options;
  let optimizedUrl = url;

  // Add width/height parameters
  if (width || height) {
    const dimensions = height ? `${width || ""}x${height}` : `${width}x`;
    optimizedUrl = url.replace(/(\.[^.]+)$/, `_${dimensions}$1`);
  }

  return optimizedUrl;
}

export function validateImageFormat(mimeType: string, customValidator?: (type: string) => boolean): boolean {
  if (customValidator) {
    return customValidator(mimeType);
  }

  const supportedFormats = [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/webp",
    "image/avif",
    "video/mp4",
    "video/webm",
    "video/quicktime"
  ];

  return supportedFormats.includes(mimeType.toLowerCase());
}

export function calculateAspectRatio(width: number, height: number): string {
  if (width === 0 || height === 0) {
    return width === 0 ? "0:1" : "1:0";
  }

  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  
  const ratioWidth = width / divisor;
  const ratioHeight = height / divisor;

  // Check for common aspect ratios
  const commonRatios: Record<string, string> = {
    "16:9": "16:9",
    "4:3": "4:3", 
    "1:1": "1:1",
    "4:5": "4:5",
    "9:16": "9:16",
    "3:4": "3:4"
  };

  const ratioKey = `${ratioWidth}:${ratioHeight}`;
  return commonRatios[ratioKey] || ratioKey;
}

// String utilities
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens
    .trim()
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function parseUrlParams(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  
  if (!queryString || queryString === "?") {
    return params;
  }
  
  const searchParams = new URLSearchParams(queryString.startsWith("?") ? queryString.slice(1) : queryString);
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = decodeURIComponent(value);
  }
  
  return params;
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeFilename(filename: string): string {
  if (!filename || filename.trim() === "" || filename === "." || filename === "..") {
    return "untitled";
  }

  // Remove or replace invalid characters
  let sanitized = filename
    .replace(/[<>:"/\\|?*]/g, "") // Remove invalid characters
    .replace(/[\x00-\x1f\x80-\x9f]/g, "") // Remove control characters
    .trim();

  // Handle Windows reserved names
  const reservedNames = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
  
  const nameWithoutExt = sanitized.split(".")[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    sanitized = `${sanitized}_file`;
  }

  return sanitized || "untitled";
}

// Async utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; delay: number }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === options.maxAttempts) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, options.delay * attempt));
    }
  }
  
  throw lastError!;
}

// Cache utilities  
export function generateCacheKey(prefix: string, data: any): string {
  const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
  
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `${prefix}:${Math.abs(hash).toString(36)}`;
}

// Shopify utilities
export function generateShopifyCheckoutUrl(
  shopDomain: string,
  items: Array<{ variantId: string; quantity: number }>
): string {
  const baseUrl = `https://${shopDomain}/cart`;
  
  if (items.length === 0) {
    return baseUrl;
  }
  
  const cartItems = items
    .map(item => `${item.variantId}:${item.quantity}`)
    .join(",");
    
  return `${baseUrl}/${cartItems}`;
}

export function extractProductIdFromHandle(handle: string): string | null {
  // Extract numeric ID from handle if present (e.g., "product-name-123" -> "123")
  const match = handle.match(/-(\d+)$/);
  return match ? match[1] : null;
}
