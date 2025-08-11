import { UTMUtils } from "../components/tracking/UTMTracker";
import { createAttributionData } from "./type-utils";

/**
 * Cart Attribution System
 *
 * This module handles adding MINIMALL attribution data to Shopify cart
 * operations, ensuring revenue can be tracked back to specific configs,
 * blocks, experiments, and UTM sources.
 */

export interface CartAttributionData {
  configId: string;
  blockId: string;
  layoutPreset?: string;
  experimentKey?: string;
  categoryId?: string;
  itemId?: string;
}

/**
 * Enhanced cart attributes with full attribution chain
 */
export function buildCartAttributes(
  attributionData: CartAttributionData,
  additionalAttributes: Record<string, string> = {}
): Record<string, string> {
  const attributes: Record<string, string> = {};

  // Core MINIMALL attribution
  attributes["minimall_config_id"] = attributionData.configId;
  attributes["minimall_block_id"] = attributionData.blockId;

  if (attributionData.layoutPreset) {
    attributes["minimall_layout_preset"] = attributionData.layoutPreset;
  }

  if (attributionData.experimentKey) {
    attributes["minimall_experiment_key"] = attributionData.experimentKey;
  }

  if (attributionData.categoryId) {
    attributes["minimall_category_id"] = attributionData.categoryId;
  }

  if (attributionData.itemId) {
    attributes["minimall_item_id"] = attributionData.itemId;
  }

  // UTM attribution from stored data
  const utmData = UTMUtils.getUTMData(attributionData.configId);
  if (utmData?.utm) {
    if (utmData.utm.source) attributes["minimall_utm_source"] = utmData.utm.source;
    if (utmData.utm.medium) attributes["minimall_utm_medium"] = utmData.utm.medium;
    if (utmData.utm.campaign) attributes["minimall_utm_campaign"] = utmData.utm.campaign;
    if (utmData.utm.term) attributes["minimall_utm_term"] = utmData.utm.term;
    if (utmData.utm.content) attributes["minimall_utm_content"] = utmData.utm.content;
  }

  // Session and device data
  const sessionData = UTMUtils.getSessionData(attributionData.configId);
  if (sessionData) {
    attributes["minimall_session_id"] = sessionData.sessionId;
    attributes["minimall_device"] = sessionData.device;

    if (sessionData.referrer) {
      attributes["minimall_referrer"] = sessionData.referrer;
    }
  }

  // Timestamp for tracking
  attributes["minimall_attributed_at"] = new Date().toISOString();

  // Add any additional attributes
  Object.assign(attributes, additionalAttributes);

  return attributes;
}

/**
 * Add MINIMALL attribution to Shopify cart via Storefront API
 */
export async function addToCartWithAttribution(
  variantId: string,
  quantity: number,
  attributionData: CartAttributionData,
  shopifyStorefrontToken: string,
  shopDomain: string,
  additionalProperties: Array<{ key: string; value: string }> = []
): Promise<{ success: boolean; cartId?: string; error?: string }> {
  try {
    const cartAttributes = buildCartAttributes(attributionData);

    // Convert attributes to line item properties format
    const properties = [
      ...additionalProperties,
      ...Object.entries(cartAttributes).map(([key, value]) => ({
        key,
        value,
      })),
    ];

    // Create cart with attribution via Storefront API
    const cartCreateMutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
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
            merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
            quantity,
            attributes: properties,
          },
        ],
        attributes: Object.entries(cartAttributes).map(([key, value]) => ({
          key,
          value,
        })),
      },
    };

    const response = await fetch(`https://${shopDomain}/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": shopifyStorefrontToken,
      },
      body: JSON.stringify({
        query: cartCreateMutation,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Storefront API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const { cartCreate } = result.data;

    if (cartCreate.userErrors?.length > 0) {
      throw new Error(`Cart creation errors: ${JSON.stringify(cartCreate.userErrors)}`);
    }

    return {
      success: true,
      cartId: cartCreate.cart.id,
    };
  } catch (error) {
    console.error("Failed to add to cart with attribution:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Build checkout URL with attribution parameters (fallback method)
 */
export function buildAttributedCheckoutUrl(
  baseCheckoutUrl: string,
  variantId: string,
  quantity: number,
  attributionData: CartAttributionData
): string {
  const url = new URL(baseCheckoutUrl);

  // Add variant and quantity
  url.searchParams.set(variantId, quantity.toString());

  // Add attribution as URL parameters (will be available to checkout scripts)
  const attributes = buildCartAttributes(attributionData);

  Object.entries(attributes).forEach(([key, value]) => {
    url.searchParams.set(`attributes[${key}]`, value);
  });

  return url.toString();
}

/**
 * Track attribution events for analytics
 */
export function trackAttributionEvent(
  event: "add_to_cart" | "begin_checkout" | "checkout_url_generated",
  attributionData: CartAttributionData,
  additionalData: Record<string, any> = {}
) {
  // Dispatch analytics event with full attribution context
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", event, {
      config_id: attributionData.configId,
      block_id: attributionData.blockId,
      layout_preset: attributionData.layoutPreset,
      experiment_key: attributionData.experimentKey,
      ...additionalData,
    });
  }

  // Also track with our pixel dispatcher if available
  if (typeof window !== "undefined" && (window as any).minimallPixels) {
    (window as any).minimallPixels.dispatch(event, {
      configId: attributionData.configId,
      blockId: attributionData.blockId,
      layoutPreset: attributionData.layoutPreset,
      experimentKey: attributionData.experimentKey,
      ...additionalData,
    });
  }
}

/**
 * Utility to extract attribution from current page context
 */
export function getPageAttribution(
  configId: string,
  categoryId?: string,
  itemId?: string
): Partial<CartAttributionData> {
  // This would typically be passed down from the component context
  // or extracted from URL parameters in a real implementation

  return createAttributionData({ configId, categoryId, itemId });
}

/**
 * Debug utility to log attribution data
 */
export function debugAttribution(attributionData: CartAttributionData) {
  if (process.env.NODE_ENV === "development") {
    console.group("🛒 Cart Attribution Debug");
    console.log("Attribution Data:", attributionData);
    console.log("Cart Attributes:", buildCartAttributes(attributionData));

    const utmData = UTMUtils.getUTMData(attributionData.configId);
    console.log("UTM Data:", utmData);

    const sessionData = UTMUtils.getSessionData(attributionData.configId);
    console.log("Session Data:", sessionData);

    console.groupEnd();
  }
}
