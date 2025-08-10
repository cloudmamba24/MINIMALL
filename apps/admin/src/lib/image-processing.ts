/**
 * Image Processing Pipeline
 * 
 * Advanced image processing utilities using Sharp.js for AI-powered cropping,
 * format optimization, and responsive variant generation for MINIMALL platform.
 */

import sharp from "sharp";
import { z } from "zod";

export interface ProcessingOptions {
  // Auto-cropping options
  aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9" | "3:2" | "original";
  smartCrop?: boolean;
  focusPoint?: { x: number; y: number }; // Percentage coordinates (0-100)
  
  // Format optimization
  format?: "webp" | "avif" | "jpeg" | "png" | "auto";
  quality?: number; // 1-100
  progressive?: boolean;
  
  // Responsive variants
  sizes?: number[]; // Width in pixels
  densities?: number[]; // 1x, 2x, 3x
  
  // Enhancement options
  sharpen?: boolean;
  enhance?: boolean;
  removeBackground?: boolean;
  
  // Output options
  preserveMetadata?: boolean;
  stripExif?: boolean;
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
  quality: number;
  url?: string;
  metadata?: sharp.Metadata;
}

export interface ProcessingResult {
  original: ProcessedImage;
  variants: Array<ProcessedImage & { variant: string; size?: number; density?: number }>;
  metadata: {
    originalSize: number;
    totalSize: number;
    compressionRatio: number;
    processingTime: number;
    dominantColors?: string[];
    hasTransparency?: boolean;
    aspectRatio: number;
  };
}

const processingOptionsSchema = z.object({
  aspectRatio: z.enum(["1:1", "4:5", "9:16", "16:9", "3:2", "original"]).optional(),
  smartCrop: z.boolean().optional(),
  focusPoint: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional(),
  format: z.enum(["webp", "avif", "jpeg", "png", "auto"]).optional(),
  quality: z.number().min(1).max(100).optional(),
  progressive: z.boolean().optional(),
  sizes: z.array(z.number().positive()).optional(),
  densities: z.array(z.number().positive()).optional(),
  sharpen: z.boolean().optional(),
  enhance: z.boolean().optional(),
  removeBackground: z.boolean().optional(),
  preserveMetadata: z.boolean().optional(),
  stripExif: z.boolean().optional(),
});

/**
 * Main image processing function
 */
export async function processImage(
  inputBuffer: Buffer,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const startTime = Date.now();
  
  // Validate options
  const validOptions = processingOptionsSchema.parse(options);
  
  // Get image metadata
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid image: unable to determine dimensions");
  }
  
  // Calculate processing parameters
  const aspectRatio = metadata.width / metadata.height;
  const originalSize = inputBuffer.length;
  
  // Process main image
  const processedMain = await processMainImage(image, validOptions, metadata);
  
  // Generate responsive variants
  const variants = await generateVariants(inputBuffer, validOptions, metadata);
  
  const processingTime = Date.now() - startTime;
  const totalSize = processedMain.size + variants.reduce((sum, v) => sum + v.size, 0);
  
  // Extract dominant colors (optional)
  const dominantColors = await extractDominantColors(image);
  
  return {
    original: processedMain,
    variants,
    metadata: {
      originalSize,
      totalSize,
      compressionRatio: originalSize / totalSize,
      processingTime,
      dominantColors,
      hasTransparency: metadata.hasAlpha,
      aspectRatio,
    },
  };
}

/**
 * Process the main image with specified options
 */
async function processMainImage(
  image: sharp.Sharp,
  options: ProcessingOptions,
  metadata: sharp.Metadata
): Promise<ProcessedImage> {
  let pipeline = image.clone();
  
  // Apply cropping/resizing
  if (options.aspectRatio && options.aspectRatio !== "original") {
    pipeline = await applyCropping(pipeline, options, metadata);
  }
  
  // Apply enhancements
  if (options.enhance) {
    pipeline = pipeline.modulate({ brightness: 1.05, saturation: 1.1 });
  }
  
  if (options.sharpen) {
    pipeline = pipeline.sharpen();
  }
  
  // Remove background if requested
  if (options.removeBackground) {
    pipeline = await removeBackground(pipeline);
  }
  
  // Apply format and quality settings
  const format = options.format === "auto" ? detectOptimalFormat(metadata) : options.format || "webp";
  const quality = options.quality || getOptimalQuality(format);
  
  pipeline = applyFormat(pipeline, format, quality, options.progressive);
  
  // Strip metadata if requested
  if (options.stripExif && !options.preserveMetadata) {
    pipeline = pipeline.withMetadata({});
  }
  
  // Generate final buffer
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  
  return {
    buffer: data,
    width: info.width,
    height: info.height,
    format: info.format,
    size: info.size,
    quality,
    metadata: await sharp(data).metadata(),
  };
}

