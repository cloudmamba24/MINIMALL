import type { ShopifyWebhookTopic } from '@minimall/types';
import { handleAppUninstalled } from './app-uninstalled';
import { handleOrderCreate } from './order-create';
import { handleProductCreate, handleProductUpdate, handleProductDelete } from './products';
import { handleCustomerCreate, handleCustomerUpdate } from './customers';

/**
 * Webhook handler registry
 */
export const handlers: Partial<Record<ShopifyWebhookTopic, (shop: string, payload: any) => Promise<void>>> = {
  'app/uninstalled': handleAppUninstalled,
  'orders/create': handleOrderCreate,
  'products/create': handleProductCreate,
  'products/update': handleProductUpdate,
  'products/delete': handleProductDelete,
  'customers/create': handleCustomerCreate,
  'customers/update': handleCustomerUpdate,
};

export * from './app-uninstalled';
export * from './order-create';
export * from './products';
export * from './customers';