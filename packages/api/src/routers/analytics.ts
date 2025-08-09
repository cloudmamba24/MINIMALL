import { z } from 'zod';
import { createTRPCRouter, publicProcedure, dbProcedure } from '../trpc';

// Import drizzle ORM
let eq: any, and: any, gte: any, lte: any, desc: any;
try {
  const drizzleModule = require('drizzle-orm');
  eq = drizzleModule.eq;
  and = drizzleModule.and;
  gte = drizzleModule.gte;
  lte = drizzleModule.lte;
  desc = drizzleModule.desc;
} catch {
  console.warn('Drizzle ORM not available');
}

// Import schema
let analyticsEvents: any, performanceMetrics: any;
try {
  const schemaModule = require('@minimall/db/schema');
  analyticsEvents = schemaModule.analyticsEvents;
  performanceMetrics = schemaModule.performanceMetrics;
} catch {
  console.warn('Database schema not available');
}

export const analyticsRouter = createTRPCRouter({
  // Track analytics event
  track: publicProcedure
    .input(z.object({
      event: z.string(),
      configId: z.string(),
      userId: z.string().optional(),
      sessionId: z.string(),
      properties: z.record(z.any()).default({}),
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
      utm: z.object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
        term: z.string().optional(),
        content: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { event, configId, userId, sessionId, properties, userAgent, referrer, utm } = input;

      // If no database, just log the event
      if (!ctx.db) {
        console.log('Analytics event (no DB):', { event, configId, sessionId });
        return { success: true, stored: false };
      }

      try {
        await ctx.db.insert(analyticsEvents).values({
          event,
          configId,
          userId,
          sessionId,
          properties,
          userAgent,
          referrer,
          utmSource: utm?.source,
          utmMedium: utm?.medium,
          utmCampaign: utm?.campaign,
          utmTerm: utm?.term,
          utmContent: utm?.content,
        });

        return { success: true, stored: true };
      } catch (error) {
        console.error('Analytics tracking failed:', error);
        return { success: false, error: 'Failed to store event' };
      }
    }),

  // Track performance metrics
  trackPerformance: publicProcedure
    .input(z.object({
      configId: z.string(),
      lcp: z.number().optional(),
      fid: z.number().optional(),
      cls: z.number().optional(),
      ttfb: z.number().optional(),
      loadTime: z.number().optional(),
      userAgent: z.string().optional(),
      connection: z.string().optional(),
      viewport: z.object({
        width: z.number(),
        height: z.number(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { configId, lcp, fid, cls, ttfb, loadTime, userAgent, connection, viewport } = input;

      // If no database, just log the metrics
      if (!ctx.db) {
        console.log('Performance metrics (no DB):', { configId, lcp, fid, cls });
        return { success: true, stored: false };
      }

      try {
        await ctx.db.insert(performanceMetrics).values({
          configId,
          lcp,
          fid,
          cls: cls ? Math.round(cls * 1000) : undefined, // Store as integer
          ttfb,
          loadTime,
          userAgent,
          connection,
          viewportWidth: viewport?.width,
          viewportHeight: viewport?.height,
        });

        return { success: true, stored: true };
      } catch (error) {
        console.error('Performance tracking failed:', error);
        return { success: false, error: 'Failed to store metrics' };
      }
    }),

  // Get analytics data
  getEvents: dbProcedure
    .input(z.object({
      configId: z.string(),
      event: z.string().optional(),
      dateRange: z.object({
        from: z.date(),
        to: z.date(),
      }).optional(),
      limit: z.number().min(1).max(1000).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const { configId, event, dateRange, limit, offset } = input;

      let whereConditions = [eq(analyticsEvents.configId, configId)];

      if (event) {
        whereConditions.push(eq(analyticsEvents.event, event));
      }

      if (dateRange) {
        whereConditions.push(
          gte(analyticsEvents.timestamp, dateRange.from),
          lte(analyticsEvents.timestamp, dateRange.to)
        );
      }

      const events = await ctx.db.query.analyticsEvents.findMany({
        where: and(...whereConditions),
        limit,
        offset,
        orderBy: desc(analyticsEvents.timestamp),
      });

      return events;
    }),

  // Get performance metrics
  getPerformance: dbProcedure
    .input(z.object({
      configId: z.string(),
      dateRange: z.object({
        from: z.date(),
        to: z.date(),
      }).optional(),
      limit: z.number().min(1).max(1000).default(100),
    }))
    .query(async ({ ctx, input }) => {
      const { configId, dateRange, limit } = input;

      let whereConditions = [eq(performanceMetrics.configId, configId)];

      if (dateRange) {
        whereConditions.push(
          gte(performanceMetrics.timestamp, dateRange.from),
          lte(performanceMetrics.timestamp, dateRange.to)
        );
      }

      const metrics = await ctx.db.query.performanceMetrics.findMany({
        where: and(...whereConditions),
        limit,
        orderBy: desc(performanceMetrics.timestamp),
      });

      return metrics;
    }),

  // Get analytics summary
  getSummary: dbProcedure
    .input(z.object({
      configId: z.string(),
      dateRange: z.object({
        from: z.date(),
        to: z.date(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { configId, dateRange } = input;

      // This would typically use raw SQL for aggregations
      // For now, return a basic summary structure
      return {
        totalEvents: 0,
        uniqueUsers: 0,
        avgLCP: null,
        avgFID: null,
        avgCLS: null,
        topEvents: [],
        // TODO: Implement actual aggregations when needed
      };
    }),
});