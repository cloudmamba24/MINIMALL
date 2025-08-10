import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Shops table - per-shop storefront tokens
export const shops = pgTable("shops", {
  shopDomain: text("shop_domain").primaryKey(),
  storefrontAccessToken: text("storefront_access_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Configuration versions table
export const configVersions = pgTable(
  "config_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    configId: text("config_id")
      .references(() => configs.id, { onDelete: "cascade" })
      .notNull(),
    version: varchar("version", { length: 50 }).notNull(),
    data: jsonb("data").notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }), // New field for scheduling
  },
  (table) => ({
    configIdIdx: index("config_id_idx").on(table.configId),
    publishedIdx: index("published_idx").on(table.isPublished),
    scheduledIdx: index("scheduled_idx").on(table.scheduledAt),
  })
);

// Main configuration table
export const configs = pgTable(
  "configs",
  {
    id: text("id").primaryKey(),
    shop: text("shop")
      .references(() => shops.shopDomain, { onDelete: "cascade" })
      .notNull(),
    slug: text("slug").notNull(),
    currentVersionId: uuid("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    shopIdx: index("shop_idx").on(table.shop),
    slugIdx: index("slug_idx").on(table.slug),
  })
);

// Users/Admin table
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    shopDomain: text("shop_domain").notNull(),
    role: varchar("role", { length: 50 }).notNull().default("editor"),
    permissions: jsonb("permissions").default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    shopDomainIdx: index("shop_domain_idx").on(table.shopDomain),
  })
);

// Performance metrics table
export const performanceMetrics = pgTable(
  "performance_metrics",
  {
    id: serial("id").primaryKey(),
    configId: text("config_id")
      .references(() => configs.id, { onDelete: "cascade" })
      .notNull(),
    lcp: integer("lcp"), // Largest Contentful Paint in ms
    fid: integer("fid"), // First Input Delay in ms
    cls: integer("cls"), // Cumulative Layout Shift * 1000 (to store as integer)
    ttfb: integer("ttfb"), // Time to First Byte in ms
    loadTime: integer("load_time"), // Total load time in ms
    userAgent: text("user_agent"),
    connection: varchar("connection", { length: 50 }),
    viewportWidth: integer("viewport_width"),
    viewportHeight: integer("viewport_height"),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    configIdIdx: index("perf_config_id_idx").on(table.configId),
    timestampIdx: index("perf_timestamp_idx").on(table.timestamp),
  })
);

// Analytics events table
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    event: varchar("event", { length: 100 }).notNull(),
    configId: text("config_id")
      .references(() => configs.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id"),
    sessionId: text("session_id").notNull(),
    properties: jsonb("properties").default({}).notNull(),
    userAgent: text("user_agent"),
    referrer: text("referrer"),
    utmSource: varchar("utm_source", { length: 100 }),
    utmMedium: varchar("utm_medium", { length: 100 }),
    utmCampaign: varchar("utm_campaign", { length: 100 }),
    utmTerm: varchar("utm_term", { length: 100 }),
    utmContent: varchar("utm_content", { length: 100 }),
    // Enhanced analytics fields
    blockId: text("block_id"),
    layoutPreset: varchar("layout_preset", { length: 50 }),
    variantId: text("variant_id"),
    experimentKey: varchar("experiment_key", { length: 100 }),
    device: varchar("device", { length: 20 }).notNull(),
    country: varchar("country", { length: 5 }),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    configIdIdx: index("analytics_config_id_idx").on(table.configId),
    eventIdx: index("analytics_event_idx").on(table.event),
    timestampIdx: index("analytics_timestamp_idx").on(table.timestamp),
    sessionIdx: index("analytics_session_idx").on(table.sessionId),
    blockIdIdx: index("analytics_block_id_idx").on(table.blockId),
    experimentIdx: index("analytics_experiment_idx").on(table.experimentKey),
  })
);

// Shopify webhooks table
export const webhooks = pgTable(
  "webhooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopDomain: text("shop_domain").notNull(),
    event: varchar("event", { length: 100 }).notNull(),
    topic: varchar("topic", { length: 100 }).notNull(),
    payload: jsonb("payload").notNull(),
    processed: boolean("processed").default(false).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    shopDomainIdx: index("webhook_shop_domain_idx").on(table.shopDomain),
    eventIdx: index("webhook_event_idx").on(table.event),
    processedIdx: index("webhook_processed_idx").on(table.processed),
  })
);

// Sessions table for cart persistence
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    configId: text("config_id").references(() => configs.id, { onDelete: "cascade" }),
    cartData: jsonb("cart_data"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    configIdIdx: index("session_config_id_idx").on(table.configId),
    expiresAtIdx: index("session_expires_at_idx").on(table.expiresAt),
  })
);

// Feature flags table
export const featureFlags = pgTable(
  "feature_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopDomain: text("shop_domain").notNull(),
    flagName: varchar("flag_name", { length: 100 }).notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    value: jsonb("value"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    shopDomainIdx: index("feature_flag_shop_domain_idx").on(table.shopDomain),
    flagNameIdx: index("feature_flag_name_idx").on(table.flagName),
  })
);

// Assets table - managed media workflow
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopDomain: text("shop_domain")
      .references(() => shops.shopDomain, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 10 }).notNull(), // 'image' or 'video'
    r2Key: text("r2_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    fileSize: integer("file_size").notNull(),
    dimensions: jsonb("dimensions"), // { width: number, height: number }
    variants: jsonb("variants").default([]).notNull(), // AssetVariant[]
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    shopDomainIdx: index("assets_shop_domain_idx").on(table.shopDomain),
    typeIdx: index("assets_type_idx").on(table.type),
    r2KeyIdx: index("assets_r2_key_idx").on(table.r2Key),
  })
);

