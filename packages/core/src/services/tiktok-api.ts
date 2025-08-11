/**
 * TikTok API Integration
 * 
 * Real TikTok API integration for importing videos and user content
 * Requires TikTok for Developers API setup and user OAuth tokens
 */

import { SocialPost, SocialEngagement, SocialAuthor } from '../types';

export interface TikTokAPIConfig {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
}

export interface TikTokVideo {
  id: string;
  title: string;
  video_description: string;
  duration: number;
  height: number;
  width: number;
  share_url: string;
  embed_html: string;
  embed_link: string;
  cover_image_url: string;
  create_time: number;
  share_count: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  music_info?: {
    id: string;
    title: string;
    author: string;
    original: boolean;
    duration: number;
    album: string;
  };
}

export interface TikTokUser {
  open_id: string;
  union_id: string;
  avatar_url: string;
  avatar_url_100: string;
  avatar_large_url: string;
  display_name: string;
  bio_description: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

export class TikTokAPI {
  private config: TikTokAPIConfig;
  private baseUrl = 'https://open-api.tiktok.com';

  constructor(config: TikTokAPIConfig) {
    this.config = config;
  }

  /**
   * Get OAuth authorization URL for user consent
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_key: this.config.clientKey,
      response_type: 'code',
      scope: 'user.info.basic,video.list,video.upload',
      redirect_uri: this.config.redirectUri,
      ...(state && { state }),
    });

    return `https://www.tiktok.com/auth/authorize/?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
    open_id: string;
  }> {
    const response = await fetch(`${this.baseUrl}/v2/oauth/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: this.config.clientKey,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`TikTok OAuth error: ${data.error_description || data.error}`);
    }

    return data.data;
  }

  /**
   * Get user profile information
   */
  async getUserInfo(accessToken: string): Promise<TikTokUser> {
    const response = await this.makeAPIRequest('/v2/user/info/', {
      fields: 'open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count',
    }, accessToken);

    return response.data.user;
  }

  /**
   * Get user's videos
   */
  async getUserVideos(
    accessToken: string,
    options: {
      max_count?: number;
      cursor?: string;
    } = {}
  ): Promise<{
    videos: TikTokVideo[];
    cursor: string;
    has_more: boolean;
  }> {
    const { max_count = 20, cursor } = options;
    
    const params: Record<string, string> = {
      fields: 'id,title,video_description,duration,height,width,share_url,embed_html,embed_link,cover_image_url,create_time,share_count,view_count,like_count,comment_count,music_info',
      max_count: max_count.toString(),
    };

    if (cursor) {
      params.cursor = cursor;
    }

    const response = await this.makeAPIRequest('/v2/video/list/', params, accessToken);

    return {
      videos: response.data.videos || [],
      cursor: response.data.cursor || '',
      has_more: response.data.has_more || false,
    };
  }

  /**
   * Get specific video details
   */
  async getVideoDetails(
    videoIds: string[],
    accessToken: string
  ): Promise<TikTokVideo[]> {
    const response = await this.makeAPIRequest('/v2/video/query/', {
      fields: 'id,title,video_description,duration,height,width,share_url,embed_html,embed_link,cover_image_url,create_time,share_count,view_count,like_count,comment_count,music_info',
      video_ids: videoIds.join(','),
    }, accessToken);

    return response.data.videos || [];
  }