/**
 * Generate responsive variants
 */
async function generateVariants(
  inputBuffer: Buffer,
  options: ProcessingOptions,
  metadata: sharp.Metadata
): Promise<Array<ProcessedImage & { variant: string; size?: number; density?: number }>> {
  const variants: Array<ProcessedImage & { variant: string; size?: number; density?: number }> = [];
  
  const sizes = options.sizes || [400, 800, 1200, 1600];
  const densities = options.densities || [1, 2];
  const format = options.format === "auto" ? detectOptimalFormat(metadata) : options.format || "webp";
  
  for (const size of sizes) {
    for (const density of densities) {
      const targetWidth = size * density;
      
      // Skip if larger than original
      if (metadata.width && targetWidth > metadata.width) continue;
      
      let pipeline = sharp(inputBuffer);
      
      // Apply cropping if specified
      if (options.aspectRatio && options.aspectRatio !== "original") {
        pipeline = await applyCropping(pipeline, options, metadata);
      }
      
      // Resize to target width
      pipeline = pipeline.resize(targetWidth, null, {
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      });
      
      // Apply format and quality
      const quality = getQualityForSize(targetWidth, options.quality);
      pipeline = applyFormat(pipeline, format, quality, options.progressive);
      
      if (options.stripExif && !options.preserveMetadata) {
        pipeline = pipeline.withMetadata({});
      }
      
      try {
        const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
        
        variants.push({
          buffer: data,
          width: info.width,
          height: info.height,
          format: info.format,
          size: info.size,
          quality,
          variant: `${size}w-${density}x`,
          size: size,
          density,
        });
      } catch (error) {
        console.warn(`Failed to generate variant ${size}w-${density}x:`, error);
      }
    }
  }
  
  return variants;
}

/**
 * Apply smart cropping based on aspect ratio and focus point
 */
async function applyCropping(
  pipeline: sharp.Sharp,
  options: ProcessingOptions,
  metadata: sharp.Metadata
): Promise<sharp.Sharp> {
  if (!metadata.width || !metadata.height || !options.aspectRatio) {
    return pipeline;
  }
  
  const targetAspectRatio = getAspectRatioValue(options.aspectRatio);
  const currentAspectRatio = metadata.width / metadata.height;
  
  if (Math.abs(currentAspectRatio - targetAspectRatio) < 0.01) {
    return pipeline; // Already correct aspect ratio
  }
  
  let cropWidth: number, cropHeight: number;
  
  if (currentAspectRatio > targetAspectRatio) {
    // Image is wider, crop width
    cropHeight = metadata.height;
    cropWidth = Math.round(cropHeight * targetAspectRatio);
  } else {
    // Image is taller, crop height
    cropWidth = metadata.width;
    cropHeight = Math.round(cropWidth / targetAspectRatio);
  }
  
  if (options.smartCrop || options.focusPoint) {
    // Use entropy or focus point for smart cropping
    const gravity = options.focusPoint 
      ? calculateGravity(options.focusPoint, metadata.width, metadata.height)
      : sharp.gravity.entropy;
    
    return pipeline.resize(cropWidth, cropHeight, {
      fit: "cover",
      position: gravity,
    });
  } else {
    // Center crop
    return pipeline.resize(cropWidth, cropHeight, {
      fit: "cover",
      position: "center",
    });
  }
}

/**
 * Remove background using Sharp's alpha matting
 */
async function removeBackground(pipeline: sharp.Sharp): Promise<sharp.Sharp> {
  // This is a simplified version - in production, you might want to integrate
  // with dedicated background removal services like remove.bg or Adobe's API
  
  try {
    // Attempt to create an alpha channel based on edge detection
    const { data, info } = await pipeline
      .clone()
      .greyscale()
      .normalise()
      .threshold(240)
      .toBuffer({ resolveWithObject: true });
    
    // Use the processed image as an alpha mask
    return pipeline.composite([
      { input: data, blend: "dest-in" }
    ]);
  } catch (error) {
    console.warn("Background removal failed:", error);
    return pipeline; // Return original if background removal fails
  }
}

/**
 * Extract dominant colors from image
 */
async function extractDominantColors(image: sharp.Sharp): Promise<string[]> {
  try {
    const { dominant } = await image.clone().stats();
    
    if (dominant) {
      // Convert RGB to hex
      const hex = `#${dominant.r.toString(16).padStart(2, '0')}${dominant.g.toString(16).padStart(2, '0')}${dominant.b.toString(16).padStart(2, '0')}`;
      return [hex];
    }
  } catch (error) {
    console.warn("Color extraction failed:", error);
  }
  
  return [];
}

