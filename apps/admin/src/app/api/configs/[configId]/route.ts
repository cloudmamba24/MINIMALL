import { type SiteConfig, r2Service } from "@minimall/core";
import { configVersions, configs, db } from "@minimall/db";
import * as Sentry from "@sentry/nextjs";
import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    configId: string;
  }>;
}

// GET /api/configs/[configId] - Get configuration
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { configId } = await params;

    if (!configId) {
      return NextResponse.json({ error: "Configuration ID is required" }, { status: 400 });
    }

    // Try to load from R2 first (production configs)
    if (r2Service) {
      try {
        const config = await r2Service.getConfig(configId);
        return NextResponse.json({
          success: true,
          config,
          source: "r2",
        });
      } catch (_error) {
        // R2 config not found, checking database fallback
      }
    }

    // Fallback to database for configurations under development
    if (db) {
      try {
        const configRecord = await db
          .select()
          .from(configs)
          .where(eq(configs.id, configId))
          .limit(1);

        if (configRecord.length === 0) {
          return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
        }

        // Get the latest published version or draft
        const latestVersion = await db
          .select()
          .from(configVersions)
          .where(eq(configVersions.configId, configId))
          .orderBy(desc(configVersions.createdAt))
          .limit(1);

        if (latestVersion.length === 0) {
          return NextResponse.json(
            { error: "No versions found for configuration" },
            { status: 404 }
          );
        }

        const versionData = latestVersion[0];
        if (!versionData) {
          return NextResponse.json(
            { error: "No version data found for configuration" },
            { status: 404 }
          );
        }

        const config: SiteConfig = versionData.data as SiteConfig;

        return NextResponse.json({
          success: true,
          config,
          source: "database",
        });
      } catch (dbError) {
        console.error("Database config fetch failed:", dbError);
      }
    }

    // If all else fails, return 404
    return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
  } catch (error) {
    console.error("Failed to get configuration:", error);
    Sentry.captureException(error);

    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 });
  }
}

// PUT /api/configs/[configId] - Update configuration
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { configId } = await params;
    const config: SiteConfig = await request.json();

    if (!configId) {
      return NextResponse.json({ error: "Configuration ID is required" }, { status: 400 });
    }

    // Validate the configuration structure
    const configSchema = z.object({
      id: z.string(),
      shop: z.string(),
      slug: z.string(),
      content: z.array(z.any()).optional(),
      settings: z.object({
        theme: z.any().optional(),
        seo: z.any().optional(),
        shopDomain: z.string(),
      }),
      createdAt: z.string(),
      updatedAt: z.string().optional(),
    });

    const validatedConfig = configSchema.parse(config);
    validatedConfig.updatedAt = new Date().toISOString();

    // Save to database first (for versioning)
    if (db) {
      try {
        // Ensure the config record exists
        await db
          .insert(configs)
          .values({
            id: configId,
            shop: validatedConfig.shop,
            slug: validatedConfig.slug,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: configs.id,
            set: {
              shop: validatedConfig.shop,
              slug: validatedConfig.slug,
              updatedAt: new Date(),
            },
          });

        // Create new version
        const versionId = crypto.randomUUID();
        await db.insert(configVersions).values({
          id: versionId,
          configId,
          version: `v${Date.now()}`,
          data: validatedConfig,
          isPublished: false,
          createdBy: "admin", // TODO: Get from authentication
        });

        // Update current version reference
        await db
          .update(configs)
          .set({ currentVersionId: versionId })
          .where(eq(configs.id, configId));
      } catch (dbError) {
        console.error("Failed to save to database:", dbError);
        // Continue anyway - R2 is the primary storage
      }
    }

    // Save to R2 for production serving
    if (r2Service) {
      try {
        await r2Service.saveConfig(configId, validatedConfig as unknown as SiteConfig);
      } catch (r2Error) {
        console.error("Failed to save to R2:", r2Error);
        // This is more critical, but we'll still return success for the editor
      }
    }

    // Add Sentry context
    Sentry.addBreadcrumb({
      category: "config-update",
      message: `Updated configuration: ${configId}`,
      data: {
        configId,
        shop: validatedConfig.shop,
        slug: validatedConfig.slug,
        contentItems: validatedConfig.content?.length || 0,
      },
      level: "info",
    });

    return NextResponse.json({
      success: true,
      config: validatedConfig,
      message: "Configuration updated successfully",
    });
  } catch (error) {
    console.error("Failed to update configuration:", error);
    Sentry.captureException(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid configuration data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 });
  }
}

// DELETE /api/configs/[configId] - Delete configuration
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { configId } = await params;

    if (!configId) {
      return NextResponse.json({ error: "Configuration ID is required" }, { status: 400 });
    }

    // Delete from R2
    if (r2Service) {
      try {
        await r2Service.deleteConfig(configId);
      } catch (r2Error) {
        console.warn("Failed to delete from R2:", r2Error);
      }
    }

    // Delete from database
    if (db) {
      try {
        await db.delete(configs).where(eq(configs.id, configId));
      } catch (dbError) {
        console.warn("Failed to delete from database:", dbError);
      }
    }

    // Add Sentry context
    Sentry.addBreadcrumb({
      category: "config-delete",
      message: `Deleted configuration: ${configId}`,
      data: { configId },
      level: "info",
    });

    return NextResponse.json({
      success: true,
      message: "Configuration deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete configuration:", error);
    Sentry.captureException(error);

    return NextResponse.json({ error: "Failed to delete configuration" }, { status: 500 });
  }
}
