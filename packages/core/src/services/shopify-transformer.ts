/**
 * Shopify GraphQL Response Transformer
 *
 * Converts Shopify GraphQL responses to our internal type system.
 * Handles data normalization and type safety.
 */

import type {
  CartItem,
  MoneyV2,
  SelectedOption,
  ShopifyImage,
  ShopifyProduct,
  ShopifyVariant,
} from "../types";

/**
 * Transform GraphQL MoneyV2 to our MoneyV2 type
 */
export function transformMoney(graphqlMoney: { amount: string; currencyCode: string }): MoneyV2 {
  return {
    amount: graphqlMoney.amount,
    currencyCode: graphqlMoney.currencyCode,
  };
}

/**
 * Transform GraphQL Image to our ShopifyImage type
 */
export function transformImage(graphqlImage: {
  id: string;
  url: string;
  altText?: string | null;
  width: number;
  height: number;
}): ShopifyImage {
  return {
    id: graphqlImage.id,
    url: graphqlImage.url,
    altText: graphqlImage.altText || "",
    width: graphqlImage.width,
    height: graphqlImage.height,
  };
}

/**
 * Transform GraphQL SelectedOption to our SelectedOption type
 */
export function transformSelectedOption(graphqlOption: { name: string; value: string }): SelectedOption {
  return {
    name: graphqlOption.name,
    value: graphqlOption.value,
  };
}

/**
 * Transform GraphQL ProductVariant to our ShopifyVariant type
 */
export function transformVariant(graphqlVariant: {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  availableForSale: boolean;
  selectedOptions?: Array<{ name: string; value: string }>;
  requiresShipping: boolean;
  compareAtPrice?: { amount: string; currencyCode: string } | null;
  image?: { id: string; url: string; altText?: string | null; width: number; height: number } | null;
  sku?: string | null;
  barcode?: string | null;
  weight?: number | null;
  weightUnit?: string | null;
}): ShopifyVariant {
  const variant: ShopifyVariant = {
    id: extractId(graphqlVariant.id),
    title: graphqlVariant.title,
    price: transformMoney(graphqlVariant.price),
    availableForSale: graphqlVariant.availableForSale,
    selectedOptions: graphqlVariant.selectedOptions?.map(transformSelectedOption) || [],
    requiresShipping: graphqlVariant.requiresShipping,
  };

  // Handle optional properties
  if (graphqlVariant.compareAtPrice) {
    variant.compareAtPrice = transformMoney(graphqlVariant.compareAtPrice);
  }

  if (graphqlVariant.image) {
    variant.image = transformImage(graphqlVariant.image);
  }

  if (graphqlVariant.sku) {
    variant.sku = graphqlVariant.sku;
  }

  if (graphqlVariant.barcode) {
    variant.barcode = graphqlVariant.barcode;
  }

  if (graphqlVariant.weight) {
    variant.weight = graphqlVariant.weight;
  }

  if (graphqlVariant.weightUnit) {
    variant.weightUnit = graphqlVariant.weightUnit;
  }

  return variant;
}

/**
 * Transform GraphQL Product to our ShopifyProduct type
 */
export function transformProduct(graphqlProduct: {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  images?: { nodes?: Array<{ id: string; url: string; altText?: string | null; width: number; height: number }> };
  variants?: { nodes?: Array<unknown> };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string }; maxVariantPrice: { amount: string; currencyCode: string } };
  tags?: string[];
  productType?: string;
  vendor?: string;
  availableForSale: boolean;
  createdAt: string;
  updatedAt: string;
}): ShopifyProduct {
  return {
    id: extractId(graphqlProduct.id),
    title: graphqlProduct.title,
    handle: graphqlProduct.handle,
    description: graphqlProduct.description || "",
    images: (graphqlProduct.images?.nodes as unknown[] | undefined)?.map((n) =>
      transformImage(n as {
        id: string;
        url: string;
        altText?: string | null;
        width: number;
        height: number;
      }),
    ) || [],
    variants: (graphqlProduct.variants?.nodes as unknown[] | undefined)?.map((n) =>
      transformVariant(n as {
        id: string;
        title: string;
        price: { amount: string; currencyCode: string };
        availableForSale: boolean;
        selectedOptions?: Array<{ name: string; value: string }>;
        requiresShipping: boolean;
        compareAtPrice?: { amount: string; currencyCode: string } | null;
        image?: { id: string; url: string; altText?: string | null; width: number; height: number } | null;
        sku?: string | null;
        barcode?: string | null;
        weight?: number | null;
        weightUnit?: string | null;
      }),
    ) || [],
    priceRange: {
      minVariantPrice: transformMoney(graphqlProduct.priceRange.minVariantPrice),
      maxVariantPrice: transformMoney(graphqlProduct.priceRange.maxVariantPrice),
    },
    tags: graphqlProduct.tags || [],
    productType: graphqlProduct.productType || "",
    vendor: graphqlProduct.vendor || "",
    availableForSale: graphqlProduct.availableForSale,
    createdAt: graphqlProduct.createdAt,
    updatedAt: graphqlProduct.updatedAt,
  };
}

