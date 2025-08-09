import { NextRequest, NextResponse } from 'next/server';
import { getWebhookHandler } from '../../../../lib/webhook-handler';
import * as Sentry from '@sentry/nextjs';

// POST /api/webhooks/shop/redact - Handle GDPR shop data redaction webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256');
    const topic = request.headers.get('x-shopify-topic');
    const shop = request.headers.get('x-shopify-shop-domain');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop domain' },
        { status: 400 }
      );
    }

    if (topic !== 'shop/redact') {
      return NextResponse.json(
        { error: 'Invalid webhook topic' },
        { status: 400 }
      );
    }

    const webhookHandler = getWebhookHandler();

    // Verify webhook signature
    if (!webhookHandler.verifySignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(body);

    // Process GDPR shop redaction webhook (called 48 hours after app uninstall)
    await webhookHandler.processWebhook(topic, shop, payload, body);

    Sentry.addBreadcrumb({
      category: 'gdpr-compliance',
      message: `Shop data redaction completed for shop: ${shop}`,
      level: 'info',
      data: {
        shopId: payload.shop_id,
        shopDomain: payload.shop_domain,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Shop redact webhook error:', error);
    Sentry.captureException(error, {
      tags: {
        webhook_type: 'gdpr_shop_redact',
        compliance_critical: true,
      },
    });
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}