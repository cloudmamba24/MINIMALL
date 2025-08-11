import type { DeviceType, EnhancedAnalyticsEvent, LayoutPreset } from "@minimall/core";
import { PixelUtils } from "../components/tracking/PixelDispatcher";
import { UTMUtils } from "../components/tracking/UTMTracker";
import { conditionalProps } from "./type-utils";

/**
 * Enhanced Analytics System
 *
 * Features:
 * - Standardized event tracking across all touchpoints
 * - Block-level attribution for revenue tracking
 * - A/B experiment attribution
 * - UTM parameter persistence
 * - Multi-platform pixel integration
 * - Performance monitoring
 * - Funnel analysis
 */

export interface AnalyticsEventData {
  // Core identification
  configId: string;
  blockId?: string;

  // Product/content data
  productId?: string;
  variantId?: string;
  categoryId?: string;
  itemId?: string;

  // Layout and design
  layoutPreset?: LayoutPreset;

  // A/B testing
  experimentKey?: string;

  // Commerce data
  currency?: string;
  value?: number; // in cents
  quantity?: number;

  // Additional properties
  properties?: Record<string, any>;
}

/**
 * Enhanced Analytics Tracker
 */
export class EnhancedAnalytics {
  private configId: string;
  private sessionStartTime: number;

  constructor(configId: string) {
    this.configId = configId;
    this.sessionStartTime = Date.now();
  }

  /**
   * Track gallery view event
   */
  async trackGalleryView(data: AnalyticsEventData) {
    const eventData = this.enrichEventData({
      ...data,
      event: "gallery_view",
    });

    await this.sendEvent(eventData);
    PixelUtils.dispatch("view_content", {
      content_type: "gallery",
      content_id: data.blockId,
    });
  }

  /**
   * Track tile impression (when tile enters viewport)
   */
  async trackTileImpression(data: AnalyticsEventData) {
    const eventData = this.enrichEventData({
      ...data,
      event: "tile_impression",
    });

    await this.sendEvent(eventData);
  }

  /**
   * Track tile click event
   */
  async trackTileClick(data: AnalyticsEventData) {
    const eventData = this.enrichEventData({
      ...data,
      event: "tile_click",
    });

    await this.sendEvent(eventData);

    PixelUtils.trackTileClick(
      this.configId,
      data.blockId || "",
      data.categoryId || "",
      data.itemId || ""
    );
  }

  /**
   * Track quick view modal open
   */
  async trackQuickViewOpen(data: AnalyticsEventData) {
    const eventData = this.enrichEventData({
      ...data,
      event: "quick_view_open",
    });

    await this.sendEvent(eventData);

    if (data.productId) {
      PixelUtils.trackQuickView(this.configId, data.productId, data.blockId);
    }
  }

  /**
   * Track add to cart event
   */
  async trackAddToCart(data: AnalyticsEventData) {
    const eventData = this.enrichEventData({
      ...data,
      event: "add_to_cart",
    });

    await this.sendEvent(eventData);

    if (data.productId && data.variantId && data.quantity && data.value) {
      PixelUtils.trackAddToCart(
        this.configId,
        data.productId,
        data.variantId,
        data.quantity,
        data.value,
        data.blockId
      );
    }
  }

  /**
   * Track checkout initiation
   */
  async trackBeginCheckout(data: AnalyticsEventData & { items: any[] }) {
    const eventData = this.enrichEventData({
      ...data,
      event: "begin_checkout",
    });

    await this.sendEvent(eventData);

    if (data.value && data.items) {
      PixelUtils.trackBeginCheckout(this.configId, data.value, data.items);
    }
  }

  /**
   * Track checkout URL generation
   */
  async trackCheckoutUrlGenerated(data: AnalyticsEventData) {
    const eventData = this.enrichEventData({
      ...data,
      event: "checkout_url_generated",
    });

    await this.sendEvent(eventData);
  }

