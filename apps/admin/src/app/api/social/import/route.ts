import { getR2Service } from "@minimall/core";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import {
  extractSocialMediaContent,
  downloadMediaFromUrl,
  validateSocialMediaUrl,
  type SocialMediaPost,
} from "../../../../lib/social-extractors";

/**
 * Social Media Import API Endpoint
 * 
 * Handles importing content from social media platforms:
 * - Extract post metadata and media URLs
 * - Download media content with proper handling
 * - Upload to R2 storage with metadata
 * - Generate asset records for the admin interface
 */

interface ImportRequest {
  url: string;
  folder?: string;
  generateTags?: boolean;
  downloadMedia?: boolean;
  processImages?: boolean;
}

interface ImportResult {
  success: boolean;
  post?: SocialMediaPost;
  assets?: Array<{
    id: string;
    url: string;
    type: "image" | "video";
    filename: string;
    size: number;
    metadata: Record<string, any>;
  }>;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const r2Service = getR2Service();
    const body = await request.json() as ImportRequest;
    const { url, folder = "social-imports", generateTags = true, downloadMedia = true, processImages = false } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }
    
    // Validate social media URL
    const urlValidation = validateSocialMediaUrl(url);
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error || "Invalid social media URL" },
        { status: 400 }
      );
    }
    
    // Import from social media platform
    
    // Extract social media content
    const extractionResult = await extractSocialMediaContent(url);
    if (!extractionResult.success || !extractionResult.post) {
      return NextResponse.json(
        { error: extractionResult.error || "Failed to extract content" },
        { status: 400 }
      );
    }
    
    const post = extractionResult.post;
    // Extracted media items for processing
    
    // Download and upload media if requested
    let assets: ImportResult["assets"] = [];
    
    if (downloadMedia && r2Service) {
      assets = await downloadAndUploadMedia(r2Service, post, folder, processImages);
    }
    
    // Add Sentry tracking
    Sentry.addBreadcrumb({
      category: "social-import",
      message: `Imported content from ${post.platform}`,
      data: {
        platform: post.platform,
        mediaCount: post.media.length,
        assetsUploaded: assets.length,
        author: post.author.username,
        hashtags: post.hashtags,
      },
      level: "info",
    });
    
    const result: ImportResult = {
      success: true,
      post: {
        ...post,
        // Add generated tags if requested
        ...(generateTags && {
          hashtags: [...post.hashtags, ...generateContentTags(post)],
        }),
      },
      assets,
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("[SocialImport] Import failed:", error);
    
    Sentry.captureException(error, {
      tags: { operation: "social-import" },
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Social media import failed" 
      },
      { status: 500 }
    );
  }
}

/**
 * Download media from social post and upload to R2
 */
async function downloadAndUploadMedia(
  r2Service: any,
  post: SocialMediaPost,
  folder: string,
  processImages: boolean
): Promise<ImportResult["assets"]> {
  if (!r2Service) {
    throw new Error("R2 service not configured");
  }
  
  const assets: ImportResult["assets"] = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < post.media.length; i++) {
    const mediaItem = post.media[i];
    
    try {
      // Processing media file
      
      // Download media content
      const downloadResult = await downloadMediaFromUrl(mediaItem.url);
      if (!downloadResult.success || !downloadResult.buffer) {
        console.warn(`[SocialImport] Failed to download media: ${downloadResult.error}`);
        continue;
      }
      
      // Generate filename
      const extension = getFileExtension(downloadResult.contentType || "", mediaItem.type);
      const filename = `${post.platform}-${post.id}-${i + 1}-${timestamp}.${extension}`;
      const key = `${folder}/${filename}`;
      
      // Prepare metadata
      const metadata = {
        originalUrl: mediaItem.url,
        platform: post.platform,
        postId: post.id,
        author: post.author.username,
        caption: post.caption || post.description || "",
        hashtags: post.hashtags.join(","),
        extractedAt: post.extractedAt.toISOString(),
        mediaType: mediaItem.type,
        ...(mediaItem.width && { originalWidth: mediaItem.width.toString() }),
        ...(mediaItem.height && { originalHeight: mediaItem.height.toString() }),
        ...(mediaItem.duration && { duration: mediaItem.duration.toString() }),
        ...(post.engagement && {
          likes: post.engagement.likes?.toString() || "0",
          views: post.engagement.views?.toString() || "0",
        }),
      };
      
      // Process images if requested
      let finalBuffer = downloadResult.buffer;
      let processedMetadata = metadata;
      
      if (processImages && mediaItem.type === "image") {
        try {
          const processedResult = await processImageForSocial(downloadResult.buffer, post.platform);
          if (processedResult.success) {
            finalBuffer = processedResult.buffer!;
            processedMetadata = {
              ...metadata,
              processed: "true",
              originalSize: downloadResult.buffer.length.toString(),
              processedSize: finalBuffer.length.toString(),
              ...processedResult.metadata,
            };
          }
        } catch (error) {
          console.warn("[SocialImport] Image processing failed, using original:", error);
        }
      }
      
      // Upload to R2
      await r2Service.putObject(key, finalBuffer, {
        metadata: processedMetadata,
      });
      
      const asset = {
        id: key,
        url: r2Service.getObjectUrl(key),
        type: mediaItem.type,
        filename,
        size: finalBuffer.length,
        metadata: processedMetadata,
      };
      
      assets.push(asset);
      console.log(`[SocialImport] Uploaded ${filename} (${formatFileSize(finalBuffer.length)})`);
      
    } catch (error) {
      console.error(`[SocialImport] Failed to process media ${i + 1}:`, error);
      // Continue with other media items
    }
  }
  
  return assets;
}

