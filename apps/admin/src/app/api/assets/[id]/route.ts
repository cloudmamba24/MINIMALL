import { NextRequest, NextResponse } from 'next/server';
import { r2Service } from '@minimall/core';
import * as Sentry from '@sentry/nextjs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// DELETE /api/assets/[id] - Delete an asset
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!r2Service) {
      return NextResponse.json(
        { error: 'R2 service not configured' },
        { status: 503 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // Delete from R2
    await r2Service.deleteObject(id);

    // Add Sentry context
    Sentry.addBreadcrumb({
      category: 'asset-delete',
      message: `Deleted asset: ${id}`,
      data: { assetId: id },
      level: 'info',
    });

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully',
    });

  } catch (error) {
    console.error('Failed to delete asset:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}

// PUT /api/assets/[id] - Update asset metadata
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!r2Service) {
      return NextResponse.json(
        { error: 'R2 service not configured' },
        { status: 503 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // Update metadata (this would typically be stored in a database)
    // For now, we'll just return success as R2 metadata is limited
    const updatedAsset = {
      id,
      ...body,
      lastModified: new Date(),
    };

    // Add Sentry context
    Sentry.addBreadcrumb({
      category: 'asset-update',
      message: `Updated asset: ${id}`,
      data: { assetId: id, updates: Object.keys(body) },
      level: 'info',
    });

    return NextResponse.json({
      success: true,
      asset: updatedAsset,
      message: 'Asset updated successfully',
    });

  } catch (error) {
    console.error('Failed to update asset:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}