  /**
   * Track layout change (for A/B testing)
   */
  async trackLayoutChange(
    data: AnalyticsEventData & { fromPreset: LayoutPreset; toPreset: LayoutPreset }
  ) {
    const eventData = this.enrichEventData({
      ...data,
      event: "layout_change",
      properties: {
        ...data.properties,
        from_preset: data.fromPreset,
        to_preset: data.toPreset,
      },
    });

    await this.sendEvent(eventData);
  }

  /**
   * Track search event (if search functionality exists)
   */
  async trackSearch(data: AnalyticsEventData & { searchTerm: string; resultsCount: number }) {
    const eventData = this.enrichEventData({
      ...data,
      event: "search",
      properties: {
        ...data.properties,
        search_term: data.searchTerm,
        results_count: data.resultsCount,
      },
    });

    await this.sendEvent(eventData);

    PixelUtils.dispatch("search", {
      search_term: data.searchTerm,
      results_count: data.resultsCount,
    });
  }

  /**
   * Track video play event
   */
  async trackVideoPlay(data: AnalyticsEventData & { videoDuration?: number; videoId?: string }) {
    const eventData = this.enrichEventData({
      ...data,
      event: "video_play",
      properties: {
        ...data.properties,
        video_id: data.videoId,
        video_duration: data.videoDuration,
      },
    });

    await this.sendEvent(eventData);
  }

  /**
   * Track social share event
   */
  async trackSocialShare(data: AnalyticsEventData & { platform: string; contentType: string }) {
    const eventData = this.enrichEventData({
      ...data,
      event: "social_share",
      properties: {
        ...data.properties,
        platform: data.platform,
        content_type: data.contentType,
      },
    });

    await this.sendEvent(eventData);

    PixelUtils.dispatch("share", {
      content_type: data.contentType,
      item_id: data.itemId,
    });
  }

  /**
   * Track session duration and engagement
   */
  async trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStartTime;

    const eventData = this.enrichEventData({
      configId: this.configId,
      event: "session_end",
      properties: {
        session_duration: Math.floor(sessionDuration / 1000), // in seconds
      },
    });

    await this.sendEvent(eventData);
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(metrics: {
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
    loadTime?: number;
  }) {
    const eventData = this.enrichEventData({
      configId: this.configId,
      event: "performance_metrics",
      properties: metrics,
    });

    await this.sendEvent(eventData);
  }

  /**
   * Track custom event
   */
  async trackCustomEvent(eventName: string, data: AnalyticsEventData) {
    const eventData = this.enrichEventData({
      ...data,
      event: eventName,
    });

    await this.sendEvent(eventData);
    PixelUtils.dispatch(eventName, data.properties);
  }

  /**
   * Enrich event data with session and UTM information
   */
  private enrichEventData(data: AnalyticsEventData & { event: string }): EnhancedAnalyticsEvent {
    const utmData = UTMUtils.getUTMData(this.configId);
    const sessionData = UTMUtils.getSessionData(this.configId);

    const baseEvent: Partial<EnhancedAnalyticsEvent> = {
      event: data.event,
      configId: this.configId,
      sessionId: sessionData?.sessionId || "",
      timestamp: new Date(),
      device: (sessionData?.device as DeviceType) || "desktop",
      utm: utmData?.utm || {},
      properties: {
        ...data.properties,
        product_id: data.productId,
        variant_id: data.variantId,
        category_id: data.categoryId,
        item_id: data.itemId,
        currency: data.currency,
        value: data.value,
        quantity: data.quantity,
        timestamp: new Date().toISOString(),
        session_duration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
      },
    };

    // Add optional properties only if they exist
    const enrichedEvent = {
      ...baseEvent,
      ...conditionalProps({
        blockId: data.blockId,
        layoutPreset: data.layoutPreset,
        variantId: data.variantId,
        experimentKey: data.experimentKey,
        country: undefined, // TODO: Add geo-location if needed
        userAgent: sessionData?.userAgent,
        referrer: sessionData?.referrer,
      }),
    };

    return enrichedEvent as EnhancedAnalyticsEvent;
  }

