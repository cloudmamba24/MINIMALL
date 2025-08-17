/**
 * Database schema types
 */

export interface Shop {
  id: string;
  domain: string;
  name: string;
  email: string;
  accessToken: string;
  scope: string;
  installedAt: Date;
  uninstalledAt?: Date | null;
  status: 'active' | 'inactive' | 'uninstalled';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Config {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  shopId: string;
  token: string;
  userId?: string;
  isOnline: boolean;
  scope: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  shopId: string;
  configId?: string;
  url: string;
  key: string;
  type: string;
  size: number;
  mimeType: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsEvent {
  id: string;
  shopId: string;
  configId: string;
  sessionId: string;
  eventType: string;
  eventData: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  createdAt: Date;
}

export interface RevenueAttribution {
  id: string;
  shopId: string;
  configId: string;
  orderId: string;
  lineItemId: string;
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  revenue: number;
  currency: string;
  attributionData: Record<string, any>;
  createdAt: Date;
}

export interface WebhookLog {
  id: string;
  shopId: string;
  topic: string;
  payload: Record<string, any>;
  status: 'pending' | 'processed' | 'failed';
  error?: string;
  processedAt?: Date;
  createdAt: Date;
}