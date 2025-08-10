// Client-only exports for core package
// These are safe to bundle for the browser

export * from "./types";
export * from "./utils";
export * from "./env-validation";
export * from "./error-boundary";
export * from "./services/shopify-storefront";
export * from "./services/shopify-transformer";
export * from "./performance";
export * from "./rum";
export * from "./sentry";
export * from "./upload-stream";

// Re-export constants
export {
	VERSION,
	PACKAGE_NAME,
	PERFORMANCE_BUDGETS,
	CACHE_DURATIONS,
	DEFAULT_GRID_SIZES,
	SUPPORTED_IMAGE_FORMATS,
	MAX_FILE_SIZES,
	SHOPIFY_LIMITS,
} from "./index";
