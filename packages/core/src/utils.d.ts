import type { CartItem, Category, PerformanceMetrics, ShopifyProduct, SiteConfig } from "./types";
export declare function validateSiteConfig(config: unknown): config is SiteConfig;
export declare function generateConfigId(): string;
/**
 * Create enhanced site config with real Shopify data
 */
export declare function createEnhancedSiteConfig(shopDomain: string, accessToken?: string): Promise<SiteConfig>;
/**
 * Legacy synchronous function for backward compatibility
 */
export declare function createDefaultSiteConfig(shopDomain: string): SiteConfig;
export declare function findCategoryById(categories: Category[], id: string): Category | null;
export declare function flattenCategories(categories: Category[]): Category[];
export declare function reorderCategories(categories: Category[], fromIndex: number, toIndex: number): Category[];
export declare function calculateCartTotal(items: CartItem[]): number;
export declare function formatPrice(amount: number, currencyCode?: string): string;
export declare function generateCartId(): string;
export declare function addToCart(currentItems: CartItem[], product: ShopifyProduct, variantId: string, quantity?: number): CartItem[];
export declare function removeFromCart(currentItems: CartItem[], itemId: string): CartItem[];
export declare function updateCartItemQuantity(currentItems: CartItem[], itemId: string, quantity: number): CartItem[];
export declare function buildCheckoutUrl(shopDomain: string, items: CartItem[]): string;
export declare function extractShopFromDomain(domain: string): string;
export declare function buildStorefrontUrl(shopDomain: string): string;
export declare function measureLCP(): Promise<number>;
export declare function measureFID(): Promise<number>;
export declare function createPerformanceMetrics(configId: string): Partial<PerformanceMetrics>;
export declare function buildSiteUrl(baseUrl: string, configId: string, draft?: string): string;
export declare function buildProductUrl(baseUrl: string, configId: string, productId: string): string;
export declare function optimizeImageUrl(url: string, width?: number, height?: number): string;
export declare function generateImageSrcSet(url: string, sizes: number[]): string;
export declare function isValidHexColor(color: string): boolean;
export declare function isValidUrl(url: string): boolean;
export declare function sanitizeHtml(html: string): string;
export declare function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void;
export declare function deepClone<T>(obj: T): T;
export declare function safeLocalStorageGet<T>(key: string, fallback: T): T;
export declare function safeLocalStorageSet<T>(key: string, value: T): boolean;
//# sourceMappingURL=utils.d.ts.map