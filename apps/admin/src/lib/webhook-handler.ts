import crypto from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";

export interface WebhookPayload {
  id: string | number;
  shop_domain: string;
  created_at: string;
  [key: string]: unknown;
}

export interface WebhookContext {
  shop: string;
  topic: string;
  payload: WebhookPayload;
  timestamp: Date;
}

export class WebhookHandler {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  verifySignature(body: string, signature: string): boolean {
    try {
      // Remove 'sha256=' prefix if present
      const cleanSignature = signature.replace(/^sha256=/, "");

      const computedSignature = crypto
        .createHmac("sha256", this.secretKey)
        .update(body, "utf8")
        .digest("base64");

      return crypto.timingSafeEqual(
        Buffer.from(cleanSignature, "base64"),
        Buffer.from(computedSignature, "base64")
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return false;
    }
  }

  async processWebhook(
    topic: string,
    shop: string,
    payload: unknown,
    rawBody: string
  ): Promise<void> {
    const context: WebhookContext = {
      shop,
      topic,
      payload: payload as WebhookPayload,
      timestamp: new Date(),
    };

    try {
      // Store webhook in database for processing
      await this.storeWebhook(context, rawBody);

      // Process webhook based on topic
      await this.routeWebhook(context);

      // Mark webhook as processed
      await this.markWebhookProcessed(context);

      Sentry.addBreadcrumb({
        category: "webhook",
        message: `Processed webhook: ${topic} for shop: ${shop}`,
        level: "info",
      });
    } catch (error) {
      console.error(`Webhook processing failed for ${topic}:`, error);
      Sentry.captureException(error, {
        tags: {
          webhook_topic: topic,
          shop_domain: shop,
        },
        extra: {
          payload,
        },
      });
      throw error;
    }
  }

  private async storeWebhook(context: WebhookContext, _rawBody: string): Promise<void> {
    const { createDatabase, webhooks } = await import("@minimall/db");
    const db = createDatabase(process.env.DATABASE_URL!);

    await db.insert(webhooks).values({
      shopDomain: context.shop,
      event: context.topic,
      topic: context.topic,
      payload: context.payload,
      processed: false,
      createdAt: context.timestamp,
    });
  }

  private async markWebhookProcessed(context: WebhookContext): Promise<void> {
    const { createDatabase, webhooks } = await import("@minimall/db");
    const db = createDatabase(process.env.DATABASE_URL!);

    await db
      .update(webhooks)
      .set({
        processed: true,
        processedAt: new Date(),
      })
      .where(
        and(
          eq(webhooks.shopDomain, context.shop),
          eq(webhooks.event, context.topic),
          eq(webhooks.processed, false)
        )
      );
  }

  private async routeWebhook(context: WebhookContext): Promise<void> {
    const { topic } = context;

    switch (topic) {
      case "app/uninstalled":
        await this.handleAppUninstall(context);
        break;

      case "products/create":
      case "products/update":
      case "products/delete":
        await this.handleProductUpdate(context);
        break;

      case "customers/data_request":
        await this.handleCustomerDataRequest(context);
        break;

      case "customers/redact":
        await this.handleCustomerRedact(context);
        break;

      case "shop/redact":
        await this.handleShopRedact(context);
        break;

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }
  }

  private async handleAppUninstall(context: WebhookContext): Promise<void> {
    const { shop } = context;
    const { createDatabase, users, configs, featureFlags } = await import("@minimall/db");
    const _db = createDatabase(process.env.DATABASE_URL!);

    try {
      // Clean up shop data (be careful with cascade deletions)
      console.log(`Processing app uninstall for shop: ${shop}");

      // Delete user accounts for this shop
      await db.delete(users).where(eq(users.shopDomain, shop));

      // Delete configurations for this shop
      await db.delete(configs).where(eq(configs.shop, shop));

      // Delete feature flags for this shop
      await db.delete(featureFlags).where(eq(featureFlags.shopDomain, shop));

      // Keep webhooks and analytics for audit purposes
      // but could be deleted after retention period

      console.log("App uninstall cleanup completed for shop: ${shop}`);

      Sentry.addBreadcrumb({
        category: "app-lifecycle",
        message: `App uninstalled and cleaned up for shop: ${shop}`,
        level: "info",
      });
    } catch (error) {
      console.error(`App uninstall cleanup failed for ${shop}:`, error);
      throw error;
    }
  }

