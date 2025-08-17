/**
 * Database schema types
 */

export interface Shop {
  shopDomain: string;
  storefrontAccessToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Config {
  id: string;
  shop: string;
  slug: string;
  currentVersionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  configId?: string | null;
  cartData?: any;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  shopDomain: string;
  type: string;
  r2Key: string;
  originalFilename: string;
  fileSize: number;
  dimensions?: any;
  variants: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsEvent {
  id: string;
  event: string;
  configId: string;
  userId?: string | null;
  sessionId: string;
  properties: Record<string, any>;
  userAgent?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  blockId?: string | null;
  layoutPreset?: string | null;
  variantId?: string | null;
  experimentKey?: string | null;
  device: string;
  country?: string | null;
  timestamp: Date;
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
  shopDomain: string;
  event: string;
  topic: string;
  payload: Record<string, any>;
  processed: boolean;
  processedAt?: Date | null;
  createdAt: Date;
}

export interface ConfigVersion {
  id: string;
  configId: string;
  version: string;
  data: any;
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  publishedAt?: Date | null;
  scheduledAt?: Date | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  shopDomain: string;
  role: string;
  permissions: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceMetric {
  id: number;
  configId: string;
  lcp?: number | null;
  fid?: number | null;
  cls?: number | null;
  ttfb?: number | null;
  loadTime?: number | null;
  userAgent?: string | null;
  connection?: string | null;
  viewportWidth?: number | null;
  viewportHeight?: number | null;
  timestamp: Date;
}

export interface FeatureFlag {
  id: string;
  shopDomain: string;
  flagName: string;
  enabled: boolean;
  value?: any;
  createdAt: Date;
  updatedAt: Date;
}