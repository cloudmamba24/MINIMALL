import { z } from 'zod';

/**
 * Centralized environment variable validation
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url().optional(),
  DATABASE_POOL_SIZE: z.string().transform(Number).default('10'),
  
  // Shopify
  SHOPIFY_API_KEY: z.string().optional(),
  SHOPIFY_API_SECRET: z.string().optional(),
  SHOPIFY_SCOPES: z.string().default('read_products,write_products'),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
  SHOPIFY_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().optional(),
  
  // R2 Storage
  R2_ENDPOINT: z.string().url().optional(),
  R2_ACCESS_KEY: z.string().optional(),
  R2_SECRET: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  
  // URLs
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_ADMIN_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Auth
  NEXTAUTH_SECRET: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  
  // Vercel
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates and returns typed environment variables
 */
export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  
  return parsed.data;
}

/**
 * Get validated env vars (cached)
 */
let cachedEnv: Env | undefined;
export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Check if running in production
 */
export const isProduction = () => getEnv().NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = () => getEnv().NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = () => getEnv().NODE_ENV === 'test';