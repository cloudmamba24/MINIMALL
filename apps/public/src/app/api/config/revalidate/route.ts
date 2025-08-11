import * as Sentry from "@sentry/nextjs";
import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

interface RevalidateRequest {
  configId?: string;
  paths?: string[];
  tags?: string[];
}

/**
 * POST /api/config/revalidate - Invalidate Edge Cache
 *
 * This endpoint handles cache invalidation for configuration changes.
 * It clears both Next.js cache and any edge cache keys.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request authorization (basic internal API protection)
    const authHeader = request.headers.get("Authorization");
    const expectedToken = process.env.INTERNAL_API_TOKEN || "dev-token";

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as RevalidateRequest;
    const { configId, paths, tags } = body;

    // Default revalidation targets if configId provided
    const revalidationPaths = paths || (configId ? [`/g/${configId}`, `/g/${configId}/`] : []);

    const revalidationTags =
      tags ||
      (configId
        ? [`config:${configId}`, `config:${configId}:current`, `config:${configId}:published`]
        : []);

    const results: { type: string; target: string; success: boolean; error?: string }[] = [];

    // Revalidate specific paths
    for (const path of revalidationPaths) {
      try {
        revalidatePath(path);
        results.push({ type: "path", target: path, success: true });
      } catch (error) {
        console.error(`Failed to revalidate path ${path}:`, error);
        results.push({
          type: "path",
          target: path,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Revalidate cache tags
    for (const tag of revalidationTags) {
      try {
        revalidateTag(tag);
        results.push({ type: "tag", target: tag, success: true });
      } catch (error) {
        console.error(`Failed to revalidate tag ${tag}:`, error);
        results.push({
          type: "tag",
          target: tag,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Log to Sentry for monitoring
    Sentry.addBreadcrumb({
      category: "cache-revalidation",
      message: `Cache revalidated for config: ${configId}`,
      data: {
        configId,
        pathsCount: revalidationPaths.length,
        tagsCount: revalidationTags.length,
        successCount: results.filter((r) => r.success).length,
        failureCount: results.filter((r) => !r.success).length,
      },
      level: "info",
    });

    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: true,
      message: `Cache revalidation completed: ${successCount}/${totalCount} successful`,
      results,
      summary: {
        configId,
        pathsRevalidated: revalidationPaths,
        tagsRevalidated: revalidationTags,
        successCount,
        failureCount: totalCount - successCount,
      },
    });
  } catch (error) {
    console.error("Cache revalidation failed:", error);
    Sentry.captureException(error);

    return NextResponse.json(
      {
        success: false,
        error: "Cache revalidation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/config/revalidate - Get revalidation status/health
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Cache revalidation endpoint is healthy",
    endpoints: {
      revalidate: "POST /api/config/revalidate",
    },
    supportedActions: [
      "Revalidate specific config paths",
      "Clear cache tags",
      "Bulk path revalidation",
    ],
  });
}
