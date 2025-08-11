import { analyticsEvents, db } from "@minimall/db";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@minimall/core/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const customMetricSchema = z.object({
  name: z.string(),
  duration: z.number(),
  timestamp: z.string(),
  url: z.string(),
  configId: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
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
    const data = customMetricSchema.parse(body);

    // Add Sentry context
    await Sentry.withScope(async (scope) => {
      scope.setTag("custom_metric", data.name);
      scope.setContext("custom_metric", {
        name: data.name,
        duration: data.duration,
        configId: data.configId,
        url: data.url,
      });

      // Log custom metrics in debug/dev only
      logger.debug(`Custom Metric: ${data.name} = ${data.duration}ms`, {
        configId: data.configId,
        url: data.url,
        timestamp: data.timestamp,
      });

      // Add breadcrumb for Sentry
      Sentry.addBreadcrumb({
        category: "custom-metric",
        message: `${data.name}: ${data.duration}ms`,
        data: {
          name: data.name,
          duration: data.duration,
          configId: data.configId,
        },
        level: "info",
      });

      // Save to database using analytics events table
      if (db) {
        try {
          await db.insert(analyticsEvents).values({
            event: "custom_metric",
            configId: data.configId || "unknown",
            sessionId: data.sessionId || `session_${Date.now()}`,
            userId: data.userId,
            device: "unknown", // Required field
            properties: {
              metricName: data.name,
              duration: data.duration,
              url: data.url,
            },
            timestamp: new Date(data.timestamp),
          });
        } catch (dbError) {
          console.warn("Failed to save custom metric to database:", dbError);
          Sentry.captureException(dbError);
        }
      }
    });

    return NextResponse.json({ success: true }, {
      headers: buildCorsHeaders(origin, allowedOrigins),
    });
  } catch (error) {
    console.error("Failed to process custom metric:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Failed to process custom metric" }, { status: 400 });
  }
}

export async function OPTIONS(request: NextRequest) {
  const allowedOrigins = parseAllowedOrigins();
  const origin = request.headers.get("origin");
  const headers = buildCorsHeaders(origin, allowedOrigins);
  if (allowedOrigins.length > 0 && (!origin || !allowedOrigins.includes(origin))) {
    return new NextResponse(null, { status: 204, headers });
  }
  return new NextResponse(null, { status: 200, headers });
}