/**
 * Process image for social media optimization
 */
async function processImageForSocial(buffer: Buffer, platform: string): Promise<{
  success: boolean;
  buffer?: Buffer;
  metadata?: Record<string, string>;
  error?: string;
}> {
  try {
    // Import image processing utilities
    const { processImage } = await import("../../../../lib/image-processing");
    
    // Platform-specific processing options
    const options = getSocialProcessingOptions(platform);
    
    const result = await processImage(buffer, options);
    
    return {
      success: true,
      buffer: result.original.buffer,
      metadata: {
        format: result.original.format,
        width: result.original.width.toString(),
        height: result.original.height.toString(),
        quality: result.original.quality.toString(),
        compressionRatio: result.metadata.compressionRatio.toString(),
        processingTime: result.metadata.processingTime.toString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Processing failed",
    };
  }
}

/**
 * Get processing options optimized for each social platform
 */
function getSocialProcessingOptions(platform: string) {
  switch (platform) {
    case "instagram":
      return {
        aspectRatio: "1:1" as const, // Square format
        format: "webp" as const,
        quality: 85,
        sharpen: true,
        enhance: true,
      };
    
    case "tiktok":
      return {
        aspectRatio: "9:16" as const, // Vertical format
        format: "webp" as const,
        quality: 80,
        sharpen: true,
      };
    
    case "twitter":
      return {
        aspectRatio: "16:9" as const, // Wide format
        format: "webp" as const,
        quality: 85,
        progressive: true,
      };
    
    default:
      return {
        format: "webp" as const,
        quality: 85,
        stripExif: true,
      };
  }
}

/**
 * Generate additional content tags based on post analysis
 */
function generateContentTags(post: SocialMediaPost): string[] {
  const generatedTags: string[] = [];
  
  // Platform-specific tags
  generatedTags.push(post.platform);
  
  // Content type tags
  const hasImages = post.media.some(m => m.type === "image");
  const hasVideos = post.media.some(m => m.type === "video");
  
  if (hasImages) generatedTags.push("image-content");
  if (hasVideos) generatedTags.push("video-content");
  
  // Multiple media tag
  if (post.media.length > 1) generatedTags.push("gallery");
  
  // Engagement level tags
  if (post.engagement) {
    const { likes = 0, views = 0, comments = 0 } = post.engagement;
    
    if (likes > 1000) generatedTags.push("viral");
    if (likes > 100) generatedTags.push("popular");
    if (comments > 50) generatedTags.push("engaging");
    if (views > 10000) generatedTags.push("trending");
  }
  
  // Content analysis tags (simplified)
  const text = (post.caption || post.description || "").toLowerCase();
  
  if (text.includes("sale") || text.includes("discount")) generatedTags.push("promotional");
  if (text.includes("new") || text.includes("launch")) generatedTags.push("product-launch");
  if (text.includes("tutorial") || text.includes("how-to")) generatedTags.push("educational");
  if (text.includes("behind") || text.includes("bts")) generatedTags.push("behind-the-scenes");
  
  // Author verification tag
  if (post.author.verified) generatedTags.push("verified-creator");
  
  return [...new Set(generatedTags)]; // Remove duplicates
}

/**
 * Get file extension based on content type and media type
 */
function getFileExtension(contentType: string, mediaType: "image" | "video"): string {
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("mov")) return "mov";
  
  // Fallback based on media type
  return mediaType === "video" ? "mp4" : "jpg";
}

/**
 * Format file size for logging
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

/**
 * GET endpoint to validate social media URLs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    
    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }
    
    const validation = validateSocialMediaUrl(url);
    
    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        error: validation.error,
      });
    }
    
    // Return platform info and extraction preview
    return NextResponse.json({
      valid: true,
      platform: validation.platform,
      platformName: getPlatformDisplayName(validation.platform!),
      canExtract: true,
      estimatedMedia: 1, // Simplified estimate
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: "URL validation failed" },
      { status: 500 }
    );
  }
}

function getPlatformDisplayName(platform: string): string {
  const names: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    twitter: "Twitter/X",
    youtube: "YouTube",
    pinterest: "Pinterest",
  };
  
  return names[platform] || platform;
}