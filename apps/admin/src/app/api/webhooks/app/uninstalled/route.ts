import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { getWebhookHandler } from "../../../../../lib/webhook-handler";
import { validateWebhook } from "../../../../../middleware/webhook-auth";

// Force Node.js runtime for crypto operations
export const runtime = "nodejs";

// POST /api/webhooks/app/uninstalled - Handle app uninstall webhook
export async function POST(request: NextRequest) {
  try {
    // Validate webhook with rate limiting
    const validation = await validateWebhook(request, {
      allowedTopics: ["app/uninstalled"],
      rateLimit: {
        maxRequests: 5, // Lower limit for uninstall webhook
        windowMs: 60000 // 5 per minute per shop
      }
    });
    
    if (!validation.isValid) {
      return validation.error!;
    }
    
    const { shop, topic, body } = validation;
    const webhookHandler = getWebhookHandler();

    // Process webhook
    await webhookHandler.processWebhook(topic!, shop!, body, JSON.stringify(body));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("App uninstall webhook error:", error);
    Sentry.captureException(error);

    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
