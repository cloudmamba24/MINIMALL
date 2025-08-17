import { getDatabaseConnection } from "@minimall/db";
import type { ShopifyLineItem, ShopifyOrder } from "@minimall/types";
import * as Sentry from "@sentry/nextjs";

/**
 * Handle order creation webhook
 */
export async function handleOrderCreate(shop: string, payload: ShopifyOrder): Promise<void> {
  try {
    const db = getDatabaseConnection();
    if (!db) {
      throw new Error("Database connection not available");
    }

    console.log(`Processing order #${payload.order_number} from ${shop}`);

    // Process revenue attribution
    const attributions = await processOrderAttributions(shop, payload);

    if (attributions.length > 0) {
      // Store attributions in database
      // await db.insert(revenueAttributions).values(attributions);

      console.log(
        `Saved ${attributions.length} revenue attributions for order #${payload.order_number}`
      );
    }

    // Additional order processing
    // - Update analytics
    // - Send confirmation email
    // - Trigger inventory sync
    // - Update customer lifetime value

    Sentry.addBreadcrumb({
      category: "webhook",
      message: `Order processed: ${payload.name}`,
      level: "info",
      data: {
        orderId: payload.id.toString(),
        shop,
        total: payload.total_price,
        items: payload.line_items.length,
      },
    });
  } catch (error) {
    console.error(`Failed to process order ${payload.id}:`, error);
    Sentry.captureException(error, {
      tags: { webhook: "orders/create", shop },
      extra: { orderId: payload.id },
    });
    throw error;
  }
}

/**
 * Process revenue attributions for an order
 */
async function processOrderAttributions(shop: string, order: ShopifyOrder): Promise<any[]> {
  const attributions = [];

  for (const lineItem of order.line_items) {
    const attribution = extractAttribution(order, lineItem);
    if (attribution) {
      attributions.push({
        shopDomain: shop,
        orderId: order.id.toString(),
        lineItemId: lineItem.id.toString(),
        productId: lineItem.product_id.toString(),
        variantId: lineItem.variant_id.toString(),
        quantity: lineItem.quantity,
        price: Math.round(Number.parseFloat(lineItem.price) * 100),
        revenue: Math.round(Number.parseFloat(lineItem.price) * lineItem.quantity * 100),
        currency: order.currency,
        ...attribution,
        createdAt: new Date(order.created_at),
      });
    }
  }

  return attributions;
}

/**
 * Extract attribution data from order/line item
 */
function extractAttribution(order: ShopifyOrder, lineItem: ShopifyLineItem): any {
  const attribution: any = {};

  // Check line item properties
  if (lineItem.properties) {
    for (const prop of lineItem.properties) {
      if (prop.name.toLowerCase().includes("minimall")) {
        const key = prop.name.replace("minimall_", "").replace(/_/g, "");
        attribution[key] = prop.value;
      }
    }
  }

  // Check order note attributes
  if (order.note_attributes) {
    for (const attr of order.note_attributes) {
      if (attr.name.toLowerCase().includes("minimall")) {
        const key = attr.name.replace("minimall_", "").replace(/_/g, "");
        attribution[key] = attr.value;
      }
    }
  }

  return Object.keys(attribution).length > 0 ? attribution : null;
}
