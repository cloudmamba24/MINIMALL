/**
 * Shopify Storefront API Service
 *
 * Handles all customer-facing operations: product fetching, cart management, checkout.
 * Uses GraphQL for efficient data fetching with proper error handling and caching.
 */
interface ShopifyStorefrontConfig {
    domain: string;
    accessToken: string;
}
export declare class ShopifyStorefrontService {
    private domain;
    private accessToken;
    private endpoint;
    constructor(config: ShopifyStorefrontConfig);
    /**
     * Execute GraphQL query with error handling and retries
     */
    private query;
    /**
     * Get products by IDs
     */
    getProducts(productIds: string[], first?: number): Promise<any[]>;
    /**
     * Get single product by handle or ID
     */
    getProduct(identifier: string, isId?: boolean): Promise<any>;
    /**
     * Search products
     */
    searchProducts(query: string, first?: number, after?: string): Promise<{
        products: any[];
        hasNextPage: boolean;
        endCursor?: string;
    }>;
    /**
     * Get products from a collection
     */
    getCollectionProducts(handle: string, first?: number, after?: string): Promise<{
        products: any[];
        hasNextPage: boolean;
        endCursor?: string;
    }>;
    /**
     * Create a cart
     */
    createCart(lines?: Array<{
        merchandiseId: string;
        quantity: number;
    }>): Promise<any>;
    /**
     * Add items to cart
     */
    addToCart(cartId: string, lines: Array<{
        merchandiseId: string;
        quantity: number;
    }>): Promise<any>;
    /**
     * Update cart line quantities
     */
    updateCart(cartId: string, lines: Array<{
        id: string;
        quantity: number;
    }>): Promise<any>;
    /**
     * Remove lines from cart
     */
    removeFromCart(cartId: string, lineIds: string[]): Promise<any>;
    /**
     * Get cart by ID
     */
    getCart(cartId: string): Promise<any>;
}
/**
 * Factory function to create Shopify service instance
 */
export declare function createShopifyStorefrontService(domain: string, accessToken: string): ShopifyStorefrontService;
export {};
//# sourceMappingURL=shopify-storefront.d.ts.map