import { configVersions, configs, db } from "@minimall/db";
import * as Sentry from "@sentry/nextjs";
import { and, eq, gte, lte } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Vercel Cron Job Handler for Scheduled Publishing
 *
 * This endpoint is called every 15 minutes by Vercel Cron to check for
 * and publish any scheduled configs that are ready to go live.
 *
 * Configuration: Add to vercel.json
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/publish",
 *       "schedule": "every 15 minutes"
 *     }
 *   ]
 * }
 */

interface ScheduledVersion {
  id: string;
  configId: string;
  data: unknown;
  scheduledAt: Date | null;
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    const urlToken = request.nextUrl.searchParams.get("token");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.warn("CRON_SECRET not configured - skipping auth check");
    } else if (authHeader !== `Bearer ${cronSecret}` && urlToken !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    console.log(`[Cron] Starting scheduled publish check at ${now.toISOString()}`);

    // Find all scheduled versions that are ready to publish
    // Look for versions scheduled within the last 15 minutes to handle missed runs
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    if (!db) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 503 });
    }

    const scheduledVersions = await db
      .select({
        id: configVersions.id,
        configId: configVersions.configId,
        data: configVersions.data,
        scheduledAt: configVersions.scheduledAt,
      })
      .from(configVersions)
      .where(
        and(
          lte(configVersions.scheduledAt, now),
          gte(configVersions.scheduledAt, fifteenMinutesAgo),
          // Only get versions that haven't been published yet
          eq(configVersions.isPublished, false)
        )
      )
      .limit(50); // Limit to prevent overload

    if (scheduledVersions.length === 0) {
      console.log("[Cron] No scheduled versions found");
      return NextResponse.json({
        success: true,
        published: 0,
        message: "No scheduled versions to publish",
      });
    }

    console.log(`[Cron] Found ${scheduledVersions.length} versions to publish`);

    const results = {
      published: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each scheduled version
    for (const version of scheduledVersions) {
      try {
        await publishScheduledVersion(version);
        results.published++;

        console.log(
          `[Cron] Successfully published version ${version.id} for config ${version.configId}`
        );

        // Add success tracking to Sentry
        Sentry.addBreadcrumb({
          category: "cron-publish",
          message: "Published scheduled version",
          data: {
            versionId: version.id,
            configId: version.configId,
            scheduledAt: version.scheduledAt?.toISOString(),
          },
          level: "info",
        });
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Version ${version.id}: ${errorMessage}`);

        console.error(`[Cron] Failed to publish version ${version.id}:`, error);

        // Track failure in Sentry
        Sentry.captureException(error, {
          tags: {
            operation: "cron-publish",
            versionId: version.id,
            configId: version.configId,
          },
          extra: {
            scheduledAt: version.scheduledAt?.toISOString(),
          },
        });

        // Log the error (no status/metadata fields in schema to update)
        console.error(`[Cron] Version ${version.id} failed to publish:`, errorMessage);
      }
    }

    console.log(`[Cron] Completed: ${results.published} published, ${results.failed} failed`);

    // Send summary to Sentry for monitoring
    if (results.published > 0 || results.failed > 0) {
      Sentry.addBreadcrumb({
        category: "cron-summary",
        message: "Cron job completed",
        data: {
          published: results.published,
          failed: results.failed,
          totalScheduled: scheduledVersions.length,
        },
        level: results.failed > 0 ? "warning" : "info",
      });
    }

    return NextResponse.json({
      success: true,
      published: results.published,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
      message: `Published ${results.published} of ${scheduledVersions.length} scheduled versions`,
    });
  } catch (error) {
    console.error("[Cron] Critical error in scheduled publish:", error);

    Sentry.captureException(error, {
      tags: { operation: "cron-publish-critical" },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Critical error in scheduled publishing",
        published: 0,
        failed: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * Publish a single scheduled version
 */
async function publishScheduledVersion(version: ScheduledVersion): Promise<void> {
  const { id: versionId, configId } = version;

  if (!db) {
    throw new Error("Database connection not available");
  }

  // Start transaction for atomic publishing
  await db.transaction(async (tx) => {
    // Update the config to point to this version as current
    await tx
      .update(configs)
      .set({
        currentVersionId: versionId,
        updatedAt: new Date(),
      })
      .where(eq(configs.id, configId));

    // Mark the version as published
    await tx
      .update(configVersions)
      .set({
        isPublished: true,
        publishedAt: new Date(),
      })
      .where(eq(configVersions.id, versionId));
  });

  // Trigger cache invalidation
  await invalidateConfigCache(configId);
}

/**
 * Invalidate cache for the published config
 */
async function invalidateConfigCache(configId: string): Promise<void> {
  try {
    // Call the cache invalidation endpoint
    const { getAdminUrl } = await import("@minimall/core/config");
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || getAdminUrl();

    const response = await fetch(`${baseUrl}/api/config/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({
        configId,
        source: "scheduled-publish",
      }),
    });

    if (!response.ok) {
      console.warn(`Cache invalidation failed for config ${configId}: ${response.statusText}`);
      // Don't throw error - cache invalidation failure shouldn't fail the publish
    } else {
      console.log(`Cache invalidated for config ${configId}`);
    }
  } catch (error) {
    console.warn(`Cache invalidation error for config ${configId}:`, error);
    // Don't throw - cache invalidation is best effort
  }
}

// Allow GET for testing/health checks
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const urlToken = request.nextUrl.searchParams.get("token");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && urlToken !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Health check - return info about scheduled versions
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const now = new Date();
    const upcomingCount = await db
      .select()
      .from(configVersions)
      .where(
        and(
          eq(configVersions.isPublished, false),
          lte(configVersions.scheduledAt, new Date(now.getTime() + 24 * 60 * 60 * 1000)) // Next 24 hours
        )
      );

    return NextResponse.json({
      status: "healthy",
      timestamp: now.toISOString(),
      upcomingScheduled: upcomingCount.length,
      message: "Cron endpoint is ready",
    });
  } catch (_error) {
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to check scheduled versions",
      },
      { status: 500 }
    );
  }
}
