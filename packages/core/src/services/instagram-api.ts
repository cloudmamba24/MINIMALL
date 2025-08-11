/**
 * Instagram Basic Display API Integration
 * 
 * Real Instagram API integration for importing posts, reels, and stories
 * Requires Instagram Basic Display API setup and user OAuth tokens
 */

import { SocialPost, SocialConnection, SocialEngagement, SocialAuthor } from '../types';

export interface InstagramAPIConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
}

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  username: string;
  like_count?: number;
  comments_count?: number;
  children?: {
    data: InstagramMedia[];
  };
}

export interface InstagramUser {
  id: string;
  username: string;
  account_type: 'PERSONAL' | 'BUSINESS';
  media_count: number;
}

export class InstagramBasicDisplayAPI {
  private config: InstagramAPIConfig;
  private baseUrl = 'https://graph.instagram.com';

  constructor(config: InstagramAPIConfig) {
    this.config = config;
  }

  /**
   * Get OAuth authorization URL for user consent
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code',
      ...(state && { state }),
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    user_id: string;
  }> {
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram OAuth error: ${error.error_description || error.error}`);
    }

    return response.json();
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<InstagramUser> {
    const response = await this.makeAPIRequest(
      `/me?fields=id,username,account_type,media_count`,
      accessToken
    );
    return response;
  }

  /**
   * Get user's media posts
   */
  async getUserMedia(
    accessToken: string,
    limit = 25,
    after?: string
  ): Promise<{
    data: InstagramMedia[];
    paging?: {
      cursors: {
        before: string;
        after: string;
      };
      next?: string;
    };
  }> {
    const params = new URLSearchParams({
      fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,username',
      limit: limit.toString(),
      ...(after && { after }),
    });

    const response = await this.makeAPIRequest(
      `/me/media?${params.toString()}`,
      accessToken
    );
    return response;
  }

  /**
   * Get specific media item details
   */
  async getMediaDetails(
    mediaId: string,
    accessToken: string
  ): Promise<InstagramMedia> {
    const response = await this.makeAPIRequest(
      `/${mediaId}?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,username,like_count,comments_count,children{media_url,media_type}`,
      accessToken
    );
    return response;
  }

  /**
   * Convert Instagram media to MINIMALL SocialPost format
   */
  async convertToSocialPost(
    media: InstagramMedia,
    configId: string,
    shopDomain: string
  ): Promise<Partial<SocialPost>> {
    // Extract hashtags and mentions from caption
    const hashtags = this.extractHashtags(media.caption || '');
    const mentions = this.extractMentions(media.caption || '');

    // Handle carousel posts (multiple media)
    let mediaUrls: string[] = [media.media_url];
    if (media.media_type === 'CAROUSEL_ALBUM' && media.children?.data) {
      mediaUrls = media.children.data.map(child => child.media_url);
    }

    const engagement: SocialEngagement = {
      likes: media.like_count || 0,
      comments: media.comments_count || 0,
      shares: 0, // Instagram API doesn't provide shares
      views: 0, // Not available in Basic Display API
    };

    const author: SocialAuthor = {
      username: media.username,
      displayName: media.username,
      verified: false, // Not available in Basic Display API
    };

    return {
      configId,
      shopDomain,
      platform: 'instagram',
      originalUrl: media.permalink,
      postId: media.id,
      caption: media.caption || '',
      hashtags,
      mentions,
      mediaUrls, // These will need to be downloaded and uploaded to R2
      mediaMetadata: {
        aspectRatio: media.media_type === 'IMAGE' ? '1:1' : '9:16',
        format: media.media_type === 'VIDEO' ? 'mp4' : 'jpg',
      },
      engagement,
      author,
      publishedAt: media.timestamp,
      importedAt: new Date().toISOString(),
      isActive: true,
      productTags: [], // Will be added later via product tagging
      performance: {
        impressions: 0,
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
   * Import multiple posts from user's Instagram
   */
  async importUserPosts(
    accessToken: string,
    configId: string,
    shopDomain: string,
    options: {
      limit?: number;
      after?: string;
      hashtagFilter?: string[];
      minimumLikes?: number;
    } = {}
  ): Promise<Partial<SocialPost>[]> {
    const { limit = 25, after, hashtagFilter, minimumLikes = 0 } = options;
    
    const mediaResponse = await this.getUserMedia(accessToken, limit, after);
    const posts: Partial<SocialPost>[] = [];

    for (const media of mediaResponse.data) {
      // Get detailed media information including engagement
      const detailedMedia = await this.getMediaDetails(media.id, accessToken);
      
      // Apply filters
      if (minimumLikes > 0 && (detailedMedia.like_count || 0) < minimumLikes) {
        continue;
      }

      if (hashtagFilter && hashtagFilter.length > 0) {
        const postHashtags = this.extractHashtags(detailedMedia.caption || '');
        const hasMatchingHashtag = hashtagFilter.some(tag => 
          postHashtags.includes(tag.toLowerCase())
        );
        if (!hasMatchingHashtag) {
          continue;
        }
      }

      const socialPost = await this.convertToSocialPost(
        detailedMedia,
        configId,
        shopDomain
      );
      posts.push(socialPost);
    }

    return posts;
  }

  /**
   * Make authenticated API request
   */
  private async makeAPIRequest(endpoint: string, accessToken: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram API error: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Extract hashtags from caption text
   */
  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  }

  /**
   * Extract mentions from caption text
   */
  private extractMentions(text: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.slice(1).toLowerCase()) : [];
  }

  /**
   * Refresh long-lived access token
   */
  async refreshAccessToken(accessToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: accessToken,
    });

    const response = await fetch(`${this.baseUrl}/refresh_access_token?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh error: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }
}

/**
 * Helper function to create Instagram API instance
 */
export function createInstagramAPI(config: InstagramAPIConfig): InstagramBasicDisplayAPI {
  return new InstagramBasicDisplayAPI(config);
}

/**
 * Validate Instagram post URL
 */
export function isValidInstagramUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    return (
      (hostname === 'instagram.com' || hostname === 'www.instagram.com') &&
      (parsedUrl.pathname.includes('/p/') || parsedUrl.pathname.includes('/reel/'))
    );
  } catch {
    return false;
  }
}

/**
 * Extract Instagram post ID from URL
 */
export function extractInstagramPostId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const pathMatch = parsedUrl.pathname.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
    return pathMatch ? pathMatch[2] : null;
  } catch {
    return null;
  }
}