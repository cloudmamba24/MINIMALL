import crypto from "node:crypto";
import { db, revenueAttributions, shops } from "@minimall/db";
import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Shopify Order Creation Webhook Handler
 *
 * This endpoint processes Shopify order webhooks to attribute revenue
 * back to specific MINIMALL configurations and UTM sources.
 */

interface ShopifyOrder {
  id: number;
  email: string;
  total_price: string;
  currency: string;
  line_items: ShopifyLineItem[];
  note_attributes?: Array<{
    name: string;
    value: string;
  }>;
  customer?: {
    id: number;
    email: string;
  };
  created_at: string;
  order_number: number;
  name: string;
}

interface ShopifyLineItem {
  id: number;
  variant_id: number;
  product_id: number;
  title: string;
  quantity: number;
  price: string;
  sku?: string;
  properties?: Array<{
    name: string;
    value: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity
    const body = await request.text();
    const shopifyHmac = request.headers.get("X-Shopify-Hmac-Sha256");
    const shopifyDomain = request.headers.get("X-Shopify-Shop-Domain");

    if (!shopifyDomain) {
      console.error("Missing Shopify shop domain in webhook");
      return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
    }

    // Verify HMAC signature
    if (!verifyShopifyWebhook(body, shopifyHmac)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const order: ShopifyOrder = JSON.parse(body);

    console.log(`Processing order webhook for order #${order.order_number} from ${shopifyDomain}`);

    // Process each line item for revenue attribution
    const attributions = [];

    for (const lineItem of order.line_items) {
      try {
        const attribution = await processLineItemAttribution(order, lineItem, shopifyDomain);

        if (attribution) {
          attributions.push(attribution);
        }
      } catch (lineItemError) {
        console.error(`Failed to process line item ${lineItem.id}:`, lineItemError);
        Sentry.captureException(lineItemError);
        // Continue processing other line items
      }
    }

    // Save revenue attributions to database
    if (attributions.length > 0 && db) {
      try {
        await db.insert(revenueAttributions).values(attributions);
        console.log(
          `Saved ${attributions.length} revenue attributions for order #${order.order_number}`
        );
      } catch (dbError) {
        console.error("Failed to save revenue attributions:", dbError);
        Sentry.captureException(dbError);
        // Don't fail the webhook - we logged the data
      }
    }

    // Log successful processing
    Sentry.addBreadcrumb({
      category: "revenue-attribution",
      message: `Processed order: ${order.name}`,
      data: {
        orderId: order.id.toString(),
        shopDomain: shopifyDomain,
        totalPrice: order.total_price,
        currency: order.currency,
        lineItemsCount: order.line_items.length,
        attributionsCount: attributions.length,
      },
      level: "info",
    });

    return NextResponse.json({
      success: true,
      message: "Order processed successfully",
      data: {
        orderId: order.id,
        attributionsProcessed: attributions.length,
      },
    });
  } catch (error) {
    console.error("Order webhook processing failed:", error);
    Sentry.captureException(error);

    return NextResponse.json({ error: "Failed to process order webhook" }, { status: 500 });
  }
}

/**
 * Process a single line item for revenue attribution
 */
async function processLineItemAttribution(
  order: ShopifyOrder,
  lineItem: ShopifyLineItem,
  shopDomain: string
): Promise<{
  orderId: string;
  lineItemId: string;
  shopDomain: string;
  configId: string;
  blockId: string;
  layoutPreset: string;
  experimentKey: string | null;
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  revenue: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  sessionId: string;
  device: string;
  timestamp: Date;
} | null> {
  // Extract attribution data from line item properties or order note attributes
  const attributionData = extractAttributionData(order, lineItem);

  if (!attributionData.configId || !attributionData.blockId) {
    // No attribution data found - this is normal for non-MINIMALL orders
    return null;
  }

  // Calculate revenue in cents
  const price = Math.round(Number.parseFloat(lineItem.price) * 100);
  const revenue = price * lineItem.quantity;

  return {
    orderId: order.id.toString(),
    lineItemId: lineItem.id.toString(),
    shopDomain,
    configId: attributionData.configId,
    blockId: attributionData.blockId,
    layoutPreset: attributionData.layoutPreset || "unknown",
    experimentKey: attributionData.experimentKey || null,
    productId: lineItem.product_id.toString(),
    variantId: lineItem.variant_id.toString(),
    quantity: lineItem.quantity,
    price,
    revenue,
    // UTM data
    utmSource: attributionData.utm?.source || null,
    utmMedium: attributionData.utm?.medium || null,
    utmCampaign: attributionData.utm?.campaign || null,
    utmTerm: attributionData.utm?.term || null,
    utmContent: attributionData.utm?.content || null,
    sessionId: attributionData.sessionId || "unknown",
    device: attributionData.device || "unknown",
    timestamp: new Date(order.created_at),
  };
}

/**
 * Extract attribution data from order note attributes or line item properties
 */
function extractAttributionData(order: ShopifyOrder, lineItem: ShopifyLineItem) {
  const attributionData: {
    configId?: string;
    blockId?: string;
    layoutPreset?: string;
    experimentKey?: string;
    sessionId?: string;
    device?: string;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
  } = {
    utm: {},
  };

  // Check line item properties first (most specific)
  if (lineItem.properties) {
    for (const prop of lineItem.properties) {
      mapAttributionProperty(prop.name, prop.value, attributionData);
    }
  }

  // Check order note attributes (fallback)
  if (order.note_attributes) {
    for (const attr of order.note_attributes) {
      mapAttributionProperty(attr.name, attr.value, attributionData);
    }
  }

  return attributionData;
}

/**
 * Map property names to attribution data structure
 */
function mapAttributionProperty(
  name: string,
  value: string,
  data: {
    configId?: string;
    blockId?: string;
    layoutPreset?: string;
    experimentKey?: string;
    sessionId?: string;
    device?: string;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
  }
) {
  const lowerName = name.toLowerCase();

  if (lowerName === "minimall_config_id") {
    data.configId = value;
  } else if (lowerName === "minimall_block_id") {
    data.blockId = value;
  } else if (lowerName === "minimall_layout_preset") {
    data.layoutPreset = value;
  } else if (lowerName === "minimall_experiment_key") {
    data.experimentKey = value;
  } else if (lowerName === "minimall_session_id") {
    data.sessionId = value;
  } else if (lowerName === "minimall_device") {
    data.device = value;
  } else if (lowerName === "minimall_utm_source") {
    if (!data.utm) data.utm = {};
    data.utm.source = value;
  } else if (lowerName === "minimall_utm_medium") {
    if (!data.utm) data.utm = {};
    data.utm.medium = value;
  } else if (lowerName === "minimall_utm_campaign") {
    if (!data.utm) data.utm = {};
    data.utm.campaign = value;
  } else if (lowerName === "minimall_utm_term") {
    if (!data.utm) data.utm = {};
    data.utm.term = value;
  } else if (lowerName === "minimall_utm_content") {
    if (!data.utm) data.utm = {};
    data.utm.content = value;
  }
}

/**
 * Verify Shopify webhook HMAC signature
 */
function verifyShopifyWebhook(body: string, receivedHmac: string | null): boolean {
  if (!receivedHmac) {
    return false;
  }

  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("SHOPIFY_WEBHOOK_SECRET not configured - skipping signature verification");
    return true; // Allow in development
  }

  const hmac = crypto.createHmac("sha256", webhookSecret);
  hmac.update(body, "utf8");
  const computedHmac = hmac.digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(receivedHmac, "base64"),
    Buffer.from(computedHmac, "base64")
  );
}
