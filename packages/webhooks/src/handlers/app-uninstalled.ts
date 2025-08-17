import { getDatabaseConnection } from '@minimall/db';
import * as Sentry from '@sentry/nextjs';

/**
 * Handle app uninstall webhook
 */
export async function handleAppUninstalled(shop: string, payload: any): Promise<void> {
  try {
    const db = getDatabaseConnection();
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    console.log(`Processing app uninstall for shop: ${shop}`);
    
    // Update shop status in database
    // await db.update(shops)
    //   .set({
    //     status: 'uninstalled',
    //     uninstalledAt: new Date(),
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(shops.domain, shop));
    
    // Clean up shop data if needed
    // - Mark configs as archived
    // - Cancel any active subscriptions
    // - Send notification email
    
    // Log uninstall event
    Sentry.addBreadcrumb({
      category: 'webhook',
      message: `App uninstalled: ${shop}`,
      level: 'info',
    });
    
    console.log(`Successfully processed app uninstall for ${shop}`);
  } catch (error) {
    console.error(`Failed to process app uninstall for ${shop}:`, error);
    Sentry.captureException(error, {
      tags: { webhook: 'app/uninstalled', shop },
    });
    throw error;
  }
}