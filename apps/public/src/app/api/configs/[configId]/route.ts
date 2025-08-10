import { NextRequest, NextResponse } from 'next/server';
import { db } from '@minimall/db';
import { configs, configVersions } from '@minimall/db';
import { eq, and, desc } from 'drizzle-orm';
import { getR2Service } from '@minimall/core/server';

// GET /api/configs/[configId] - Get configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params;

    if (!db) {
      // Fallback to demo data if no database
      const demoConfig = await import('@minimall/core/demo-data').then(m => m.demoSiteConfig);
      return NextResponse.json(demoConfig);
    }

    // Try to get from database first
    const config = await db.query.configs.findFirst({
      where: eq(configs.id, configId),
      with: {
        currentVersion: true,
      },
    });

    if (!config?.currentVersion) {
      // Try R2 storage as fallback
      try {
        const r2Service = getR2Service();
        const r2Config = await r2Service.getConfig(configId);
        return NextResponse.json(r2Config);
      } catch (r2Error) {
        // Final fallback to demo data
        console.warn(`Config ${configId} not found in DB or R2, using demo data`);
        const demoConfig = await import('@minimall/core/demo-data').then(m => m.demoSiteConfig);
        return NextResponse.json(demoConfig);
      }
    }

    return NextResponse.json(config.currentVersion.data);

  } catch (error) {
    console.error('Config fetch error:', error);
    
    // Fallback to demo data on any error
    const demoConfig = await import('@minimall/core/demo-data').then(m => m.demoSiteConfig);
    return NextResponse.json(demoConfig);
  }
}

// PUT /api/configs/[configId] - Update configuration  
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params;
    const data = await request.json();

    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    // Create or update config in database
    const existingConfig = await db.query.configs.findFirst({
      where: eq(configs.id, configId),
    });

    if (!existingConfig) {
      // Create new config
      await db.insert(configs).values({
        id: configId,
        shop: data.shop || 'demo',
        slug: configId,
      });
    }

    // Create new version
    const newVersion = await db.insert(configVersions).values({
      configId,
      version: `v${Date.now()}`,
      data,
      isPublished: true,
      createdBy: 'admin',
      publishedAt: new Date(),
    }).returning();

    // Update current version reference
    if (newVersion[0]) {
      await db.update(configs)
        .set({ currentVersionId: newVersion[0].id })
        .where(eq(configs.id, configId));
    }

    // Also save to R2 as backup
    try {
      const r2Service = getR2Service();
      await r2Service.saveConfig(configId, data);
    } catch (r2Error) {
      console.warn('R2 backup failed:', r2Error);
      // Continue without R2 - database is primary
    }

    return NextResponse.json({ success: true, version: newVersion[0] });

  } catch (error) {
    console.error('Config save error:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}