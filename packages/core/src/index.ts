// Export all types
export * from "./types";

// Export all utilities
export * from "./utils";

// Export additional Shopify utilities from transformer
export {
	getOptionValues,
	findVariantByOptions,
	calculateDiscountPercentage,
	transformProduct,
	optimizeShopifyImageUrl,
	formatShopifyPrice,
	centsToDisplay,
} from "./services/shopify-transformer";

// Export R2 service
export * from "./r2";

// Export authentication
export * from "./auth/shopify-auth";

// Export Shopify services
export * from "./services/shopify-storefront";
export * from "./services/shopify-transformer";

// Export performance and analytics
export * from "./performance";
export * from "./rum";

// Export Sentry configuration utilities
export * from "./sentry";

// Version info
export const VERSION = "0.1.0";
export const PACKAGE_NAME = "@minimall/core";

// Constants
export const PERFORMANCE_BUDGETS = {
	LCP: 1500, // 1.5 seconds
	FID: 120, // 120 milliseconds
	CLS: 0.1, // 0.1 cumulative layout shift
	JS_BUNDLE_SIZE: 120 * 1024, // 120KB
	TTFB: 200, // 200 milliseconds
} as const;

export const CACHE_DURATIONS = {
	CONFIG: 300, // 5 minutes
	PRODUCTS: 300, // 5 minutes
	IMAGES: 86400, // 24 hours
	STATIC_ASSETS: 31536000, // 1 year
} as const;

export const DEFAULT_GRID_SIZES = {
	INSTAGRAM: 3,
	SHOP: 2,
	LOOKBOOK: 1,
} as const;

export const SUPPORTED_IMAGE_FORMATS = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/avif",
	"image/svg+xml",
] as const;

export const MAX_FILE_SIZES = {
	IMAGE: 5 * 1024 * 1024, // 5MB
	VIDEO: 50 * 1024 * 1024, // 50MB
} as const;

export const SHOPIFY_LIMITS = {
	VARIANTS_PER_PRODUCT: 100,
	PRODUCTS_PER_PAGE: 250,
	CHECKOUT_LINE_ITEMS: 250,
} as const;
