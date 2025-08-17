import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import type { ShopifyWebhookTopic, WebhookValidationResult } from '@minimall/types';
import { getDatabaseConnection } from '@minimall/db';
import { handlers } from './handlers';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Main webhook router - handles all Shopify webhooks
 */
export async function handleWebhook(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate webhook
    const validation = await validateWebhook(request);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error?.message || 'Invalid webhook' },
        { status: validation.error?.statusCode || 400 }
      );
    }

    const { shop, topic, body } = validation;
    
    // Log webhook receipt
    await logWebhook(shop!, topic as ShopifyWebhookTopic, body);
    
    // Route to appropriate handler
    const handler = handlers[topic as ShopifyWebhookTopic];
    if (!handler) {
      console.warn(`No handler for webhook topic: ${topic}`);
      return NextResponse.json({ received: true });
    }
    
    // Process webhook
    await handler(shop!, body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Validates webhook signature and rate limits
 */
export async function validateWebhook(
  request: NextRequest
): Promise<WebhookValidationResult> {
  // Check signature
  const signature = request.headers.get('x-shopify-hmac-sha256');
  const shop = request.headers.get('x-shopify-shop-domain');
  const topic = request.headers.get('x-shopify-topic');
  
  if (!signature || !shop || !topic) {
    return {
      isValid: false,
      error: {
        code: 'MISSING_HEADERS',
        message: 'Missing required webhook headers',
        statusCode: 401,
      },
    };
  }
  
  // Get raw body
  const rawBody = await request.text();
  
  // Verify signature
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('SHOPIFY_WEBHOOK_SECRET not configured');
    return {
      isValid: false,
      error: {
        code: 'CONFIG_ERROR',
        message: 'Webhook secret not configured',
        statusCode: 500,
      },
    };
  }
  
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody, 'utf8')
    .digest('base64');
  
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash))) {
    Sentry.captureMessage('Invalid webhook signature', {
      level: 'warning',
      tags: { shop, topic },
    });
    
    return {
      isValid: false,
      error: {
        code: 'INVALID_SIGNATURE',
        message: 'Invalid webhook signature',
        statusCode: 401,
      },
    };
  }
  
  // Check rate limit
  if (!checkRateLimit(shop, topic)) {
    return {
      isValid: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        statusCode: 429,
      },
    };
  }
  
  // Parse body
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return {
      isValid: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON body',
        statusCode: 400,
      },
    };
  }
  
  return {
    isValid: true,
    shop,
    topic,
    body,
  };
}

/**
 * Rate limiting per shop and topic
 */
function checkRateLimit(shop: string, topic: string): boolean {
  const key = `${shop}:${topic}`;
  const now = Date.now();
  const limit = getRateLimitForTopic(topic);
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + 60000, // 1 minute window
    });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Get rate limit based on webhook topic
 */
function getRateLimitForTopic(topic: string): number {
  const limits: Record<string, number> = {
    'app/uninstalled': 5,
    'orders/create': 50,
    'orders/updated': 50,
    'products/create': 20,
    'products/update': 20,
    'products/delete': 20,
    default: 30,
  };
  
  return limits[topic] || limits.default;
}

/**
 * Log webhook to database
 */
async function logWebhook(
  shop: string,
  topic: ShopifyWebhookTopic,
  payload: any
): Promise<void> {
  try {
    const db = getDatabaseConnection();
    if (!db) return;
    
    // Store webhook log (implement based on your schema)
    // await db.insert(webhookLogs).values({
    //   shopDomain: shop,
    //   topic,
    //   payload,
    //   status: 'pending',
    //   createdAt: new Date(),
    // });
  } catch (error) {
    console.error('Failed to log webhook:', error);
  }
}

// Cleanup old rate limit records periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime + 60000) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
}

export * from './handlers';
export * from './types';