// Usage rollups table - MAU tracking
export const usageRollups = pgTable(
  "usage_rollups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopDomain: text("shop_domain")
      .references(() => shops.shopDomain, { onDelete: "cascade" })
      .notNull(),
    month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
    mau: integer("mau").notNull(), // Monthly Active Users
    impressions: integer("impressions").default(0).notNull(),
    checkouts: integer("checkouts").default(0).notNull(),
    revenue: integer("revenue").default(0).notNull(), // in cents
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    shopDomainIdx: index("usage_rollups_shop_domain_idx").on(table.shopDomain),
    monthIdx: index("usage_rollups_month_idx").on(table.month),
    uniqueMonthShop: index("usage_rollups_unique_month_shop").on(table.shopDomain, table.month),
  })
);

// Revenue attribution table
export const revenueAttributions = pgTable(
  "revenue_attributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: text("order_id").notNull(),
    lineItemId: text("line_item_id").notNull(),
    shopDomain: text("shop_domain")
      .references(() => shops.shopDomain, { onDelete: "cascade" })
      .notNull(),
    configId: text("config_id")
      .references(() => configs.id, { onDelete: "cascade" })
      .notNull(),
    blockId: text("block_id").notNull(),
    layoutPreset: varchar("layout_preset", { length: 50 }).notNull(),
    experimentKey: varchar("experiment_key", { length: 100 }),
    productId: text("product_id").notNull(),
    variantId: text("variant_id").notNull(),
    quantity: integer("quantity").notNull(),
    price: integer("price").notNull(), // in cents
    revenue: integer("revenue").notNull(), // in cents (price * quantity)
    // UTM data
    utmSource: varchar("utm_source", { length: 100 }),
    utmMedium: varchar("utm_medium", { length: 100 }),
    utmCampaign: varchar("utm_campaign", { length: 100 }),
    utmTerm: varchar("utm_term", { length: 100 }),
    utmContent: varchar("utm_content", { length: 100 }),
    sessionId: text("session_id").notNull(),
    device: varchar("device", { length: 20 }).notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index("revenue_attr_order_id_idx").on(table.orderId),
    configIdIdx: index("revenue_attr_config_id_idx").on(table.configId),
    blockIdIdx: index("revenue_attr_block_id_idx").on(table.blockId),
    shopDomainIdx: index("revenue_attr_shop_domain_idx").on(table.shopDomain),
    timestampIdx: index("revenue_attr_timestamp_idx").on(table.timestamp),
    experimentIdx: index("revenue_attr_experiment_idx").on(table.experimentKey),
  })
);

// Relations
export const configsRelations = relations(configs, ({ many, one }) => ({
  shop: one(shops, {
    fields: [configs.shop],
    references: [shops.shopDomain],
  }),
  versions: many(configVersions),
  currentVersion: one(configVersions, {
    fields: [configs.currentVersionId],
    references: [configVersions.id],
  }),
  performanceMetrics: many(performanceMetrics),
  analyticsEvents: many(analyticsEvents),
  sessions: many(sessions),
  revenueAttributions: many(revenueAttributions),
}));

export const configVersionsRelations = relations(configVersions, ({ one }) => ({
  config: one(configs, {
    fields: [configVersions.configId],
    references: [configs.id],
  }),
}));

export const usersRelations = relations(users, () => ({
  // Users can be associated with configs through shop domain
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  config: one(configs, {
    fields: [performanceMetrics.configId],
    references: [configs.id],
  }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  config: one(configs, {
    fields: [analyticsEvents.configId],
    references: [configs.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  config: one(configs, {
    fields: [sessions.configId],
    references: [configs.id],
  }),
}));

export const shopsRelations = relations(shops, ({ many }) => ({
  configs: many(configs),
  assets: many(assets),
  usageRollups: many(usageRollups),
  revenueAttributions: many(revenueAttributions),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  shop: one(shops, {
    fields: [assets.shopDomain],
    references: [shops.shopDomain],
  }),
}));

export const usageRollupsRelations = relations(usageRollups, ({ one }) => ({
  shop: one(shops, {
    fields: [usageRollups.shopDomain],
    references: [shops.shopDomain],
  }),
}));

export const revenueAttributionsRelations = relations(revenueAttributions, ({ one }) => ({
  shop: one(shops, {
    fields: [revenueAttributions.shopDomain],
    references: [shops.shopDomain],
  }),
  config: one(configs, {
    fields: [revenueAttributions.configId],
    references: [configs.id],
  }),
}));

// Export all tables for migrations and queries
export const schema = {
  configs,
  configVersions,
  users,
  performanceMetrics,
  analyticsEvents,
  webhooks,
  sessions,
  featureFlags,
  shops,
  assets,
  usageRollups,
  revenueAttributions,
};

// Type exports for TypeScript inference
export type Config = typeof configs.$inferSelect;
export type NewConfig = typeof configs.$inferInsert;
export type ConfigVersion = typeof configVersions.$inferSelect;
export type NewConfigVersion = typeof configVersions.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type NewPerformanceMetric = typeof performanceMetrics.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type UsageRollup = typeof usageRollups.$inferSelect;
export type NewUsageRollup = typeof usageRollups.$inferInsert;
export type RevenueAttribution = typeof revenueAttributions.$inferSelect;
export type NewRevenueAttribution = typeof revenueAttributions.$inferInsert;
