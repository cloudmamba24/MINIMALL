import { logger } from "@minimall/core/server";
import { analyticsEvents, db } from "@minimall/db";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Detect device type from user agent
 */
function detectDevice(userAgent: string | null): "mobile" | "tablet" | "desktop" {
  if (!userAgent) return "desktop";

  const ua = userAgent.toLowerCase();

  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return "mobile";
  }

  if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet";
  }

  return "desktop";
}

const analyticsEventSchema = z.object({
  event: z.string(),
  configId: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string(),
  properties: z.record(z.any()).default({}),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  timestamp: z.string().optional(),
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
    const data = analyticsEventSchema.parse(body);

    // Add Sentry context
    Sentry.addBreadcrumb({
      category: "analytics",
      message: `Event: ${data.event}`,
      data: {
        event: data.event,
        configId: data.configId,
        sessionId: data.sessionId,
        properties: data.properties,
      },
      level: "info",
    });

    // Track specific events with Sentry
    if (
      data.event.startsWith("rum_javascript_error") ||
      data.event.startsWith("rum_unhandled_rejection")
    ) {
      Sentry.captureMessage(`RUM Error: ${data.event}`, "warning");
    }

    // Log analytics events only in debug/dev
    logger.debug(`Analytics Event: ${data.event}`, {
      configId: data.configId,
      sessionId: data.sessionId,
      properties: data.properties,
    });

    // Save to database
    if (!db) {
      console.error("[Analytics] Database not available - events will be lost");
      // Still return success to not break client tracking, but log the issue
      Sentry.captureMessage("Analytics database unavailable", "warning");
    } else {
      try {
        await db.insert(analyticsEvents).values({
          event: data.event,
          configId: data.configId || "unknown",
          userId: data.userId,
          sessionId: data.sessionId,
          device: detectDevice(request.headers.get("user-agent")), // Required field
          properties: data.properties,
          userAgent: data.userAgent || request.headers.get("user-agent"),
          referrer: data.referrer || request.headers.get("referer"),
          utmSource: data.utmSource,
          utmMedium: data.utmMedium,
          utmCampaign: data.utmCampaign,
          utmTerm: data.utmTerm,
          utmContent: data.utmContent,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        });
      } catch (dbError) {
        console.error("[Analytics] Failed to save event:", dbError);
        Sentry.captureException(dbError, {
          tags: { component: "analytics-events" },
          extra: { event: data.event, configId: data.configId }
        });
        // Don't fail the request - analytics shouldn't break the app
      }
    }

    return NextResponse.json(
      { success: true },
      {
        headers: buildCorsHeaders(origin, allowedOrigins),
      }
    );
  } catch (error) {
    console.error("Failed to process analytics event:", error);
    Sentry.captureException(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid event data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to process analytics event" }, { status: 500 });
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