/**
 * Transform Shopify cart line to our CartItem type
 */
export function transformCartLine(graphqlLine: {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    image?: { url: string } | null;
    product: { id: string; title: string };
    selectedOptions?: Array<{ name: string; value: string }>;
  };
}): CartItem {
  const variant = graphqlLine.merchandise;
  const product = variant.product;

  return {
    id: extractId(graphqlLine.id),
    productId: extractId(product.id),
    variantId: extractId(variant.id),
    title: product.title,
    price: Math.round(Number.parseFloat(variant.price.amount) * 100), // Convert to cents
    quantity: graphqlLine.quantity,
    image: variant.image?.url,
    variant: {
      title: variant.title,
      selectedOptions: variant.selectedOptions?.map(transformSelectedOption) || [],
    },
  };
}

/**
 * Extract numeric ID from Shopify GraphQL global ID
 * Example: "gid://shopify/Product/123" -> "123"
 */
export function extractId(globalId: string): string {
  if (!globalId) return "";
  const parts = globalId.split("/");
  return parts[parts.length - 1] || "";
}

/**
 * Convert numeric ID to Shopify GraphQL global ID
 * Example: "123" -> "gid://shopify/Product/123"
 */
export function toGlobalId(type: string, id: string): string {
  return `gid://shopify/${type}/${id}`;
}

/**
 * Format price for display
 */
export function formatShopifyPrice(
  amount: string | number,
  currencyCode = "USD",
  locale = "en-US"
): string {
  const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(numericAmount);
}

/**
 * Convert cents to dollar amount for display
 */
export function centsToDisplay(cents: number, currencyCode = "USD"): string {
  return formatShopifyPrice(cents / 100, currencyCode);
}

/**
 * Convert Shopify image URL to optimized version
 */
export function optimizeShopifyImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    crop?: "top" | "center" | "bottom" | "left" | "right";
    scale?: number;
  } = {}
): string {
  if (!url) return "";

  // Remove existing size parameters
  const baseUrl = url.split("?")[0] || url;
  const params = new URLSearchParams();

  if (options.width) params.set("width", options.width.toString());
  if (options.height) params.set("height", options.height.toString());
  if (options.crop) params.set("crop", options.crop);
  if (options.scale) params.set("scale", options.scale.toString());

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Get variant by selected options
 */
export function findVariantByOptions(
  product: ShopifyProduct,
  selectedOptions: { [optionName: string]: string }
): ShopifyVariant | undefined {
  return product.variants.find((variant) => {
    return variant.selectedOptions.every((option) => selectedOptions[option.name] === option.value);
  });
}

/**
 * Get all option values for a specific option name
 */
export function getOptionValues(product: ShopifyProduct, optionName: string): string[] {
  const values = new Set<string>();

  product.variants.forEach((variant) => {
    const option = variant.selectedOptions.find((opt) => opt.name === optionName);
    if (option) {
      values.add(option.value);
    }
  });

  return Array.from(values);
}

/**
 * Check if product has multiple variants
 */
export function hasMultipleVariants(product: ShopifyProduct): boolean {
  return product.variants.length > 1;
}

/**
 * Get cheapest variant
 */
export function getCheapestVariant(product: ShopifyProduct): ShopifyVariant | undefined {
  return product.variants
    .filter((variant) => variant.availableForSale)
    .sort((a, b) => Number.parseFloat(a.price.amount) - Number.parseFloat(b.price.amount))[0];
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(
  originalPrice: string | number,
  salePrice: string | number
): number {
  const original =
    typeof originalPrice === "string" ? Number.parseFloat(originalPrice) : originalPrice;
  const sale = typeof salePrice === "string" ? Number.parseFloat(salePrice) : salePrice;

  if (original <= sale) return 0;

  return Math.round(((original - sale) / original) * 100);
}
