import * as Sentry from "@sentry/react";
import { performanceTracker } from "./performance";

interface RUMConfig {
  configId?: string;
  userId?: string;
  sessionId?: string;
  enableConsoleLogging?: boolean;
  enableResourceTiming?: boolean;
  enableNavigationTiming?: boolean;
  enableUserInteractions?: boolean;
  sampleRate?: number;
}

interface UserInteraction {
  type: "click" | "scroll" | "navigation" | "resize" | "focus" | "blur";
  target?: string;
  timestamp: number;
  data?: Record<string, any> | undefined;
}

class RealUserMonitoring {
  private config: RUMConfig;
  private interactions: UserInteraction[] = [];
  private sessionStartTime: number;
  private isActive = false;

  constructor(config: RUMConfig = {}) {
    this.config = {
      enableConsoleLogging: false,
      enableResourceTiming: true,
      enableNavigationTiming: true,
      enableUserInteractions: true,
      sampleRate: 1.0,
      ...config,
    };

    this.sessionStartTime = performance.now();

    // Generate session ID if not provided
    if (!this.config.sessionId) {
      this.config.sessionId = `rum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Initialize RUM tracking
   */
  public init(): void {
    if (typeof window === "undefined") return;

    // Check sampling rate
    if (Math.random() > (this.config.sampleRate || 1.0)) {
      return; // Skip tracking based on sample rate
    }

    this.isActive = true;

    if (this.config.enableNavigationTiming) {
      this.trackNavigationTiming();
    }

    if (this.config.enableResourceTiming) {
      this.trackResourceTiming();
    }

    if (this.config.enableUserInteractions) {
      this.setupUserInteractionTracking();
    }

    // Track page visibility changes
    this.setupVisibilityTracking();

    // Track unload events
    this.setupUnloadTracking();

    // Track JavaScript errors
    this.setupErrorTracking();

    // Send periodic reports
    this.startPeriodicReporting();

    this.log("RUM tracking initialized", { sessionId: this.config.sessionId });
  }

  /**
   * Track navigation timing
   */
  private trackNavigationTiming(): void {
    if (typeof window === "undefined" || !window.performance?.timing) return;

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    const navigationMetrics = {
      type:
        navigation?.type === 1 ? "reload" : navigation?.type === 2 ? "back_forward" : "navigate",
      redirectCount: navigation?.redirectCount || 0,

      // Time to first byte
      ttfb: timing.responseStart - timing.navigationStart,

      // DNS lookup time
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,

      // TCP connection time
      connectTime: timing.connectEnd - timing.connectStart,

      // Request/response time
      requestTime: timing.responseEnd - timing.requestStart,

      // DOM processing time
      domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,

      // Full load time
      loadTime: timing.loadEventEnd - timing.navigationStart,

      // DOM processing
      domProcessingTime: timing.domComplete - timing.domLoading,
    };

    this.sendEvent("navigation_timing", navigationMetrics);
  }

  /**
   * Track resource timing
   */
  private trackResourceTiming(): void {
    if (typeof window === "undefined" || !window.performance?.getEntriesByType) return;

    // Track resources periodically
    setInterval(() => {
      const resources = window.performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      const slowResources = resources.filter((resource) => resource.duration > 1000); // > 1s

      if (slowResources.length > 0) {
        this.sendEvent("slow_resources", {
          resources: slowResources.slice(-10).map((resource) => ({
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize,
            type: resource.initiatorType,
          })),
        });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup user interaction tracking
   */
  private setupUserInteractionTracking(): void {
    if (typeof window === "undefined") return;

    // Click tracking
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target as HTMLElement;
        this.addInteraction("click", {
          target: this.getElementSelector(target),
          x: event.clientX,
          y: event.clientY,
        });
      },
      { passive: true }
    );

    // Scroll tracking (throttled)
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener(
      "scroll",
      () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.addInteraction("scroll", {
            scrollY: window.scrollY,
            scrollHeight: document.documentElement.scrollHeight,
            viewportHeight: window.innerHeight,
            scrollPercent: Math.round(
              (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            ),
          });
        }, 100);
      },
      { passive: true }
    );

    // Resize tracking
    window.addEventListener(
      "resize",
      () => {
        this.addInteraction("resize", {
          width: window.innerWidth,
          height: window.innerHeight,
        });
      },
      { passive: true }
    );

    // Focus/blur tracking
    window.addEventListener("focus", () => {
      this.addInteraction("focus");
    });

    window.addEventListener("blur", () => {
      this.addInteraction("blur");
    });
  }

  /**
   * Setup visibility tracking
   */
  private setupVisibilityTracking(): void {
    if (typeof document === "undefined") return;

    let visibilityStart = performance.now();

    document.addEventListener("visibilitychange", () => {
      const now = performance.now();

      if (document.hidden) {
        // Page became hidden
        const visibleTime = now - visibilityStart;
        this.sendEvent("page_visibility", {
          action: "hidden",
          visibleTime: Math.round(visibleTime),
        });
      } else {
        // Page became visible
        visibilityStart = now;
        this.sendEvent("page_visibility", {
          action: "visible",
        });
      }
    });
  }

  /**
   * Setup unload tracking
   */
  private setupUnloadTracking(): void {
    if (typeof window === "undefined") return;

    const sendFinalReport = () => {
      const sessionDuration = performance.now() - this.sessionStartTime;
      this.sendEvent(
        "session_end",
        {
          sessionDuration: Math.round(sessionDuration),
          interactions: this.interactions.length,
          url: window.location.href,
        },
        true
      ); // Force send
    };

    // Use both beforeunload and pagehide for better coverage
    window.addEventListener("beforeunload", sendFinalReport);
    window.addEventListener("pagehide", sendFinalReport);
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    if (typeof window === "undefined") return;

    // JavaScript errors
    window.addEventListener("error", (event) => {
      this.sendEvent("javascript_error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href,
      });
    });

    // Unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.sendEvent("unhandled_rejection", {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        url: window.location.href,
      });
    });
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(): void {
    // Send interaction summary every minute
    setInterval(() => {
      if (this.interactions.length > 0) {
        this.sendInteractionSummary();
      }
    }, 60000);

    // Send memory usage if available
    setInterval(() => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        this.sendEvent("memory_usage", {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        });
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Add user interaction
   */
  private addInteraction(type: UserInteraction["type"], data?: Record<string, any>): void {
    if (!this.isActive) return;

    this.interactions.push({
      type,
      timestamp: performance.now(),
      data,
    });

    // Keep only last 100 interactions
    if (this.interactions.length > 100) {
      this.interactions = this.interactions.slice(-100);
    }
  }

  /**
   * Send interaction summary
   */
  private sendInteractionSummary(): void {
    const summary = this.interactions.reduce(
      (acc, interaction) => {
        acc[interaction.type] = (acc[interaction.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    this.sendEvent("interaction_summary", {
      interactions: summary,
      totalInteractions: this.interactions.length,
      timeframe: "1m",
    });

    // Clear interactions after sending summary
    this.interactions = [];
  }

  /**
   * Send event to analytics endpoint
   */
  private sendEvent(eventType: string, data: Record<string, any>, forceSync = false): void {
    if (!this.isActive) return;

    const payload = {
      event: `rum_${eventType}`,
      configId: this.config.configId,
      userId: this.config.userId,
      sessionId: this.config.sessionId,
      properties: {
        ...data,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        sessionDuration: Math.round(performance.now() - this.sessionStartTime),
      },
    };

    // Send to analytics endpoint
    const sendRequest = () => {
      fetch("/api/analytics/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: forceSync, // Ensure request completes during unload
      }).catch((error) => {
        this.log("Failed to send RUM event:", error);
      });
    };

    if (forceSync && navigator.sendBeacon) {
      // Use sendBeacon for reliable delivery during unload
      navigator.sendBeacon("/api/analytics/events", JSON.stringify(payload));
    } else {
      sendRequest();
    }

    this.log(`RUM Event: ${eventType}`, data);
  }

  /**
   * Get element selector for tracking
   */
  private getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      return `.${element.className.split(" ")[0]}`;
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: unknown): void {
    if (this.config.enableConsoleLogging) {
      console.log(`[RUM] ${message}`, data);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<RUMConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Stop RUM tracking
   */
  public stop(): void {
    this.isActive = false;
  }

  /**
   * Get session information
   */
  public getSession(): { sessionId: string; duration: number; interactions: number } {
    return {
      sessionId: this.config.sessionId || "unknown",
      duration: Math.round(performance.now() - this.sessionStartTime),
      interactions: this.interactions.length,
    };
  }
}

// Export singleton instance
export const rum = new RealUserMonitoring();

// Export class for custom instances
export { RealUserMonitoring };

// Export types
export type { RUMConfig, UserInteraction };
