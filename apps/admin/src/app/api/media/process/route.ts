import { getR2Service } from "@minimall/core";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import {
  type ProcessingOptions,
  type ProcessingResult,
  processImage,
  validateImageFile,
} from "../../../../lib/image-processing";

// Ensure Node.js runtime (sharp requires Node, not Edge)
export const runtime = "nodejs";

/**
 * Image Processing API Endpoint
 *
 * Handles intelligent image processing with Sharp.js including:
 * - AI-powered cropping and format optimization
 * - Responsive variant generation
 * - Background removal and enhancement
 * - Automatic upload to R2 storage
 */

// (Deprecated) ProcessingRequest interface removed because it isn't used

export async function POST(request: NextRequest) {
  try {
    const r2Service = getR2Service();
    const formData = await request.formData();

    // Extract form data
    const imageFile = formData.get("file") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const optionsJson = formData.get("options") as string;
    const folder = (formData.get("folder") as string) || "processed";
    const filename = formData.get("filename") as string | null;
    const generateVariants = formData.get("generateVariants") === "true";
    const uploadToR2 = formData.get("uploadToR2") !== "false"; // Default true

    // Parse processing options
    let options: ProcessingOptions;
    try {
      options = optionsJson ? JSON.parse(optionsJson) : {};
    } catch (_error) {
      return NextResponse.json({ error: "Invalid options JSON" }, { status: 400 });
    }

    // Get image buffer
    let imageBuffer: Buffer;
    let originalFilename: string;

    if (imageFile) {
      imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      originalFilename = imageFile.name;
    } else if (imageUrl) {
      // Download image from URL
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        imageBuffer = Buffer.from(await response.arrayBuffer());
        originalFilename = imageUrl.split("/").pop() || "image";
      } catch (error) {
        return NextResponse.json(
          {
            error: `Failed to download image: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Either imageFile or imageUrl must be provided" },
        { status: 400 }
      );
    }

    // Validate image
    const validation = await validateImageFile(imageBuffer);
    if (!validation.valid) {
      return NextResponse.json({ error: `Invalid image: ${validation.error}` }, { status: 400 });
    }

    console.log(
      `[MediaProcess] Processing image: ${originalFilename}, Size: ${imageBuffer.length} bytes`
    );

    // Process image
    const processingOptions = {
      ...options,
      ...(generateVariants && { sizes: options.sizes || [400, 800, 1200, 1600] }),
    };
    const processingResult = await processImage(imageBuffer, processingOptions);

    console.log(
      `[MediaProcess] Processing complete in ${processingResult.metadata.processingTime}ms`
    );
    console.log(`[MediaProcess] Generated ${processingResult.variants.length} variants`);

    // Upload to R2 if requested
    let uploadResults: Array<{ url: string; key: string; variant?: string }> = [];

    if (uploadToR2 && r2Service) {
      uploadResults = await uploadProcessedImages(
        r2Service,
        processingResult,
        folder,
        filename || originalFilename
      );
    }

    // Add Sentry context
    Sentry.addBreadcrumb({
      category: "image-processing",
      message: "Image processed successfully",
      data: {
        originalSize: processingResult.metadata.originalSize,
        totalSize: processingResult.metadata.totalSize,
        compressionRatio: processingResult.metadata.compressionRatio,
        processingTime: processingResult.metadata.processingTime,
        variantCount: processingResult.variants.length,
        uploaded: uploadResults.length,
      },
      level: "info",
    });

    return NextResponse.json({
      success: true,
      processing: {
        originalSize: processingResult.metadata.originalSize,
        totalSize: processingResult.metadata.totalSize,
        compressionRatio: processingResult.metadata.compressionRatio,
        processingTime: processingResult.metadata.processingTime,
        aspectRatio: processingResult.metadata.aspectRatio,
        dominantColors: processingResult.metadata.dominantColors,
      },
      images: {
        original: {
          width: processingResult.original.width,
          height: processingResult.original.height,
          format: processingResult.original.format,
          size: processingResult.original.size,
          url: uploadResults.find((r) => !r.variant)?.url,
        },
        variants: processingResult.variants.map((variant, _index) => ({
          variant: variant.variant,
          width: variant.width,
          height: variant.height,
          format: variant.format,
          size: variant.size,
          url: uploadResults.find((r) => r.variant === variant.variant)?.url,
        })),
      },
      uploads: uploadResults,
    });
  } catch (error) {
    console.error("[MediaProcess] Processing failed:", error);

    Sentry.captureException(error, {
      tags: { operation: "image-processing" },
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Image processing failed",
      },
      { status: 500 }
    );
  }
}

/**
 * Upload processed images to R2
 */
async function uploadProcessedImages(
  r2Service: {
    putObject: (
      key: string,
      body: string | ArrayBuffer | Buffer,
      options?: { contentType?: string }
    ) => Promise<Response>;
    getObjectUrl: (key: string) => string;
  } | null,
  result: ProcessingResult,
  folder: string,
  originalFilename: string
): Promise<Array<{ url: string; key: string; variant?: string }>> {
  if (!r2Service) {
    throw new Error("R2 service not configured");
  }

  const uploads: Array<{ url: string; key: string; variant?: string }> = [];
  const timestamp = Date.now();
  const baseName = originalFilename.replace(/\.[^/.]+$/, ""); // Remove extension

  try {
    // Upload original processed image
    const originalKey = `${folder}/${timestamp}-${baseName}-original.${result.original.format}`;
    await r2Service.putObject(originalKey, result.original.buffer, {
      contentType: `image/${result.original.format}`,
    });

    uploads.push({
      url: r2Service.getObjectUrl(originalKey),
      key: originalKey,
    });

    // Upload variants
    for (const variant of result.variants) {
      const variantKey = `${folder}/${timestamp}-${baseName}-${variant.variant}.${variant.format}`;

      await r2Service.putObject(variantKey, variant.buffer, {
        contentType: `image/${variant.format}`,
      });

      uploads.push({
        url: r2Service.getObjectUrl(variantKey),
        key: variantKey,
        variant: variant.variant,
      });
    }

    console.log(`[MediaProcess] Uploaded ${uploads.length} images to R2`);
    return uploads;
  } catch (error) {
    console.error("[MediaProcess] R2 upload failed:", error);
    throw new Error(
      `Failed to upload processed images: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get processing status and preview
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("imageUrl");

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl parameter required" }, { status: 400 });
    }

    // Download and validate image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const validation = await validateImageFile(buffer);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      metadata: validation.metadata,
      fileSize: buffer.length,
      suggestedOptions: validation.metadata
        ? getSuggestedProcessingOptions(
            Object.fromEntries(
              Object.entries({
                width: validation.metadata.width,
                height: validation.metadata.height,
                density: validation.metadata.density,
              }).filter(([, value]) => value !== undefined)
            ) as { width?: number; height?: number; density?: number }
          )
        : undefined,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}

/**
 * Get suggested processing options based on image characteristics
 */
function getSuggestedProcessingOptions(metadata: {
  width?: number;
  height?: number;
  density?: number;
}): ProcessingOptions {
  const width = metadata.width ?? 1920;
  const height = metadata.height ?? 1080;
  const aspectRatio = width / height;
  const isPhoto = Boolean(metadata.density && metadata.density > 72);
  const isLarge = width > 1920 || height > 1920;

  return {
    // Suggest aspect ratio based on current ratio
    aspectRatio: aspectRatio > 1.5 ? "16:9" : aspectRatio < 0.8 ? "4:5" : "1:1",

    // Enable smart crop for photos
    smartCrop: isPhoto,

    // Auto format selection
    format: "auto",

    // Quality based on size
    quality: isLarge ? 75 : 85,

    // Generate responsive variants for large images
    sizes: isLarge ? [400, 800, 1200, 1600] : [400, 800],

    // Enable progressive for photos
    progressive: isPhoto,

    // Strip EXIF for privacy
    stripExif: true,

    // Enhance photos
    enhance: isPhoto,
  };
}
