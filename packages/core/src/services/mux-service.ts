import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || "",
  tokenSecret: process.env.MUX_TOKEN_SECRET || ""
});

const Video = mux.video;
const Data = mux.data;

export interface MuxAsset {
  id: string;
  playbackId: string;
  status: "preparing" | "ready" | "errored";
  duration: number;
  aspectRatio: string;
  resolution: string;
  thumbnailUrl: string;
  hlsUrl: string;
  mp4Url?: string;
}

export class MuxService {
  private static instance: MuxService;

  private constructor() {}

  static getInstance(): MuxService {
    if (!MuxService.instance) {
      MuxService.instance = new MuxService();
    }
    return MuxService.instance;
  }

  /**
   * Upload a video to Mux via direct upload
   */
  async createDirectUpload() {
    try {
      const upload = await Video.uploads.create({
        cors_origin: process.env.NEXT_PUBLIC_BASE_URL || "*",
        new_asset_settings: {
          playback_policy: ["public"],
          video_quality: "plus", // Better quality for Instagram-style content
          mp4_support: "standard", // Enable MP4 for fallback
        },
      });

      return {
        uploadId: upload.id,
        uploadUrl: upload.url,
        assetId: upload.asset_id,
      };
    } catch (error) {
      console.error("Mux direct upload creation failed:", error);
      throw error;
    }
  }

  /**
   * Create an asset from a URL
   */
  async createAssetFromUrl(url: string, options?: {
    testMode?: boolean;
    thumbnailTime?: number;
  }) {
    try {
      const asset = await Video.assets.create({
        inputs: [{ url }],
        playback_policy: ["public"],
        video_quality: "plus",
        mp4_support: "standard",
        test: options?.testMode,
        // Generate thumbnails
        per_title_encode: true,
        // Set thumbnail time (for cover frame)
        ...(options?.thumbnailTime && {
          passthrough: JSON.stringify({ thumbnailTime: options.thumbnailTime }),
        }),
      });

      return this.formatAsset(asset);
    } catch (error) {
      console.error("Mux asset creation failed:", error);
      throw error;
    }
  }

  /**
   * Get asset details
   */
  async getAsset(assetId: string): Promise<MuxAsset | null> {
    try {
      const asset = await Video.assets.retrieve(assetId);
      return this.formatAsset(asset);
    } catch (error) {
      console.error("Failed to get Mux asset:", error);
      return null;
    }
  }

  /**
   * Delete an asset
   */
  async deleteAsset(assetId: string): Promise<boolean> {
    try {
      await Video.assets.delete(assetId);
      return true;
    } catch (error) {
      console.error("Failed to delete Mux asset:", error);
      return false;
    }
  }

  /**
   * Get signed URL for private playback
   */
  getSignedPlaybackUrl(playbackId: string, options?: {
    expiresIn?: number; // seconds
    type?: "thumbnail" | "video";
  }) {
    const baseUrl = options?.type === "thumbnail"
      ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
      : `https://stream.mux.com/${playbackId}.m3u8`;

    // In production, you'd implement JWT signing here
    // For now, return public URL
    return baseUrl;
  }

  /**
   * Get streaming URLs for a playback ID
   */
  getStreamingUrls(playbackId: string) {
    return {
      hls: `https://stream.mux.com/${playbackId}.m3u8`,
      thumbnail: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
      thumbnailAnimated: `https://image.mux.com/${playbackId}/animated.gif`,
      // Thumbnail with specific time
      thumbnailAt: (time: number) => 
        `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`,
      // Different quality thumbnails
      thumbnailSizes: {
        small: `https://image.mux.com/${playbackId}/thumbnail.jpg?width=320`,
        medium: `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640`,
        large: `https://image.mux.com/${playbackId}/thumbnail.jpg?width=1280`,
      },
      // MP4 downloads (if enabled)
      mp4: {
        low: `https://stream.mux.com/${playbackId}/low.mp4`,
        medium: `https://stream.mux.com/${playbackId}/medium.mp4`,
        high: `https://stream.mux.com/${playbackId}/high.mp4`,
      },
    };
  }

  /**
   * Track video view for analytics
   */
  async trackView(playbackId: string, viewerData?: {
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      // Mux Data tracking would go here
      // This requires additional setup with Mux Data
      console.log("Tracking view for:", playbackId, viewerData);
    } catch (error) {
      console.error("Failed to track video view:", error);
    }
  }

  /**
   * Format Mux asset response
   */
  private formatAsset(asset: any): MuxAsset {
    const playbackId = asset.playback_ids?.[0]?.id || "";
    const urls = this.getStreamingUrls(playbackId);

    return {
      id: asset.id,
      playbackId,
      status: asset.status,
      duration: asset.duration || 0,
      aspectRatio: asset.aspect_ratio || "16:9",
      resolution: asset.resolution_tier || "1080p",
      thumbnailUrl: urls.thumbnail,
      hlsUrl: urls.hls,
      mp4Url: asset.mp4_support === "standard" ? urls.mp4.high : undefined,
    };
  }

  /**
   * Create webhook for asset ready notifications
   */
  async createWebhook(url: string, events: string[] = ["video.asset.ready"]) {
    try {
      // TODO: Implement webhook creation when Mux API is properly configured
      console.log("Webhook creation not yet implemented", { url, events });
      return { id: "mock-webhook", url, events };
    } catch (error) {
      console.error("Failed to create Mux webhook:", error);
      throw error;
    }
  }
}

export const muxService = MuxService.getInstance();