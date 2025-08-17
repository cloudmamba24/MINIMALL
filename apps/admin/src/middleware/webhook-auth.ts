/**
 * Webhook Authentication Middleware
 * Validates webhook signatures to ensure requests are from Shopify
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import * as Sentry from "@sentry/nextjs";

/**
 * Verify Shopify webhook signature
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace(/^sha256=/, "");
    
    // Compute HMAC
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, "base64"),
      Buffer.from(computedSignature, "base64")
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "webhook-auth" },
      extra: { signature: signature ? "present" : "missing" }
    });
    return false;
  }
}

/**
 * Middleware to protect webhook endpoints
 */
export async function webhookAuthMiddleware(
  request: NextRequest,
  webhookSecret?: string
): Promise<NextResponse | null> {
  // Get the webhook secret
  const secret = webhookSecret || process.env.SHOPIFY_WEBHOOK_SECRET;
  
  if (!secret) {
    console.error("SHOPIFY_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get signature from headers
  const signature = request.headers.get("x-shopify-hmac-sha256");
  
  if (!signature) {
    Sentry.captureMessage("Webhook request without signature", {
      level: "warning",
      tags: {
        component: "webhook-auth",
        path: request.nextUrl.pathname
      }
    });
    
    return NextResponse.json(
      { error: "Missing webhook signature" },
      { status: 401 }
    );
  }

  // Get raw body
  const rawBody = await request.text();
  
  // Verify signature
  const isValid = verifyWebhookSignature(rawBody, signature, secret);
  
  if (!isValid) {
    Sentry.captureMessage("Invalid webhook signature", {
      level: "warning",
      tags: {
        component: "webhook-auth",
        path: request.nextUrl.pathname,
        shop: request.headers.get("x-shopify-shop-domain") || "unknown"
      }
    });
    
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  // Signature is valid, continue processing
  return null;
}

/**
 * Rate limiting for webhook endpoints
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitWebhook(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
}

/**
 * Clean up old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Extract shop domain from webhook headers
 */
export function getShopDomain(request: NextRequest): string | null {
  return request.headers.get("x-shopify-shop-domain");
}

/**
 * Validate webhook topic
 */
export function validateWebhookTopic(
  topic: string | null,
  allowedTopics: string[]
): boolean {
  if (!topic) return false;
  return allowedTopics.includes(topic);
}

/**
 * Complete webhook validation middleware
 */
export async function validateWebhook(
  request: NextRequest,
  config: {
    webhookSecret?: string;
    allowedTopics?: string[];
    rateLimit?: {
      maxRequests: number;
      windowMs: number;
    };
  } = {}
): Promise<{ isValid: boolean; error?: NextResponse; shop?: string; topic?: string | undefined; body?: any }> {
  // Check signature
  const authError = await webhookAuthMiddleware(request, config.webhookSecret);
  if (authError) {
    return { isValid: false, error: authError };
  }
  
  // Get shop domain
  const shop = getShopDomain(request);
  if (!shop) {
    return {
      isValid: false,
      error: NextResponse.json(
        { error: "Missing shop domain" },
        { status: 400 }
      )
    };
  }
  
  // Check rate limit
  if (config.rateLimit) {
    const canProceed = rateLimitWebhook(
      shop,
      config.rateLimit.maxRequests,
      config.rateLimit.windowMs
    );
    
    if (!canProceed) {
      Sentry.captureMessage("Webhook rate limit exceeded", {
        level: "warning",
        tags: { shop, component: "webhook-auth" }
      });
      
      return {
        isValid: false,
        error: NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 }
        )
      };
    }
  }
  
  // Validate topic if specified
  const topic = request.headers.get("x-shopify-topic");
  if (config.allowedTopics && topic) {
    if (!validateWebhookTopic(topic, config.allowedTopics)) {
      return {
        isValid: false,
        error: NextResponse.json(
          { error: "Invalid webhook topic" },
          { status: 400 }
        )
      };
    }
  }
  
  // Parse body
  const rawBody = await request.text();
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return {
      isValid: false,
      error: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    };
  }
  
  return {
    isValid: true,
    shop,
    topic: topic ?? undefined,
    body
  };
}

export default {
  verifyWebhookSignature,
  webhookAuthMiddleware,
  rateLimitWebhook,
  getShopDomain,
  validateWebhookTopic,
  validateWebhook
};