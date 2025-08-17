/**
 * Webhook-specific type definitions
 */

export interface WebhookConfig {
  topic: string;
  address: string;
  format: "json" | "xml";
  fields?: string[];
  metafield_namespaces?: string[];
  api_version?: string;
}

export interface WebhookSubscription {
  id: string;
  topic: string;
  address: string;
  format: string;
  created_at: string;
  updated_at: string;
  api_version: string;
}

export interface WebhookProcessingResult {
  success: boolean;
  message?: string;
  error?: Error;
  retryable?: boolean;
}
