import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryAsset {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  aspectRatio: number;
  versions: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  };
  responsiveUrls: string[];
}

export class CloudinaryService {
  private static instance: CloudinaryService;

  private constructor() {}

  static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  /**
   * Upload an image with automatic optimizations
   */
  async uploadImage(
    filePathOrUrl: string,
    options?: {
      folder?: string;
      publicId?: string;
      tags?: string[];
      aspectRatio?: "1:1" | "4:5" | "9:16";
      eager?: boolean; // Generate transformations immediately
    }
  ): Promise<CloudinaryAsset> {
    try {
      // Determine aspect ratio crop dimensions
      const cropOptions = this.getAspectRatioCrop(options?.aspectRatio || "1:1");

      const result = await cloudinary.uploader.upload(filePathOrUrl, {
        folder: options?.folder || "minimall",
        public_id: options?.publicId,
        tags: options?.tags,
        resource_type: "image",
        quality: "auto:best",
        fetch_format: "auto",
        // Apply aspect ratio crop
        transformation: [
          {
            ...cropOptions,
            crop: "fill",
            gravity: "auto",
          },
        ],
        // Generate eager transformations for common sizes
        eager: options?.eager ? [
          { width: 150, height: 150, crop: "thumb", gravity: "auto", quality: "auto" }, // Thumbnail
          { width: 320, crop: "scale", quality: "auto" }, // Small
          { width: 640, crop: "scale", quality: "auto" }, // Medium
          { width: 1080, crop: "scale", quality: "auto" }, // Large
          { width: 2048, crop: "scale", quality: "auto" }, // Extra large
        ] : undefined,
        eager_async: true,
      });

      return this.formatAsset(result);
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      throw error;
    }
  }

  /**
   * Generate responsive image URLs with DPR support
   */
  generateResponsiveUrls(publicId: string, options?: {
    aspectRatio?: "1:1" | "4:5" | "9:16";
    sizes?: number[];
    format?: "auto" | "webp" | "avif" | "jpg";
  }): string[] {
    const sizes = options?.sizes || [320, 640, 768, 1024, 1280, 1536, 1920];
    const format = options?.format || "auto";
    const cropOptions = this.getAspectRatioCrop(options?.aspectRatio || "1:1");

    return sizes.map(width => {
      return cloudinary.url(publicId, {
        width,
        ...cropOptions,
        crop: "fill",
        gravity: "auto",
        quality: "auto:best",
        fetch_format: format,
        dpr: "auto",
        responsive: true,
        secure: true,
      });
    });
  }

  /**
   * Generate a single optimized URL with transformations
   */
  getOptimizedUrl(
    publicId: string,
    transformations?: {
      width?: number;
      height?: number;
      crop?: "fill" | "fit" | "scale" | "thumb" | "crop";
      gravity?: "auto" | "face" | "center" | "north" | "south" | "east" | "west";
      quality?: number | "auto" | "auto:best" | "auto:good" | "auto:eco" | "auto:low";
      format?: "auto" | "webp" | "avif" | "jpg" | "png";
      dpr?: number | "auto";
      aspectRatio?: "1:1" | "4:5" | "9:16";
      effects?: string[]; // e.g., ["blur:300", "grayscale", "sepia"]
      overlay?: {
        publicId: string;
        position?: string;
        gravity?: string;
      };
    }
  ): string {
    const transformation: any = {
      width: transformations?.width,
      height: transformations?.height,
      crop: transformations?.crop || "fill",
      gravity: transformations?.gravity || "auto",
      quality: transformations?.quality || "auto:best",
      fetch_format: transformations?.format || "auto",
      dpr: transformations?.dpr || "auto",
      secure: true,
    };

    // Apply aspect ratio if specified
    if (transformations?.aspectRatio) {
      const cropOptions = this.getAspectRatioCrop(transformations.aspectRatio);
      transformation.width = cropOptions.width;
      transformation.height = cropOptions.height;
    }

    // Apply effects
    if (transformations?.effects && transformations.effects.length > 0) {
      transformation.effect = transformations.effects.join(",");
    }

    // Apply overlay
    if (transformations?.overlay) {
      transformation.overlay = transformations.overlay.publicId;
      transformation.overlay_gravity = transformations.overlay.gravity;
      transformation.overlay_position = transformations.overlay.position;
    }

    return cloudinary.url(publicId, transformation);
  }