  private async handleProductUpdate(context: WebhookContext): Promise<void> {
    const { shop, topic, payload } = context;

    // This would typically sync product data with configurations
    // For now, just log the event
    console.log(`Product ${topic} for shop ${shop}:`, payload.id);

    // TODO: Implement product sync logic
    // - Update product references in configurations
    // - Refresh cached product data
    // - Invalidate CDN cache if needed
  }

  private async handleCustomerDataRequest(context: WebhookContext): Promise<void> {
    const { shop, payload } = context;

    // GDPR compliance: Handle customer data request
    console.log(
      `Customer data request for shop ${shop}, customer:`,
      (payload as Record<string, unknown>).customer
    );

    // TODO: Implement GDPR data export
    // - Collect all customer data from analytics
    // - Generate data export file
    // - Send to customer or provide download link

    Sentry.addBreadcrumb({
      category: "gdpr",
      message: `Customer data request processed for shop: ${shop}`,
      level: "info",
    });
  }

  private async handleCustomerRedact(context: WebhookContext): Promise<void> {
    const { shop, payload } = context;
    const customerId = (payload as Record<string, unknown>).customer;

    if (!customerId) return;

    console.log(`Customer redaction request for shop ${shop}, customer: ${customerId}`);

    // TODO: Implement GDPR customer data deletion
    // - Remove customer data from analytics
    // - Anonymize or delete related records
    // - Ensure compliance with data retention policies

    Sentry.addBreadcrumb({
      category: "gdpr",
      message: `Customer data redacted for shop: ${shop}, customer: ${customerId}`,
      level: "info",
    });
  }

  private async handleShopRedact(context: WebhookContext): Promise<void> {
    const { shop } = context;

    console.log(`Shop redaction request for shop: ${shop}`);

    // TODO: Implement GDPR shop data deletion
    // - This is called 48 hours after app uninstall
    // - Remove all remaining shop data
    // - Clean up any backup or cached data

    const { createDatabase, webhooks, analyticsEvents, configs } = await import("@minimall/db");
    const db = createDatabase(process.env.DATABASE_URL!);

    try {
      // Remove all remaining data for this shop
      await db.delete(webhooks).where(eq(webhooks.shopDomain, shop));

      // Remove analytics data efficiently using join (consider retention policies)
      // First get all config IDs for this shop to avoid subquery
      const shopConfigs = await db
        .select({ id: configs.id })
        .from(configs)
        .where(eq(configs.shop, shop));

      // Delete analytics events for all configs belonging to this shop
      if (shopConfigs.length > 0) {
        const configIds = shopConfigs.map((config) => config.id);

        // Use Promise.all for parallel deletion if there are many configs
        if (configIds.length > 10) {
          // Batch delete for better performance with many configs
          const deletePromises = configIds.map((configId) =>
            db.delete(analyticsEvents).where(eq(analyticsEvents.configId, configId))
          );
          await Promise.all(deletePromises);
        } else {
          // Simple deletion for few configs
          for (const configId of configIds) {
            await db.delete(analyticsEvents).where(eq(analyticsEvents.configId, configId));
          }
        }
      }

      Sentry.addBreadcrumb({
        category: "gdpr",
        message: `Shop data redacted for shop: ${shop}`,
        level: "info",
      });
    } catch (error) {
      console.error(`Shop redaction failed for ${shop}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
let webhookHandlerInstance: WebhookHandler | null = null;

export function getWebhookHandler(): WebhookHandler {
  if (!webhookHandlerInstance) {
    const secretKey = process.env.SHOPIFY_API_SECRET;

    if (!secretKey) {
      throw new Error("SHOPIFY_API_SECRET environment variable is required for webhook handling");
    }

    webhookHandlerInstance = new WebhookHandler(secretKey);
  }

  return webhookHandlerInstance;
}