/**
 * Apply format-specific settings
 */
function applyFormat(
  pipeline: sharp.Sharp,
  format: string,
  quality: number,
  progressive?: boolean
): sharp.Sharp {
  switch (format) {
    case "webp":
      return pipeline.webp({ 
        quality,
        effort: 6,
        smartSubsample: true,
      });
    
    case "avif":
      return pipeline.avif({ 
        quality,
        effort: 4,
      });
    
    case "jpeg":
      return pipeline.jpeg({ 
        quality,
        progressive: progressive ?? true,
        mozjpeg: true,
      });
    
    case "png":
      return pipeline.png({ 
        quality,
        compressionLevel: 6,
        adaptiveFiltering: true,
      });
    
    default:
      return pipeline.webp({ quality });
  }
}

/**
 * Detect optimal format based on image characteristics
 */
function detectOptimalFormat(metadata: sharp.Metadata): string {
  // AVIF for modern browsers (best compression)
  // WebP as fallback (good compression, wide support)
  // PNG for images with transparency
  // JPEG for photos without transparency
  
  if (metadata.hasAlpha) {
    return "webp"; // WebP handles transparency better than AVIF in most cases
  }
  
  // For photos, AVIF provides best compression
  return "avif";
}

/**
 * Get optimal quality based on format
 */
function getOptimalQuality(format: string): number {
  switch (format) {
    case "avif":
      return 65; // AVIF is more efficient
    case "webp":
      return 80;
    case "jpeg":
      return 85;
    case "png":
      return 90;
    default:
      return 80;
  }
}

/**
 * Adjust quality based on image size
 */
function getQualityForSize(width: number, baseQuality?: number): number {
  const base = baseQuality || 80;
  
  // Reduce quality for larger images to save bandwidth
  if (width >= 1600) return Math.max(base - 10, 60);
  if (width >= 1200) return Math.max(base - 5, 65);
  if (width >= 800) return base;
  
  // Increase quality for smaller images (thumbnails)
  return Math.min(base + 5, 95);
}

/**
 * Convert aspect ratio string to numeric value
 */
function getAspectRatioValue(aspectRatio: string): number {
  switch (aspectRatio) {
    case "1:1": return 1;
    case "4:5": return 0.8;
    case "9:16": return 0.5625;
    case "16:9": return 1.7778;
    case "3:2": return 1.5;
    default: return 1;
  }
}

/**
 * Calculate gravity position from focus point
 */
function calculateGravity(focusPoint: { x: number; y: number }, width: number, height: number): string {
  const x = focusPoint.x / 100; // Convert percentage to decimal
  const y = focusPoint.y / 100;
  
  // Determine position based on focus point
  if (x < 0.33) {
    if (y < 0.33) return "northwest";
    if (y > 0.67) return "southwest";
    return "west";
  } else if (x > 0.67) {
    if (y < 0.33) return "northeast";
    if (y > 0.67) return "southeast";
    return "east";
  } else {
    if (y < 0.33) return "north";
    if (y > 0.67) return "south";
    return "center";
  }
}

/**
 * Validate image file and get basic info
 */
export async function validateImageFile(buffer: Buffer): Promise<{
  valid: boolean;
  error?: string;
  metadata?: sharp.Metadata;
}> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.format) {
      return { valid: false, error: "Unable to determine image format" };
    }
    
    const supportedFormats = ["jpeg", "png", "webp", "avif", "gif", "tiff", "svg"];
    if (!supportedFormats.includes(metadata.format)) {
      return { valid: false, error: `Unsupported format: ${metadata.format}` };
    }
    
    if (!metadata.width || !metadata.height) {
      return { valid: false, error: "Unable to determine image dimensions" };
    }
    
    // Check reasonable size limits
    const maxDimension = 10000;
    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      return { valid: false, error: `Image too large: ${metadata.width}x${metadata.height}` };
    }
    
    return { valid: true, metadata };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Invalid image file" 
    };
  }
}

/**
 * Generate srcset string for responsive images
 */
export function generateSrcSet(variants: Array<ProcessedImage & { variant: string; size?: number }>): string {
  return variants
    .filter(v => v.size)
    .map(v => `${v.url} ${v.size}w`)
    .join(", ");
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(breakpoints?: Array<{ minWidth: string; size: string }>): string {
  const defaultBreakpoints = [
    { minWidth: "1200px", size: "1200px" },
    { minWidth: "768px", size: "800px" },
    { minWidth: "480px", size: "400px" },
  ];
  
  const points = breakpoints || defaultBreakpoints;
  const mediaQueries = points.map(bp => `(min-width: ${bp.minWidth}) ${bp.size}`);
  
  return `${mediaQueries.join(", ")}, 100vw`;
}