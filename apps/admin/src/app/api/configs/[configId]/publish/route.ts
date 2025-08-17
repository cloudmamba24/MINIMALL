import { type SiteConfig, edgeCache, getR2Service } from "@minimall/core";
import { configVersions, configs, db } from "@minimall/db";
import * as Sentry from "@sentry/nextjs";
import { and, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    configId: string;
  }>;
}

// POST /api/configs/[configId]/publish - Publish configuration
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { configId } = await params;

    if (!configId) {
      return NextResponse.json({ error: "Configuration ID is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    // Get the current draft version
    const currentVersion = await db
      .select()
      .from(configVersions)
      .where(and(eq(configVersions.configId, configId), eq(configVersions.isPublished, false)))
      .orderBy(desc(configVersions.createdAt))
      .limit(1);

    if (currentVersion.length === 0) {
      return NextResponse.json({ error: "No draft version found to publish" }, { status: 404 });
    }

    const versionToPublish = currentVersion[0];
    if (!versionToPublish) {
      return NextResponse.json({ error: "No draft version found to publish" }, { status: 404 });
    }

    // Use atomic transaction to avoid race conditions
    const publishedVersion = await db.transaction(async (tx) => {
      const publishedAt = new Date();

      // First, unpublish all existing versions for this config
      await tx
        .update(configVersions)
        .set({
          isPublished: false,
          publishedAt: null,
        })
        .where(and(eq(configVersions.configId, configId), eq(configVersions.isPublished, true)));

      // Then publish the specific version (atomic operation)
      const [published] = await tx
        .update(configVersions)
        .set({
          isPublished: true,
          publishedAt,
        })
        .where(eq(configVersions.id, versionToPublish.id))
        .returning();

      if (!published) {
        throw new Error("Failed to publish configuration version");
      }

      return published;
    });

    // Publish to R2 for production serving
    const r2Service = getR2Service();
    if (r2Service) {
      try {
        const config = publishedVersion.data as SiteConfig;
        await r2Service.saveConfig(configId, config);
      } catch (r2Error) {
        console.error("Failed to publish to R2:", r2Error);

        // Rollback database changes if R2 publish fails (atomic rollback)
        await db
          .update(configVersions)
          .set({
            isPublished: false,
            publishedAt: null,
          })
          .where(eq(configVersions.id, publishedVersion.id));

        return NextResponse.json(
          { error: "Failed to publish to production storage" },
          { status: 500 }
        );
      }
    } else {
      console.warn("R2 service not available - config published to database only");
    }

    // Invalidate edge cache for published config
    const tagsToInvalidate = [`config:${configId}`, `config:${configId}:published`];
    const _invalidatedCount = edgeCache.invalidateByTags(tagsToInvalidate);
    // Log cache invalidation for monitoring

    // Trigger cache invalidation on the public app
    try {
      const { getPublicUrl } = await import("@minimall/core/config");
      const publicAppUrl = process.env.NEXT_PUBLIC_BASE_URL || getPublicUrl();
      const revalidateResponse = await fetch(`${publicAppUrl}/api/config/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN || "dev-token"}`,
        },
        body: JSON.stringify({ configId }),
      });

      if (!revalidateResponse.ok) {
        const { handleError } = await import("@minimall/core/error-handler");
        handleError(new Error(`Cache invalidation failed: ${await revalidateResponse.text()}`), {
          component: "config-publish",
          action: "cache-invalidation",
        });
        // Don't fail the publish if cache invalidation fails
      } else {
        console.log(`Cache invalidated successfully for config: ${configId}`);
      }
    } catch (cacheError) {
      console.warn("Cache invalidation request failed:", cacheError);
      // Don't fail the publish if cache invalidation fails
    }

    // Add Sentry context
    Sentry.addBreadcrumb({
      category: "config-publish",
      message: `Published configuration: ${configId}`,
      data: {
        configId,
        versionId: publishedVersion.id,
        version: publishedVersion.version,
      },
      level: "info",
    });

    return NextResponse.json({
      success: true,
      message: "Configuration published successfully",
      version: publishedVersion.version,
      publishedAt: publishedVersion.publishedAt?.toISOString(),
    });
  } catch (error) {
    console.error("Failed to publish configuration:", error);
    Sentry.captureException(error);

    return NextResponse.json({ error: "Failed to publish configuration" }, { status: 500 });
  }
}
