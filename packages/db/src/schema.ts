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

// Main configuration table
export const configs = pgTable(
  "configs",
  {
    id: text("id").primaryKey(),
    shop: text("shop").notNull(),
    slug: text("slug").notNull(),
    currentVersionId: text("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    shopIdx: index("shop_idx").on(table.shop),
    slugIdx: index("slug_idx").on(table.slug),
  })
);

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
  },
  (table) => ({
    configIdIdx: index("config_id_idx").on(table.configId),
    publishedIdx: index("published_idx").on(table.isPublished),
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
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    configIdIdx: index("analytics_config_id_idx").on(table.configId),
    eventIdx: index("analytics_event_idx").on(table.event),
    timestampIdx: index("analytics_timestamp_idx").on(table.timestamp),
    sessionIdx: index("analytics_session_idx").on(table.sessionId),
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

// Relations
export const configsRelations = relations(configs, ({ many, one }) => ({
  versions: many(configVersions),
  currentVersion: one(configVersions, {
    fields: [configs.currentVersionId],
    references: [configVersions.id],
  }),
  performanceMetrics: many(performanceMetrics),
  analyticsEvents: many(analyticsEvents),
  sessions: many(sessions),
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
