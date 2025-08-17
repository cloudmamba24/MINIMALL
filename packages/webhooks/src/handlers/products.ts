import { getDatabaseConnection } from '@minimall/db';
import * as Sentry from '@sentry/nextjs';
import type { ShopifyProduct } from '@minimall/types';

/**
 * Handle product creation
 */
export async function handleProductCreate(shop: string, payload: ShopifyProduct): Promise<void> {
  try {
    console.log(`Product created: ${payload.title} in ${shop}`);
    
    // Sync product to database
    // Invalidate product caches
    // Update search index
    // Trigger config rebuilds if needed
    
    Sentry.addBreadcrumb({
      category: 'webhook',
      message: `Product created: ${payload.title}`,
      level: 'info',
      data: { productId: payload.id, shop },
    });
  } catch (error) {
    console.error(`Failed to process product create:`, error);
    Sentry.captureException(error, {
      tags: { webhook: 'products/create', shop },
    });
    throw error;
  }
}

/**
 * Handle product update
 */
export async function handleProductUpdate(shop: string, payload: ShopifyProduct): Promise<void> {
  try {
    console.log(`Product updated: ${payload.title} in ${shop}`);
    
    // Update product in database
    // Invalidate product caches
    // Update search index
    // Check if used in any configs and trigger rebuilds
    
    Sentry.addBreadcrumb({
      category: 'webhook',
      message: `Product updated: ${payload.title}`,
      level: 'info',
      data: { productId: payload.id, shop },
    });
  } catch (error) {
    console.error(`Failed to process product update:`, error);
    Sentry.captureException(error, {
      tags: { webhook: 'products/update', shop },
    });
    throw error;
  }
}

/**
 * Handle product deletion
 */
export async function handleProductDelete(shop: string, payload: { id: number }): Promise<void> {
  try {
    console.log(`Product deleted: ${payload.id} in ${shop}`);
    
    // Remove product from database
    // Invalidate product caches
    // Update search index
    // Remove from any configs using this product
    
    Sentry.addBreadcrumb({
      category: 'webhook',
      message: `Product deleted: ${payload.id}`,
      level: 'info',
      data: { productId: payload.id, shop },
    });
  } catch (error) {
    console.error(`Failed to process product delete:`, error);
    Sentry.captureException(error, {
      tags: { webhook: 'products/delete', shop },
    });
    throw error;
  }
}