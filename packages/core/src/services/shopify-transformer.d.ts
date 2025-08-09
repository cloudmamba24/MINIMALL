/**
 * Shopify GraphQL Response Transformer
 *
 * Converts Shopify GraphQL responses to our internal type system.
 * Handles data normalization and type safety.
 */
import type { CartItem, MoneyV2, SelectedOption, ShopifyImage, ShopifyProduct, ShopifyVariant } from "../types";
/**
 * Transform GraphQL MoneyV2 to our MoneyV2 type
 */
export declare function transformMoney(graphqlMoney: any): MoneyV2;
/**
 * Transform GraphQL Image to our ShopifyImage type
 */
export declare function transformImage(graphqlImage: any): ShopifyImage;
/**
 * Transform GraphQL SelectedOption to our SelectedOption type
 */
export declare function transformSelectedOption(graphqlOption: any): SelectedOption;
/**
 * Transform GraphQL ProductVariant to our ShopifyVariant type
 */
export declare function transformVariant(graphqlVariant: any): ShopifyVariant;
/**
 * Transform GraphQL Product to our ShopifyProduct type
 */
export declare function transformProduct(graphqlProduct: any): ShopifyProduct;
/**
 * Transform Shopify cart line to our CartItem type
 */
export declare function transformCartLine(graphqlLine: any): CartItem;
/**
 * Extract numeric ID from Shopify GraphQL global ID
 * Example: "gid://shopify/Product/123" -> "123"
 */
export declare function extractId(globalId: string): string;
/**
 * Convert numeric ID to Shopify GraphQL global ID
 * Example: "123" -> "gid://shopify/Product/123"
 */
export declare function toGlobalId(type: string, id: string): string;
/**
 * Format price for display
 */
export declare function formatShopifyPrice(amount: string | number, currencyCode?: string, locale?: string): string;
/**
 * Convert cents to dollar amount for display
 */
export declare function centsToDisplay(cents: number, currencyCode?: string): string;
/**
 * Convert Shopify image URL to optimized version
 */
export declare function optimizeShopifyImageUrl(url: string, options?: {
    width?: number;
    height?: number;
    crop?: "top" | "center" | "bottom" | "left" | "right";
    scale?: number;
}): string;
/**
 * Get variant by selected options
 */
export declare function findVariantByOptions(product: ShopifyProduct, selectedOptions: {
    [optionName: string]: string;
}): ShopifyVariant | undefined;
/**
 * Get all option values for a specific option name
 */
export declare function getOptionValues(product: ShopifyProduct, optionName: string): string[];
/**
 * Check if product has multiple variants
 */
export declare function hasMultipleVariants(product: ShopifyProduct): boolean;
/**
 * Get cheapest variant
 */
export declare function getCheapestVariant(product: ShopifyProduct): ShopifyVariant | undefined;
/**
 * Calculate discount percentage
 */
export declare function calculateDiscountPercentage(originalPrice: string | number, salePrice: string | number): number;
//# sourceMappingURL=shopify-transformer.d.ts.map