  /**
   * Send event to analytics endpoint
   */
  async sendEvent(eventData: EnhancedAnalyticsEvent): Promise<void> {
    try {
      const response = await fetch("/api/analytics/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status} ${response.statusText}`);
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics] Event sent:", eventData.event, eventData.properties);
      }
    } catch (error) {
      console.error("[Analytics] Failed to send event:", eventData.event, error);

      // Store failed events for retry (optional)
      this.storeFailedEvent(eventData);
    }
  }

  /**
   * Store failed events in localStorage for retry
   */
  private storeFailedEvent(eventData: EnhancedAnalyticsEvent) {
    try {
      const failedEvents = JSON.parse(localStorage.getItem("minimall_failed_events") || "[]");
      failedEvents.push({
        ...eventData,
        timestamp: eventData.timestamp.toISOString(),
        retryCount: 0,
      });

      // Keep only last 50 failed events
      if (failedEvents.length > 50) {
        failedEvents.splice(0, failedEvents.length - 50);
      }

      localStorage.setItem("minimall_failed_events", JSON.stringify(failedEvents));
    } catch (error) {
      console.warn("[Analytics] Failed to store failed event:", error);
    }
  }
}

/**
 * Retry failed events from localStorage
 */
export async function retryFailedEvents(configId: string) {
  try {
    const failedEvents = JSON.parse(localStorage.getItem("minimall_failed_events") || "[]");

    if (failedEvents.length === 0) return;

    const analytics = new EnhancedAnalytics(configId);
    const retryQueue = [];
    const failedRetries = [];

    for (const eventData of failedEvents) {
      if (eventData.retryCount < 3) {
        eventData.retryCount += 1;
        retryQueue.push(
          analytics.sendEvent({
            ...eventData,
            timestamp: new Date(eventData.timestamp),
          })
        );
      } else {
        // Give up after 3 retries
        failedRetries.push(eventData);
      }
    }

    await Promise.allSettled(retryQueue);

    // Update localStorage with only the events that still need retry
    localStorage.setItem("minimall_failed_events", JSON.stringify(failedRetries));
  } catch (error) {
    console.error("[Analytics] Failed to retry events:", error);
  }
}

/**
 * Global analytics instance factory
 */
export function createAnalytics(configId: string): EnhancedAnalytics {
  return new EnhancedAnalytics(configId);
}

/**
 * Intersection Observer for tracking tile impressions
 */
export function createImpressionTracker(
  analytics: EnhancedAnalytics,
  threshold = 0.5
): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const blockId = element.dataset.blockId;
          const itemId = element.dataset.itemId;
          const categoryId = element.dataset.categoryId;
          const layoutPreset = element.dataset.layoutPreset as LayoutPreset;

          if (blockId) {
            const impressionData: any = {
              configId: analytics["configId"],
              blockId,
              layoutPreset,
            };

            if (itemId) impressionData.itemId = itemId;
            if (categoryId) impressionData.categoryId = categoryId;

            analytics.trackTileImpression(impressionData);
          }
        }
      });
    },
    {
      threshold,
      rootMargin: "50px",
    }
  );
}

/**
 * Performance observer for Core Web Vitals
 */
export function setupPerformanceTracking(analytics: EnhancedAnalytics) {
  if (typeof window === "undefined") return;

  let lcp: number | undefined;
  let fid: number | undefined;
  let cls = 0;

  // Largest Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    if (lastEntry) {
      lcp = lastEntry.startTime;
    }
  }).observe({ entryTypes: ["largest-contentful-paint"] });

  // First Input Delay
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      fid = (entry as any).processingStart - entry.startTime;
    });
  }).observe({ entryTypes: ["first-input"] });

  // Cumulative Layout Shift
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (!(entry as any).hadRecentInput) {
        cls += (entry as any).value;
      }
    });
  }).observe({ entryTypes: ["layout-shift"] });

  // Send performance data when page is about to unload
  window.addEventListener("beforeunload", () => {
    const perfData: any = {
      cls,
      loadTime: performance.now(),
    };

    if (lcp !== undefined) perfData.lcp = lcp;
    if (fid !== undefined) perfData.fid = fid;

    analytics.trackPerformance(perfData);
  });
}
