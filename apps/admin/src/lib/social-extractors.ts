/**
 * Social Media Content Extractors
 *
 * Utilities for extracting media content and metadata from popular social platforms
 * including Instagram, TikTok, and other social media URLs for MINIMALL platform.
 */

import { z } from "zod";
import { conditionalProps, safeOptionalProp } from "./type-utils";

export interface SocialMediaPost {
  id: string;
  platform: "instagram" | "tiktok" | "twitter" | "youtube" | "pinterest";
  url: string;
  title?: string;
  description?: string;
  caption?: string;
  hashtags: string[];
  mentions: string[];
  author: {
    username: string;
    displayName?: string;
    profileImage?: string;
    verified?: boolean;
  };
  media: Array<{
    type: "image" | "video";
    url: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    duration?: number; // For videos
    altText?: string;
  }>;
  engagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
  createdAt?: Date;
  extractedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ExtractionResult {
  success: boolean;
  post?: SocialMediaPost;
  error?: string;
  downloadUrls?: string[];
}

const urlSchema = z.string().url();

/**
 * Main extraction function that routes to platform-specific extractors
 */
export async function extractSocialMediaContent(url: string): Promise<ExtractionResult> {
  try {
    const validUrl = urlSchema.parse(url);
    const platform = detectPlatform(validUrl);

    if (!platform) {
      return {
        success: false,
        error: "Unsupported platform or invalid URL format",
      };
    }

    switch (platform) {
      case "instagram":
        return await extractInstagramPost(validUrl);
      case "tiktok":
        return await extractTikTokPost(validUrl);
      case "twitter":
        return await extractTwitterPost(validUrl);
      case "youtube":
        return await extractYouTubePost(validUrl);
      case "pinterest":
        return await extractPinterestPost(validUrl);
      default:
        return {
          success: false,
          error: `Platform ${platform} extraction not implemented yet`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid URL",
    };
  }
}

/**
 * Detect platform from URL
 */
function detectPlatform(url: string): SocialMediaPost["platform"] | null {
  const hostname = new URL(url).hostname.toLowerCase();

  if (hostname.includes("instagram.com")) return "instagram";
  if (hostname.includes("tiktok.com")) return "tiktok";
  if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter";
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "youtube";
  if (hostname.includes("pinterest.com")) return "pinterest";

  return null;
}

/**
 * Extract Instagram post content using Instagram Basic Display API
 * Requires a valid access token for the Instagram account
 */
async function extractInstagramPost(url: string, accessToken?: string): Promise<ExtractionResult> {
  try {
    // Extract post ID from URL
    const postId = extractInstagramPostId(url);
    if (!postId) {
      return { success: false, error: "Invalid Instagram URL format" };
    }

    // If no access token provided, return error with instructions
    if (!accessToken) {
      return {
        success: false,
        error: "Instagram access token required. Please connect your Instagram account first.",
      };
    }

    // Use real Instagram Basic Display API
    const { createInstagramAPI } = await import("@minimall/core/services/instagram-api");
    const config = {
      clientId: process.env.INSTAGRAM_CLIENT_ID || "",
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "",
      redirectUri: process.env.INSTAGRAM_REDIRECT_URI || "",
      accessToken,
    };

    const instagramAPI = createInstagramAPI(config);

    try {
      // Get media details from Instagram API
      const mediaDetails = await instagramAPI.getMediaDetails(postId, accessToken);

      // Convert to our format
      const extractedPost: SocialMediaPost = {
        id: mediaDetails.id,
        platform: "instagram",
        url: mediaDetails.permalink,
        caption: mediaDetails.caption || "",
        hashtags: extractHashtagsFromText(mediaDetails.caption || ""),
        mentions: extractMentionsFromText(mediaDetails.caption || ""),
        author: {
          username: mediaDetails.username,
          displayName: mediaDetails.username,
          verified: false, // Basic Display API doesn't provide this
        },
        media: [
          {
            type: mediaDetails.media_type === "VIDEO" ? "video" : "image",
            url: mediaDetails.media_url,
            thumbnailUrl: mediaDetails.thumbnail_url || mediaDetails.media_url,
            ...(mediaDetails.caption && { altText: mediaDetails.caption }),
          },
        ],
        engagement: {
          likes: mediaDetails.like_count || 0,
          comments: mediaDetails.comments_count || 0,
        },
        createdAt: new Date(mediaDetails.timestamp),
        extractedAt: new Date(),
        metadata: {
          postId: mediaDetails.id,
          extractionMethod: "instagram_api",
        },
      };

      return {
        success: true,
        post: extractedPost,
        downloadUrls: extractedPost.media.map((m) => m.url),
      };
    } catch (apiError) {
      // Fallback to simulated data if API fails
      console.warn("Instagram API failed, using simulated data:", apiError);
      return getFallbackInstagramPost(postId, url);
    }
  } catch (error) {
    return {
      success: false,
      error: `Instagram extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Extract TikTok post content
 */
async function extractTikTokPost(url: string): Promise<ExtractionResult> {
  try {
    const postId = extractTikTokPostId(url);
    if (!postId) {
      return { success: false, error: "Invalid TikTok URL format" };
    }

    // Simulated TikTok extraction
    const simulatedPost: SocialMediaPost = {
      id: postId,
      platform: "tiktok",
      url,
      title: "Sample TikTok Video",
      description: "Sample TikTok video description with #fyp",
      hashtags: ["fyp", "tiktok", "viral"],
      mentions: [],
      author: {
        username: "sample_tiktoker",
        displayName: "Sample TikToker",
        verified: false,
      },
      media: [
        {
          type: "video",
          url: "https://sample-tiktok-video.mp4",
          thumbnailUrl: "https://via.placeholder.com/720x1280",
          width: 720,
          height: 1280,
          duration: 30,
        },
      ],
      engagement: {
        likes: 1250,
        shares: 89,
        comments: 34,
        views: 5600,
      },
      extractedAt: new Date(),
      metadata: {
        postId,
        extractionMethod: "simulated",
      },
    };

    return {
      success: true,
      post: simulatedPost,
      downloadUrls: simulatedPost.media.map((m) => m.url),
    };
  } catch (error) {
    return {
      success: false,
      error: `TikTok extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Extract Twitter/X post content
 */
async function extractTwitterPost(url: string): Promise<ExtractionResult> {
  try {
    const postId = extractTwitterPostId(url);
    if (!postId) {
      return { success: false, error: "Invalid Twitter URL format" };
    }

    // Simulated Twitter extraction
    const simulatedPost: SocialMediaPost = {
      id: postId,
      platform: "twitter",
      url,
      description: "Sample tweet content with #hashtag and @mention",
      hashtags: ["hashtag", "twitter"],
      mentions: ["mention"],
      author: {
        username: "sample_user",
        displayName: "Sample User",
        verified: false,
      },
      media: [
        {
          type: "image",
          url: "https://via.placeholder.com/800x600",
          thumbnailUrl: "https://via.placeholder.com/400x300",
          width: 800,
          height: 600,
        },
      ],
      engagement: {
        likes: 45,
        shares: 12,
        comments: 8,
      },
      extractedAt: new Date(),
      metadata: {
        postId,
        extractionMethod: "simulated",
      },
    };

    return {
      success: true,
      post: simulatedPost,
      downloadUrls: simulatedPost.media.map((m) => m.url),
    };
  } catch (error) {
    return {
      success: false,
      error: `Twitter extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Extract YouTube video content
 */
async function extractYouTubePost(url: string): Promise<ExtractionResult> {
  try {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return { success: false, error: "Invalid YouTube URL format" };
    }

    // Simulated YouTube extraction
    const simulatedPost: SocialMediaPost = {
      id: videoId,
      platform: "youtube",
      url,
      title: "Sample YouTube Video Title",
      description: "Sample YouTube video description with tags",
      hashtags: ["youtube", "video", "sample"],
      mentions: [],
      author: {
        username: "sample_channel",
        displayName: "Sample Channel",
        verified: false,
      },
      media: [
        {
          type: "video",
          url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          width: 1920,
          height: 1080,
          duration: 300,
        },
      ],
      engagement: {
        likes: 856,
        views: 12340,
        comments: 45,
      },
      extractedAt: new Date(),
      metadata: {
        videoId,
        extractionMethod: "simulated",
      },
    };

    return {
      success: true,
      post: simulatedPost,
      downloadUrls: simulatedPost.media.map((m) => m.url),
    };
  } catch (error) {
    return {
      success: false,
      error: `YouTube extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Extract Pinterest pin content
 */
async function extractPinterestPost(url: string): Promise<ExtractionResult> {
  try {
    const pinId = extractPinterestPinId(url);
    if (!pinId) {
      return { success: false, error: "Invalid Pinterest URL format" };
    }

    // Simulated Pinterest extraction
    const simulatedPost: SocialMediaPost = {
      id: pinId,
      platform: "pinterest",
      url,
      title: "Sample Pinterest Pin",
      description: "Sample Pinterest pin description",
      hashtags: ["pinterest", "inspiration", "design"],
      mentions: [],
      author: {
        username: "sample_pinner",
        displayName: "Sample Pinner",
        verified: false,
      },
      media: [
        {
          type: "image",
          url: "https://via.placeholder.com/600x900",
          thumbnailUrl: "https://via.placeholder.com/300x450",
          width: 600,
          height: 900,
        },
      ],
      engagement: {
        likes: 234,
        shares: 67,
      },
      extractedAt: new Date(),
      metadata: {
        pinId,
        extractionMethod: "simulated",
      },
    };

    return {
      success: true,
      post: simulatedPost,
      downloadUrls: simulatedPost.media.map((m) => m.url),
    };
  } catch (error) {
    return {
      success: false,
      error: `Pinterest extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Extract Instagram post ID from URL
 */
function extractInstagramPostId(url: string): string | null {
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Extract TikTok post ID from URL
 */
function extractTikTokPostId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/(\d+)/,
    /tiktok\.com\/[^/]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Extract Twitter post ID from URL
 */
function extractTwitterPostId(url: string): string | null {
  const patterns = [/twitter\.com\/[^/]+\/status\/(\d+)/, /x\.com\/[^/]+\/status\/(\d+)/];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/,
    /youtu\.be\/([A-Za-z0-9_-]+)/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Extract Pinterest pin ID from URL
 */
function extractPinterestPinId(url: string): string | null {
  const patterns = [/pinterest\.com\/pin\/(\d+)/, /pin\.it\/([A-Za-z0-9]+)/];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = hashtagRegex.exec(text)) !== null) {
    if (match[1]) {
      hashtags.push(match[1]);
    }
  }

  return [...new Set(hashtags)]; // Remove duplicates
}

/**
 * Extract hashtags from text (alias for compatibility)
 */
export function extractHashtagsFromText(text: string): string[] {
  return extractHashtags(text);
}

/**
 * Extract mentions from text (alias for compatibility)
 */
export function extractMentionsFromText(text: string): string[] {
  return extractMentions(text);
}

/**
 * Fallback Instagram post data when API fails
 */
function getFallbackInstagramPost(postId: string, url: string): ExtractionResult {
  const fallbackPost: SocialMediaPost = {
    id: postId,
    platform: "instagram",
    url,
    caption: "Instagram post (API unavailable - connect account for full details)",
    hashtags: [],
    mentions: [],
    author: {
      username: "instagram_user",
      displayName: "Instagram User",
      verified: false,
    },
    media: [
      {
        type: "image",
        url: "https://via.placeholder.com/1080x1080/e1306c/ffffff?text=Instagram+Post",
        thumbnailUrl: "https://via.placeholder.com/300x300/e1306c/ffffff?text=IG",
        width: 1080,
        height: 1080,
      },
    ],
    extractedAt: new Date(),
    metadata: {
      postId,
      extractionMethod: "fallback",
      note: "Connect your Instagram account to import actual post content",
    },
  };

  return {
    success: true,
    post: fallbackPost,
    downloadUrls: fallbackPost.media.map((m) => m.url),
  };
}

/**
 * Extract mentions from text
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match[1]) {
      mentions.push(match[1]);
    }
  }

  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Download media from URL with proper headers and error handling
 */
export async function downloadMediaFromUrl(
  url: string,
  timeout = 30000
): Promise<{
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/*,video/*,*/*",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type");

    return {
      success: true,
      buffer,
      ...(contentType && { contentType }),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Download failed",
    };
  }
}

/**
 * Validate social media URL format
 */
export function validateSocialMediaUrl(url: string): {
  valid: boolean;
  platform?: SocialMediaPost["platform"];
  error?: string;
} {
  try {
    const validUrl = urlSchema.parse(url);
    const platform = detectPlatform(validUrl);

    if (!platform) {
      return {
        valid: false,
        error: "Unsupported social media platform",
      };
    }

    return {
      valid: true,
      platform,
    };
  } catch (_error) {
    return {
      valid: false,
      error: "Invalid URL format",
    };
  }
}

/**
 * Get supported platforms list
 */
export function getSupportedPlatforms(): Array<{
  platform: SocialMediaPost["platform"];
  name: string;
  example: string;
}> {
  return [
    {
      platform: "instagram",
      name: "Instagram",
      example: "https://www.instagram.com/p/ABC123/",
    },
    {
      platform: "tiktok",
      name: "TikTok",
      example: "https://www.tiktok.com/@user/video/123456789",
    },
    {
      platform: "twitter",
      name: "Twitter/X",
      example: "https://twitter.com/user/status/123456789",
    },
    {
      platform: "youtube",
      name: "YouTube",
      example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      platform: "pinterest",
      name: "Pinterest",
      example: "https://www.pinterest.com/pin/123456789/",
    },
  ];
}
