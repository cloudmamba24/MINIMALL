import { UTMParameters } from "@minimall/core";
import { UTMUtils } from "../components/tracking/UTMTracker";

/**
 * Shopify Cart Attributes System
 *
 * Features:
 * - UTM attribution tracking
 * - Block-level revenue attribution
 * - A/B experiment tracking
 * - Session and device information
 * - Fallback to checkout URL parameters
 */

export interface CartAttributeData {
  configId: string;
  blockId?: string;
  layoutPreset?: string;
  experimentKey?: string;
  variantId?: string;
  productId: string;
  quantity: number;
  price: number; // in cents
}

export interface EnhancedCartAttributes {
  // Core identification
  minimall_config_id: string;
  minimall_session_id: string;
  minimall_block_id: string;

  // Product attribution
  minimall_product_id: string;
  minimall_variant_id: string;
  minimall_layout_preset: string;

  // A/B testing
  minimall_experiment_key: string;

  // UTM attribution
  minimall_utm_source: string;
  minimall_utm_medium: string;
  minimall_utm_campaign: string;
  minimall_utm_term: string;
  minimall_utm_content: string;

  // Session data
  minimall_device: string;
  minimall_referrer: string;
  minimall_timestamp: string;

  // Revenue data
  minimall_attributed_value: string; // in cents
  minimall_quantity: string;
}

/**
 * Generate cart attributes for Shopify Cart API
 */
export function generateCartAttributes(data: CartAttributeData): EnhancedCartAttributes {
  const utmData = UTMUtils.getUTMData(data.configId);
  const sessionData = UTMUtils.getSessionData(data.configId);

  return {
    // Core identification
    minimall_config_id: data.configId,
    minimall_session_id: sessionData?.sessionId || "",
    minimall_block_id: data.blockId || "",

    // Product attribution
    minimall_product_id: data.productId,
    minimall_variant_id: data.variantId || "",
    minimall_layout_preset: data.layoutPreset || "",

    // A/B testing
    minimall_experiment_key: data.experimentKey || "",

    // UTM attribution
    minimall_utm_source: utmData?.utm?.source || "",
    minimall_utm_medium: utmData?.utm?.medium || "",
    minimall_utm_campaign: utmData?.utm?.campaign || "",
    minimall_utm_term: utmData?.utm?.term || "",
    minimall_utm_content: utmData?.utm?.content || "",

    // Session data
    minimall_device: sessionData?.device || "unknown",
    minimall_referrer: sessionData?.referrer || "",
    minimall_timestamp: new Date().toISOString(),

    // Revenue data
    minimall_attributed_value: data.price.toString(),
    minimall_quantity: data.quantity.toString(),
  };
}

/**
 * Add item to Shopify Cart with attribution
 */