  /**
   * Convert TikTok video to MINIMALL SocialPost format
   */
  async convertToSocialPost(
    video: TikTokVideo,
    user: TikTokUser,
    configId: string,
    shopDomain: string
  ): Promise<Partial<SocialPost>> {
    // Extract hashtags and mentions from description
    const hashtags = this.extractHashtags(video.video_description);
    const mentions = this.extractMentions(video.video_description);

    const engagement: SocialEngagement = {
      likes: video.like_count,
      comments: video.comment_count,
      shares: video.share_count,
      views: video.view_count,
    };

    const author: SocialAuthor = {
      username: user.display_name,
      displayName: user.display_name,
      avatarUrl: user.avatar_url_100,
      verified: user.is_verified,
      followerCount: user.follower_count,
      bio: user.bio_description,
    };

    return {
      configId,
      shopDomain,
      platform: 'tiktok',
      originalUrl: video.share_url,
      postId: video.id,
      caption: video.video_description,
      hashtags,
      mentions,
      mediaUrls: [video.embed_link], // TikTok doesn't provide direct video URLs
      mediaMetadata: {
        dimensions: {
          width: video.width,
          height: video.height,
        },
        duration: video.duration,
        aspectRatio: '9:16',
        format: 'mp4',
        thumbnail: video.cover_image_url,
      },
      engagement,
      author,
      publishedAt: new Date(video.create_time * 1000).toISOString(),
      importedAt: new Date().toISOString(),
      isActive: true,
      productTags: [], // Will be added later via product tagging
      performance: {
        impressions: video.view_count,
        reach: 0,
        profileVisits: 0,
        websiteClicks: 0,
        productViews: 0,
        addToCarts: 0,
        checkouts: 0,
        purchases: 0,
        revenue: 0,
        clickThroughRate: 0,
        conversionRate: 0,
      },
    };
  }

  /**
   * Import user's TikTok videos
   */
  async importUserVideos(
    accessToken: string,
    configId: string,
    shopDomain: string,
    options: {
      maxCount?: number;
      cursor?: string;
      hashtagFilter?: string[];
      minimumLikes?: number;
      minimumViews?: number;
    } = {}
  ): Promise<{
    posts: Partial<SocialPost>[];
    cursor: string;
    hasMore: boolean;
  }> {
    const { maxCount = 20, cursor, hashtagFilter, minimumLikes = 0, minimumViews = 0 } = options;
    
    // Get user info first
    const user = await this.getUserInfo(accessToken);
    
    // Get user videos
    const videosResponse = await this.getUserVideos(accessToken, {
      max_count: maxCount,
      cursor,
    });

    const posts: Partial<SocialPost>[] = [];

    for (const video of videosResponse.videos) {
      // Apply filters
      if (minimumLikes > 0 && video.like_count < minimumLikes) {
        continue;
      }

      if (minimumViews > 0 && video.view_count < minimumViews) {
        continue;
      }

      if (hashtagFilter && hashtagFilter.length > 0) {
        const postHashtags = this.extractHashtags(video.video_description);
        const hasMatchingHashtag = hashtagFilter.some(tag => 
          postHashtags.includes(tag.toLowerCase())
        );
        if (!hasMatchingHashtag) {
          continue;
        }
      }

      const socialPost = await this.convertToSocialPost(
        video,
        user,
        configId,
        shopDomain
      );
      posts.push(socialPost);
    }

    return {
      posts,
      cursor: videosResponse.cursor,
      hasMore: videosResponse.has_more,
    };
  }

  /**
   * Make authenticated API request
   */
  private async makeAPIRequest(
    endpoint: string,
    params: Record<string, string>,
    accessToken: string
  ): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`TikTok API error: ${data.error.message || 'Unknown error'}`);
    }

    return data;
  }

  /**
   * Extract hashtags from video description
   */
  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#([a-zA-Z0-9_\u4e00-\u9fff]+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  }

  /**
   * Extract mentions from video description
   */
  private extractMentions(text: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.slice(1).toLowerCase()) : [];
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
  }> {
    const response = await fetch(`${this.baseUrl}/v2/oauth/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: this.config.clientKey,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Token refresh error: ${data.error_description || data.error}`);
    }

    return data.data;
  }
}

/**
 * Helper function to create TikTok API instance
 */
export function createTikTokAPI(config: TikTokAPIConfig): TikTokAPI {
  return new TikTokAPI(config);
}

/**
 * Validate TikTok video URL
 */
export function isValidTikTokUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    return (
      (hostname === 'tiktok.com' || 
       hostname === 'www.tiktok.com' || 
       hostname === 'vm.tiktok.com') &&
      (parsedUrl.pathname.includes('/@') || parsedUrl.pathname.includes('/video/'))
    );
  } catch {
    return false;
  }
}

/**
 * Extract TikTok video ID from URL
 */
export function extractTikTokVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const pathMatch = parsedUrl.pathname.match(/\/video\/(\d+)/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}