  /**
   * Generate Instagram-ready image with all optimizations
   */
  getInstagramOptimizedUrl(
    publicId: string,
    variant: "feed" | "story" | "reel" = "feed",
    options?: {
      quality?: "auto" | "auto:best" | "auto:good";
      effects?: string[];
    }
  ): string {
    const dimensions = {
      feed: { width: 1080, height: 1080, aspectRatio: "1:1" as const },
      story: { width: 1080, height: 1920, aspectRatio: "9:16" as const },
      reel: { width: 1080, height: 1920, aspectRatio: "9:16" as const },
    };

    const config = dimensions[variant];

    return this.getOptimizedUrl(publicId, {
      width: config.width,
      height: config.height,
      aspectRatio: config.aspectRatio,
      crop: "fill",
      gravity: "auto",
      quality: options?.quality || "auto:best",
      format: "auto",
      dpr: "auto",
      effects: options?.effects,
    });
  }

  /**
   * Delete an asset from Cloudinary
   */
  async deleteAsset(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error) {
      console.error("Failed to delete Cloudinary asset:", error);
      return false;
    }
  }

  /**
   * Generate upload signature for direct browser uploads
   */
  generateUploadSignature(params: {
    folder?: string;
    tags?: string[];
    eager?: string;
  }): { signature: string; timestamp: number; apiKey: string } {
    const timestamp = Math.round(Date.now() / 1000);
    
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: params.folder || "minimall",
        tags: params.tags?.join(","),
        eager: params.eager,
      },
      process.env.CLOUDINARY_API_SECRET || ""
    );

    return {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY || "",
    };
  }

  /**
   * Get asset info
   */
  async getAssetInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        colors: true,
        faces: true,
        quality_analysis: true,
      });
      return result;
    } catch (error) {
      console.error("Failed to get asset info:", error);
      return null;
    }
  }

  /**
   * Helper to get aspect ratio crop dimensions
   */
  private getAspectRatioCrop(aspectRatio: "1:1" | "4:5" | "9:16") {
    const dimensions = {
      "1:1": { width: 1080, height: 1080 },
      "4:5": { width: 1080, height: 1350 },
      "9:16": { width: 1080, height: 1920 },
    };
    return dimensions[aspectRatio];
  }

  /**
   * Format Cloudinary response to our asset structure
   */
  private formatAsset(cloudinaryResponse: any): CloudinaryAsset {
    const { public_id, secure_url, format, width, height, bytes, eager } = cloudinaryResponse;

    // Generate version URLs
    const versions = {
      thumbnail: this.getOptimizedUrl(public_id, { width: 150, height: 150, crop: "thumb" }),
      small: this.getOptimizedUrl(public_id, { width: 320 }),
      medium: this.getOptimizedUrl(public_id, { width: 640 }),
      large: this.getOptimizedUrl(public_id, { width: 1080 }),
      original: secure_url,
    };

    // Generate responsive URLs
    const responsiveUrls = this.generateResponsiveUrls(public_id);

    return {
      publicId: public_id,
      url: cloudinaryResponse.url,
      secureUrl: secure_url,
      format,
      width,
      height,
      bytes,
      aspectRatio: width / height,
      versions,
      responsiveUrls,
    };
  }

  /**
   * Apply Instagram-style filters
   */
  applyInstagramFilter(
    publicId: string,
    filter: "clarendon" | "gingham" | "moon" | "lark" | "reyes" | "juno" | "slumber" | "crema" | "ludwig" | "aden"
  ): string {
    const filterEffects: Record<string, string[]> = {
      clarendon: ["contrast:20", "saturation:25"],
      gingham: ["sepia:10", "contrast:-5"],
      moon: ["grayscale", "contrast:10", "brightness:10"],
      lark: ["contrast:-10", "saturation:10", "vibrance:20"],
      reyes: ["sepia:20", "contrast:-15", "saturation:-10"],
      juno: ["saturation:30", "contrast:10", "vibrance:20"],
      slumber: ["saturation:-30", "brightness:10"],
      crema: ["contrast:-20", "saturation:-20", "brightness:10"],
      ludwig: ["contrast:10", "saturation:20", "brightness:-10"],
      aden: ["contrast:-10", "saturation:-20", "brightness:20", "hue:-5"],
    };

    return this.getOptimizedUrl(publicId, {
      effects: filterEffects[filter] || [],
      quality: "auto:best",
    });
  }
}

export const cloudinaryService = CloudinaryService.getInstance();