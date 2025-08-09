export * from "./types";
export * from "./utils";
export { getOptionValues, findVariantByOptions, calculateDiscountPercentage, transformProduct, optimizeShopifyImageUrl, formatShopifyPrice, centsToDisplay, } from "./services/shopify-transformer";
export * from "./r2";
export * from "./services/shopify-storefront";
export * from "./services/shopify-transformer";
export * from "./performance";
export * from "./rum";
export * from "./sentry";
export declare const VERSION = "0.1.0";
export declare const PACKAGE_NAME = "@minimall/core";
export declare const PERFORMANCE_BUDGETS: {
    readonly LCP: 1500;
    readonly FID: 120;
    readonly CLS: 0.1;
    readonly JS_BUNDLE_SIZE: number;
    readonly TTFB: 200;
};
export declare const CACHE_DURATIONS: {
    readonly CONFIG: 300;
    readonly PRODUCTS: 300;
    readonly IMAGES: 86400;
    readonly STATIC_ASSETS: 31536000;
};
export declare const DEFAULT_GRID_SIZES: {
    readonly INSTAGRAM: 3;
    readonly SHOP: 2;
    readonly LOOKBOOK: 1;
};
export declare const SUPPORTED_IMAGE_FORMATS: readonly ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"];
export declare const MAX_FILE_SIZES: {
    readonly IMAGE: number;
    readonly VIDEO: number;
};
export declare const SHOPIFY_LIMITS: {
    readonly VARIANTS_PER_PRODUCT: 100;
    readonly PRODUCTS_PER_PAGE: 250;
    readonly CHECKOUT_LINE_ITEMS: 250;
};
//# sourceMappingURL=index.d.ts.map