/**
 * Configuration types
 */

export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: FeatureFlags;
  limits: RateLimits;
}

export interface FeatureFlags {
  enableAnalytics: boolean;
  enableWebhooks: boolean;
  enableNotifications: boolean;
  enableBetaFeatures: boolean;
  enableDebugMode: boolean;
}

export interface RateLimits {
  api: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  webhooks: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  uploads: {
    maxFileSize: number; // in bytes
    maxFilesPerUpload: number;
  };
}

export interface CacheConfig {
  ttl: number; // in seconds
  maxSize: number; // max items in cache
  strategy: 'lru' | 'fifo' | 'lfu';
}