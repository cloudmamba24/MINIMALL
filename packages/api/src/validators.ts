import { z } from 'zod';

/**
 * Common API validators
 */

// Pagination
export const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ID validation
export const idSchema = z.object({
  id: z.string().uuid(),
});

// Shop domain validation
export const shopDomainSchema = z.string().regex(/^[a-z0-9-]+\.myshopify\.com$/);

// Config validators
export const createConfigSchema = z.object({
  name: z.string().min(1).max(100),
  shopDomain: shopDomainSchema,
  settings: z.object({
    theme: z.object({
      primaryColor: z.string(),
      secondaryColor: z.string(),
      fontFamily: z.string(),
      borderRadius: z.string(),
      spacing: z.string(),
    }),
    blocks: z.array(z.any()),
  }),
});

export const updateConfigSchema = createConfigSchema.partial();

// Asset validators
export const uploadAssetSchema = z.object({
  type: z.enum(['image', 'video', 'document', 'font']),
  metadata: z.record(z.any()).optional(),
});

// Analytics validators
export const analyticsEventSchema = z.object({
  type: z.enum(['page_view', 'product_click', 'add_to_cart', 'purchase', 'social_click', 'custom']),
  configId: z.string().uuid(),
  sessionId: z.string(),
  data: z.record(z.any()),
});