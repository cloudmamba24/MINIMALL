import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { getWebhookHandler } from "../../../../../lib/webhook-handler";

// Force Node.js runtime for crypto operations
export const runtime = "nodejs";

// POST /api/webhooks/customers/data_request - Handle GDPR customer data request webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-shopify-hmac-sha256");
    const topic = request.headers.get("x-shopify-topic");
    const shop = request.headers.get("x-shopify-shop-domain");

    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
    }

    if (!shop) {
      return NextResponse.json({ error: "Missing shop domain" }, { status: 400 });
    }

    if (topic !== "customers/data_request") {
      return NextResponse.json({ error: "Invalid webhook topic" }, { status: 400 });
    }

    const webhookHandler = getWebhookHandler();

    // Verify webhook signature
    if (!webhookHandler.verifySignature(body, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    // Parse payload
    const payload = JSON.parse(body);

    // Process GDPR data request webhook
    await webhookHandler.processWebhook(topic, shop, payload, body);

    // GDPR data requests must be handled within 30 days
    Sentry.addBreadcrumb({
      category: "gdpr-compliance",
      message: `Customer data request received for shop: ${shop}`,
      level: "info",
      data: {
        customerId: payload.customer?.id,
        orderIds: payload.orders_requested || [],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customer data request webhook error:", error);
    Sentry.captureException(error, {
      tags: {
        webhook_type: "gdpr_data_request",
        compliance_critical: true,
      },
    });

    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
