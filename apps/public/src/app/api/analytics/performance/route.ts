import { logger } from "@minimall/core/server";
import { db, performanceMetrics } from "@minimall/db";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const performanceMetricSchema = z.object({
  configId: z.string().optional(),
  metric: z.enum(["LCP", "FID", "CLS", "FCP", "TTFB"]),
  value: z.number(),
  rating: z.enum(["good", "needs-improvement", "poor"]),
  delta: z.number(),
  id: z.string(),
  navigationType: z.string(),
  timestamp: z.string(),
  url: z.string(),
  userAgent: z.string().optional(),
  connection: z.string().optional(),
  viewport: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});

function parseAllowedOrigins(): string[] {
  const raw = process.env.ANALYTICS_ALLOWED_ORIGINS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildCorsHeaders(origin: string | null, allowedOrigins: string[]): HeadersInit {
  if (allowedOrigins.length === 0) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }
  const allowed = origin && allowedOrigins.includes(origin);
  return allowed
    ? {
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    : {};
}

export async function POST(request: NextRequest) {
  try {
    const allowedOrigins = parseAllowedOrigins();
    const origin = request.headers.get("origin");
    if (allowedOrigins.length > 0 && (!origin || !allowedOrigins.includes(origin))) {
      return new NextResponse("Forbidden", {
        status: 403,
        headers: buildCorsHeaders(origin, allowedOrigins),
      });
    }
    const body = await request.json();
    const data = performanceMetricSchema.parse(body);

    // Add Sentry context
    await Sentry.withScope(async (scope) => {
      scope.setTag("metric_type", data.metric);
      scope.setTag("metric_rating", data.rating);
      scope.setContext("performance_metric", {
        metric: data.metric,
        value: data.value,
        rating: data.rating,
        configId: data.configId,
        url: data.url,
      });

      // Log in debug/dev only
      logger.debug(`Performance Metric: ${data.metric} = ${data.value}ms (${data.rating})`, {
        configId: data.configId,
        url: data.url,
        timestamp: data.timestamp,
      });

      // Save to database
      if (db && data.configId) {
        try {
          const metricData = {
            configId: data.configId,
            timestamp: new Date(data.timestamp),
            userAgent: data.userAgent || null,
            connection: data.connection || null,
            viewportWidth: data.viewport?.width || null,
            viewportHeight: data.viewport?.height || null,
            lcp: null as number | null,
            fid: null as number | null,
            cls: null as number | null,
            ttfb: null as number | null,
            loadTime: null as number | null,
          };

          // Set the specific metric field based on the metric type
          switch (data.metric) {
            case "LCP":
              metricData.lcp = Math.round(data.value);
              break;
            case "FID":
              metricData.fid = Math.round(data.value);
              break;
            case "CLS":
              metricData.cls = Math.round(data.value * 1000); // Store CLS * 1000 as integer
              break;
            case "TTFB":
              metricData.ttfb = Math.round(data.value);
              break;
            case "FCP":
              // FCP doesn't have its own field in the schema, but we can add it to TTFB or extend schema
              metricData.ttfb = Math.round(data.value);
              break;
          }

          await db.insert(performanceMetrics).values(metricData);
        } catch (dbError) {
          console.warn("Failed to save performance metric to database:", dbError);
          Sentry.captureException(dbError);
        }
      }

      // Send poor metrics to Sentry as warnings
      if (data.rating === "poor") {
        Sentry.captureMessage(
          `Poor Web Vital: ${data.metric} = ${data.value}ms on ${data.configId || "unknown"}`,
          "warning"
        );
      }
    });

    return NextResponse.json(
      { success: true },
      {
        headers: buildCorsHeaders(origin, allowedOrigins),
      }
    );
  } catch (error) {
    console.error("Failed to process performance metric:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Failed to process performance metric" }, { status: 400 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  const allowedOrigins = parseAllowedOrigins();
  const origin = request.headers.get("origin");
  const headers = buildCorsHeaders(origin, allowedOrigins);
  if (allowedOrigins.length > 0 && (!origin || !allowedOrigins.includes(origin))) {
    return new NextResponse(null, { status: 204, headers });
  }
  return new NextResponse(null, { status: 200, headers });
}
