import { describe, expect, it } from "vitest";
import {
  analyticsEvents,
  configVersions,
  configs,
  featureFlags,
  performanceMetrics,
  schema,
  sessions,
  users,
  webhooks,
} from "./schema";

describe("Database Schema", () => {
  describe("Table definitions", () => {
    it("should export all expected tables", () => {
      expect(configs).toBeDefined();
      expect(configVersions).toBeDefined();
      expect(users).toBeDefined();
      expect(performanceMetrics).toBeDefined();
      expect(analyticsEvents).toBeDefined();
      expect(webhooks).toBeDefined();
      expect(sessions).toBeDefined();
      expect(featureFlags).toBeDefined();
    });

    it("should export schema object with all tables", () => {
      expect(schema).toBeDefined();
      expect(schema.configs).toBe(configs);
      expect(schema.configVersions).toBe(configVersions);
      expect(schema.users).toBe(users);
      expect(schema.performanceMetrics).toBe(performanceMetrics);
      expect(schema.analyticsEvents).toBe(analyticsEvents);
      expect(schema.webhooks).toBe(webhooks);
      expect(schema.sessions).toBe(sessions);
      expect(schema.featureFlags).toBe(featureFlags);
    });
  });

  describe("Table structure validation", () => {
    it("should have proper primary keys", () => {
      // These tests validate the table structure exists
      // In a real implementation, you'd test with actual database operations
      expect(configs.id).toBeDefined();
      expect(configVersions.id).toBeDefined();
      expect(users.id).toBeDefined();
      expect(performanceMetrics.id).toBeDefined();
      expect(analyticsEvents.id).toBeDefined();
      expect(webhooks.id).toBeDefined();
      expect(sessions.id).toBeDefined();
      expect(featureFlags.id).toBeDefined();
    });

    it("should have proper foreign key relationships", () => {
      // Validate foreign key fields exist
      expect(configVersions.configId).toBeDefined();
      expect(performanceMetrics.configId).toBeDefined();
      expect(analyticsEvents.configId).toBeDefined();
      expect(sessions.configId).toBeDefined();
    });

    it("should have proper timestamp fields", () => {
      // Validate timestamp fields exist
      expect(configs.createdAt).toBeDefined();
      expect(configs.updatedAt).toBeDefined();
      expect(users.createdAt).toBeDefined();
      expect(users.updatedAt).toBeDefined();
      expect(performanceMetrics.timestamp).toBeDefined();
      expect(analyticsEvents.timestamp).toBeDefined();
    });
  });
});
