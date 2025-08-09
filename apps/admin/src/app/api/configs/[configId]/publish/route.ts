import { NextRequest, NextResponse } from 'next/server';
import { r2Service, type SiteConfig } from '@minimall/core';
import { db, configs, configVersions } from '@minimall/db';
import { eq, and, desc } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';

interface RouteParams {
  params: Promise<{
    configId: string;
  }>;
}

// POST /api/configs/[configId]/publish - Publish configuration
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { configId } = await params;

    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Get the current draft version
    const currentVersion = await db
      .select()
      .from(configVersions)
      .where(
        and(
          eq(configVersions.configId, configId),
          eq(configVersions.isPublished, false)
        )
      )
      .orderBy(desc(configVersions.createdAt))
      .limit(1);

    if (currentVersion.length === 0) {
      return NextResponse.json(
        { error: 'No draft version found to publish' },
        { status: 404 }
      );
    }

    const versionToPublish = currentVersion[0];
    if (!versionToPublish) {
      return NextResponse.json(
        { error: 'No draft version found to publish' },
        { status: 404 }
      );
    }

    // Mark the version as published
    await db
      .update(configVersions)
      .set({
        isPublished: true,
        publishedAt: new Date(),
      })
      .where(eq(configVersions.id, versionToPublish.id));

    // Unpublish any other versions for this config
    await db
      .update(configVersions)
      .set({
        isPublished: false,
        publishedAt: null,
      })
      .where(
        and(
          eq(configVersions.configId, configId),
          eq(configVersions.isPublished, true),
          // Don't unpublish the version we just published
          // Note: This is a bit of a race condition, but acceptable for now
        )
      );

    // Re-mark our version as published (in case it was caught by the above)
    await db
      .update(configVersions)
      .set({
        isPublished: true,
        publishedAt: new Date(),
      })
      .where(eq(configVersions.id, versionToPublish.id));

    // Publish to R2 for production serving
    if (r2Service) {
      try {
        const config = versionToPublish.data as SiteConfig;
        await r2Service.saveConfig(configId, config);
        
        // Config successfully published to R2
      } catch (r2Error) {
        console.error('Failed to publish to R2:', r2Error);
        
        // Rollback database changes if R2 publish fails
        await db
          .update(configVersions)
          .set({
            isPublished: false,
            publishedAt: null,
          })
          .where(eq(configVersions.id, versionToPublish.id));

        return NextResponse.json(
          { error: 'Failed to publish to production storage' },
          { status: 500 }
        );
      }
    }

    // Add Sentry context
    Sentry.addBreadcrumb({
      category: 'config-publish',
      message: `Published configuration: ${configId}`,
      data: {
        configId,
        versionId: versionToPublish.id,
        version: versionToPublish.version,
      },
      level: 'info',
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration published successfully',
      version: versionToPublish.version,
      publishedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to publish configuration:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'Failed to publish configuration' },
      { status: 500 }
    );
  }
}