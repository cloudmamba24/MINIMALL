import {
  CacheKeys,
  analyticsEvents,
  cachedQuery,
  db,
  performanceMetrics,
  withQueryMonitoring,
} from "@minimall/db";
import * as Sentry from "@sentry/nextjs";
import { type SQL, and, desc, eq, gte, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const analyticsRequestSchema = z.object({
  configId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timeframe: z.enum(["1h", "24h", "7d", "30d"]).optional().default("24h"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = analyticsRequestSchema.parse({
      configId: searchParams.get("configId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      timeframe: searchParams.get("timeframe") || "24h",
    });

    if (!db) {
      // Return mock data when database is not available (for demo purposes)
      return NextResponse.json({
        success: true,
        data: {
          timeframe: {
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
            duration: params.timeframe,
          },
          performance: {
            metrics: [
              {
                id: "mock-1",
                configId: "demo",
                lcp: 1200,
                fid: 15,
                cls: 0.05,
                ttfb: 150,
                loadTime: 850,
                timestamp: new Date(),
                userAgent: "Mock User Agent",
                connection: "4g",
                viewportWidth: 1920,
                viewportHeight: 1080,
              },
            ],
            aggregates: {
              avgLcp: 1200,
              avgFid: 15,
              avgCls: 0.05,
              avgTtfb: 150,
              totalMetrics: 1,
            },
          },
          analytics: {
            events: [
              {
                id: "mock-event-1",
                event: "page_view",
                configId: "demo",
                sessionId: "mock-session-1",
                properties: "{}",
                timestamp: new Date(),
                userAgent: "Mock User Agent",
                referrer: "https://instagram.com",
                utmSource: "instagram",
                utmMedium: "social",
                utmCampaign: "demo",
              },
            ],
            eventCounts: {
              page_view: 25,
              product_click: 12,
              add_to_cart: 5,
            },
            uniqueSessions: 18,
            totalEvents: 42,
          },
          _note:
            "This is mock data. Configure DATABASE_URL environment variable for real analytics.",
        },
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    if (params.startDate) {
      startDate = new Date(params.startDate);
    } else {
      switch (params.timeframe) {
        case "1h":
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    const endDate = params.endDate ? new Date(params.endDate) : now;

    // Build base conditions (fix the date range filter bug)
    const baseConditions: SQL[] = [];
    if (params.configId) {
      baseConditions.push(eq(performanceMetrics.configId, params.configId));
    }
    baseConditions.push(gte(performanceMetrics.timestamp, startDate));
    // Fixed: should use lte for end date, not gte
    if (endDate < now) {
      baseConditions.push(sql`${performanceMetrics.timestamp} <= ${endDate}`);
    }

    const analyticsConditions: SQL[] = [];
    if (params.configId) {
      analyticsConditions.push(eq(analyticsEvents.configId, params.configId));
    }
    analyticsConditions.push(gte(analyticsEvents.timestamp, startDate));
    // Fixed: should use lte for end date, not gte
    if (endDate < now) {
      analyticsConditions.push(sql`${analyticsEvents.timestamp} <= ${endDate}`);
    }

    // Create cache key for this specific query
    const cacheKey = CacheKeys.analytics(
      params.configId,
      params.timeframe,
      startDate.toISOString(),
      endDate.toISOString()
    );

    // Execute all queries with caching and monitoring (cache for 2 minutes for analytics data)
    const analyticsData = await cachedQuery(
      cacheKey,
      async () => {
        if (!db) {
          throw new Error("Database not available");
        }

        const [performanceData, performanceAggregates, eventsData, eventAggregates] =
          await Promise.all([
            // Fetch recent performance metrics for display
            withQueryMonitoring(
              () =>
                db
                  ?.select({
                    id: performanceMetrics.id,
                    configId: performanceMetrics.configId,
                    lcp: performanceMetrics.lcp,
                    fid: performanceMetrics.fid,
                    cls: performanceMetrics.cls,
                    ttfb: performanceMetrics.ttfb,
                    loadTime: performanceMetrics.loadTime,
                    timestamp: performanceMetrics.timestamp,
                    userAgent: performanceMetrics.userAgent,
                    connection: performanceMetrics.connection,
                    viewportWidth: performanceMetrics.viewportWidth,
                    viewportHeight: performanceMetrics.viewportHeight,
                  })
                  .from(performanceMetrics)
                  .where(baseConditions.length > 0 ? and(...baseConditions) : sql`TRUE`)
                  .orderBy(desc(performanceMetrics.timestamp))
                  .limit(1000),
              "fetch_performance_metrics",
              [params.configId, params.timeframe]
            ),

            // Database aggregation for performance metrics (much more efficient)
            withQueryMonitoring(
              () =>
                db
                  ?.select({
                    avgLcp: sql<number>`COALESCE(AVG(${performanceMetrics.lcp}), 0)`,
                    avgFid: sql<number>`COALESCE(AVG(${performanceMetrics.fid}), 0)`,
                    avgCls: sql<number>`COALESCE(AVG(${performanceMetrics.cls}), 0)`,
                    avgTtfb: sql<number>`COALESCE(AVG(${performanceMetrics.ttfb}), 0)`,
                    totalMetrics: sql<number>`COUNT(*)`,
                  })
                  .from(performanceMetrics)
                  .where(baseConditions.length > 0 ? and(...baseConditions) : sql`TRUE`),
              "aggregate_performance_metrics",
              [params.configId, params.timeframe]
            ),

            // Fetch recent analytics events for display
            withQueryMonitoring(
              () =>
                db
                  ?.select({
                    id: analyticsEvents.id,
                    event: analyticsEvents.event,
                    configId: analyticsEvents.configId,
                    sessionId: analyticsEvents.sessionId,
                    properties: analyticsEvents.properties,
                    timestamp: analyticsEvents.timestamp,
                    userAgent: analyticsEvents.userAgent,
                    referrer: analyticsEvents.referrer,
                    utmSource: analyticsEvents.utmSource,
                    utmMedium: analyticsEvents.utmMedium,
                    utmCampaign: analyticsEvents.utmCampaign,
                  })
                  .from(analyticsEvents)
                  .where(analyticsConditions.length > 0 ? and(...analyticsConditions) : sql`TRUE`)
                  .orderBy(desc(analyticsEvents.timestamp))
                  .limit(1000),
              "fetch_analytics_events",
              [params.configId, params.timeframe]
            ),

            // Database aggregation for analytics events (much more efficient)
            withQueryMonitoring(
              () =>
                db
                  ?.select({
                    event: analyticsEvents.event,
                    eventCount: sql<number>`COUNT(*)`,
                    uniqueSessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
                  })
                  .from(analyticsEvents)
                  .where(analyticsConditions.length > 0 ? and(...analyticsConditions) : sql`TRUE`)
                  .groupBy(analyticsEvents.event),
              "aggregate_analytics_events",
              [params.configId, params.timeframe]
            ),
          ]);

        return { performanceData, performanceAggregates, eventsData, eventAggregates };
      },
      120000 // 2 minute cache TTL for analytics data
    );

    // Destructure cached data
    const { performanceData, performanceAggregates, eventsData, eventAggregates } = analyticsData;

    // Convert event aggregates to the expected format
    const eventCounts = eventAggregates.reduce(
      (acc, { event, eventCount }) => {
        acc[event] = eventCount;
        return acc;
      },
      {} as Record<string, number>
    );

    const uniqueSessions = eventAggregates.reduce(
      (total, { uniqueSessions }) => total + uniqueSessions,
      0
    );
    const totalEvents = eventAggregates.reduce((total, { eventCount }) => total + eventCount, 0);

    return NextResponse.json({
      success: true,
      data: {
        timeframe: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          duration: params.timeframe,
        },
        performance: {
          metrics: performanceData,
          aggregates: performanceAggregates[0], // Use the database aggregation result
        },
        analytics: {
          events: eventsData,
          eventCounts,
          uniqueSessions,
          totalEvents,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics data:", error);
    Sentry.captureException(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
