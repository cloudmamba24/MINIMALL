import { getDatabaseConnection } from "@minimall/db";
import type { ShopifyCustomer } from "@minimall/types";
import * as Sentry from "@sentry/nextjs";

/**
 * Handle customer creation
 */
export async function handleCustomerCreate(shop: string, payload: ShopifyCustomer): Promise<void> {
  try {
    console.log(`Customer created: ${payload.email} in ${shop}`);

    // Store customer in database
    // Send welcome email
    // Update analytics
    // Trigger marketing automation

    Sentry.addBreadcrumb({
      category: "webhook",
      message: `Customer created: ${payload.email}`,
      level: "info",
      data: { customerId: payload.id, shop },
    });
  } catch (error) {
    console.error(`Failed to process customer create:`, error);
    Sentry.captureException(error, {
      tags: { webhook: "customers/create", shop },
    });
    throw error;
  }
}

/**
 * Handle customer update
 */
export async function handleCustomerUpdate(shop: string, payload: ShopifyCustomer): Promise<void> {
  try {
    console.log(`Customer updated: ${payload.email} in ${shop}`);

    // Update customer in database
    // Update segments
    // Trigger re-evaluation of customer lifetime value

    Sentry.addBreadcrumb({
      category: "webhook",
      message: `Customer updated: ${payload.email}`,
      level: "info",
      data: { customerId: payload.id, shop },
    });
  } catch (error) {
    console.error(`Failed to process customer update:`, error);
    Sentry.captureException(error, {
      tags: { webhook: "customers/update", shop },
    });
    throw error;
  }
}
