/**
 * Centralized API type definitions
 */

// Base API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
}

export interface ApiMeta {
  timestamp: string;
  version: string;
  requestId?: string;
  pagination?: ApiPagination;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Request types
export interface ApiRequest<T = any> {
  body?: T;
  query?: Record<string, string | string[]>;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  user?: AuthUser;
}

// Auth types
export interface AuthUser {
  id: string;
  email?: string;
  shop?: string;
  scope?: string[];
  isAdmin?: boolean;
}

// Config API types
export interface ConfigCreateRequest {
  name: string;
  shopDomain: string;
  settings: ConfigSettings;
}

export interface ConfigUpdateRequest {
  name?: string;
  settings?: Partial<ConfigSettings>;
  status?: "draft" | "published" | "archived";
}

export interface ConfigSettings {
  theme: ThemeSettings;
  blocks: BlockConfig[];
  analytics?: AnalyticsSettings;
  seo?: SeoSettings;
}

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  spacing: string;
}

export interface BlockConfig {
  id: string;
  type: BlockType;
  settings: Record<string, any>;
  order: number;
  enabled: boolean;
}

export type BlockType =
  | "hero"
  | "product-grid"
  | "banner"
  | "social-links"
  | "newsletter"
  | "custom-html";

export interface AnalyticsSettings {
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  tiktokPixelId?: string;
}

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

// Asset API types
export interface AssetUploadRequest {
  file: File;
  type: AssetType;
  metadata?: Record<string, any>;
}

export type AssetType = "image" | "video" | "document" | "font";

export interface ApiAsset {
  id: string;
  url: string;
  type: AssetType;
  size: number;
  mimeType: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Analytics API types
export interface ApiAnalyticsEvent {
  type: EventType;
  configId: string;
  sessionId: string;
  data: Record<string, any>;
  timestamp: string;
}

export type EventType =
  | "page_view"
  | "product_click"
  | "add_to_cart"
  | "purchase"
  | "social_click"
  | "custom";

export interface AnalyticsData {
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  topProducts: Array<{
    productId: string;
    clicks: number;
    conversions: number;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
    conversions: number;
  }>;
}

// Webhook validation
export interface WebhookValidationResult {
  isValid: boolean;
  shop?: string;
  topic?: string;
  body?: any;
  error?: ApiError;
}