export async function addToCartWithAttribution(
  cartAttributeData: CartAttributeData,
  shopDomain: string,
  storefrontAccessToken: string
): Promise<{ success: boolean; cartUrl?: string; error?: string }> {
  try {
    const attributes = generateCartAttributes(cartAttributeData);

    // Try Shopify Storefront API first
    const storefrontResult = await addToCartViaStorefront(
      cartAttributeData,
      attributes,
      shopDomain,
      storefrontAccessToken
    );

    if (storefrontResult.success) {
      return storefrontResult;
    }

    // Fallback to checkout URL with parameters
    const checkoutUrl = generateCheckoutUrlWithAttributes(
      cartAttributeData,
      attributes,
      shopDomain
    );

    return {
      success: true,
      cartUrl: checkoutUrl,
    };
  } catch (error) {
    console.error("[Cart Attributes] Failed to add to cart:", error);

    // Final fallback - simple checkout URL
    const fallbackUrl = `https://${shopDomain}/cart/add?id=${cartAttributeData.variantId}&quantity=${cartAttributeData.quantity}`;

    return {
      success: false,
      cartUrl: fallbackUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add to cart via Shopify Storefront API
 */
async function addToCartViaStorefront(
  data: CartAttributeData,
  attributes: EnhancedCartAttributes,
  shopDomain: string,
  storefrontAccessToken: string
): Promise<{ success: boolean; cartUrl?: string; error?: string }> {
  const mutation = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          totalQuantity
          estimatedCost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lines: [
        {
          merchandiseId: `gid://shopify/ProductVariant/${data.variantId}`,
          quantity: data.quantity,
        },
      ],
      attributes: Object.entries(attributes).map(([key, value]) => ({
        key,
        value,
      })),
    },
  };

  try {
    const response = await fetch(`https://${shopDomain}/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const { cartCreate } = result.data;

    if (cartCreate.userErrors.length > 0) {
      throw new Error(`Cart creation errors: ${JSON.stringify(cartCreate.userErrors)}`);
    }

    return {
      success: true,
      cartUrl: cartCreate.cart.checkoutUrl,
    };
  } catch (error) {
    console.warn("[Cart Attributes] Storefront API failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Storefront API failed",
    };
  }
}

/**
 * Generate checkout URL with attribution as query parameters
 */
function generateCheckoutUrlWithAttributes(
  data: CartAttributeData,
  attributes: EnhancedCartAttributes,
  shopDomain: string
): string {
  const baseUrl = `https://${shopDomain}/cart/add`;
  const params = new URLSearchParams();

  // Core cart parameters
  params.set("id", data.variantId || "");
  params.set("quantity", data.quantity.toString());

  // Add all attributes as query parameters
  for (const [key, value] of Object.entries(attributes)) {
    if (value) {
      params.set(key, value);
    }
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Update existing cart with attribution data
 */
export async function updateCartWithAttribution(
  cartId: string,
  attributeData: CartAttributeData,
  shopDomain: string,
  storefrontAccessToken: string
): Promise<{ success: boolean; error?: string }> {
  const attributes = generateCartAttributes(attributeData);

  const mutation = `
    mutation cartAttributesUpdate($cartId: ID!, $attributes: [AttributeInput!]!) {
      cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
        cart {
          id
          attributes {
            key
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    cartId,
    attributes: Object.entries(attributes).map(([key, value]) => ({
      key,
      value,
    })),
  };

  try {
    const response = await fetch(`https://${shopDomain}/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const { cartAttributesUpdate } = result.data;

    if (cartAttributesUpdate.userErrors.length > 0) {
      throw new Error(
        `Attribute update errors: ${JSON.stringify(cartAttributesUpdate.userErrors)}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("[Cart Attributes] Update failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Track cart abandonment with attribution data
 */
export function trackCartAbandonment(configId: string, cartValue: number, items: unknown[]) {
  const attributes = UTMUtils.getCartAttributes(configId);

  // Send abandonment event to analytics
  UTMUtils.trackEvent(configId, "cart_abandon", {
    cart_value: cartValue,
    items_count: items.length,
    items: (
      items as {
        productId?: string;
        variantId?: string;
        quantity?: number;
        price?: number;
      }[]
    ).map((item) => ({
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      price: item.price,
    })),
    ...attributes,
  } as unknown as Record<string, string | number | boolean>);
}

/**
 * Utility to extract attribution from Shopify order webhook
 */
export function extractAttributionFromOrder(orderData: unknown): Partial<EnhancedCartAttributes> {
  const attributes: Record<string, unknown> = {};

  // Extract from note_attributes or line_item_properties
  const noteAttributes =
    (orderData as { note_attributes?: Array<{ name?: string; value?: string }> })
      ?.note_attributes || [];
  const lineItemProperties =
    (orderData as { line_items?: Array<{ properties?: Array<{ name?: string; value?: string }> }> })
      ?.line_items?.[0]?.properties || [];

  const allProperties = [...noteAttributes, ...lineItemProperties];

  for (const prop of allProperties as Array<{ name?: string; value?: string }>) {
    if (prop.name?.startsWith("minimall_")) {
      attributes[prop.name] = prop.value;
    }
  }

  return attributes as Partial<EnhancedCartAttributes>;
}

/**
 * Validate cart attribute data
 */
export function validateCartAttributes(data: CartAttributeData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.configId) {
    errors.push("configId is required");
  }

  if (!data.productId) {
    errors.push("productId is required");
  }

  if (!data.quantity || data.quantity <= 0) {
    errors.push("quantity must be greater than 0");
  }

  if (!data.price || data.price < 0) {
    errors.push("price must be non-negative");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Clean up cart attributes (remove empty values)
 */
export function cleanCartAttributes(
  attributes: Partial<EnhancedCartAttributes>
): Partial<EnhancedCartAttributes> {
  const cleaned: Partial<EnhancedCartAttributes> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value && value.trim() !== "") {
      cleaned[key as keyof EnhancedCartAttributes] = value;
    }
  }

  return cleaned;
}
