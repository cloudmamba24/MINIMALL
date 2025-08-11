/**
 * Performance Monitoring Utilities
 *
 * Advanced Web Vitals tracking, performance budgets, and real user monitoring
 * for production optimization of the MINIMALL platform.
 */

import { z } from "zod";

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: Date;
  url: string;
  userAgent?: string;
  connection?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
}

export interface WebVitalsMetrics {
  CLS: PerformanceMetric | null; // Cumulative Layout Shift
  FCP: PerformanceMetric | null; // First Contentful Paint
  FID: PerformanceMetric | null; // First Input Delay
  INP: PerformanceMetric | null; // Interaction to Next Paint
  LCP: PerformanceMetric | null; // Largest Contentful Paint
  TTFB: PerformanceMetric | null; // Time to First Byte
}

export interface PerformanceBudget {
  metric: string;
  threshold: number;
  alert: boolean;
  budget: number; // Budget allowance
}

export interface PerformanceSession {
  id: string;
  url: string;
  timestamp: Date;
  userAgent: string;
  metrics: WebVitalsMetrics;
  customMetrics: Record<string, number>;
  errors: Array<{
    message: string;
    stack?: string;
    timestamp: Date;
  }>;
  pageLoadTime: number;
  domInteractiveTime: number;
  resourceTimings: PerformanceResourceTiming[];
}

const performanceMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  rating: z.enum(["good", "needs-improvement", "poor"]),
  timestamp: z.coerce.date(),
  url: z.string(),
  userAgent: z.string().optional(),
  connection: z.string().optional(),
  deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
});

// Performance thresholds based on Core Web Vitals
const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 }, // milliseconds
  FID: { good: 100, poor: 300 }, // milliseconds
  INP: { good: 200, poor: 500 }, // milliseconds
  LCP: { good: 2500, poor: 4000 }, // milliseconds
  TTFB: { good: 800, poor: 1800 }, // milliseconds
};

/**
 * Get performance rating for a metric
 */
export function getPerformanceRating(
  metricName: string,
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds = PERFORMANCE_THRESHOLDS[metricName as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!thresholds) return "good";

  if (value <= thresholds.good) return "good";
  if (value <= thresholds.poor) return "needs-improvement";
  return "poor";
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(
  options: {
    apiEndpoint?: string;
    sampleRate?: number; // 0-1, percentage of sessions to monitor
    debug?: boolean;
    customMetrics?: string[];
  } = {}
): void {
  const {
    apiEndpoint = "/api/performance",
    sampleRate = 0.1,
    debug = false,
    customMetrics = [],
  } = options;

  // Only monitor a sample of sessions to reduce overhead
  if (Math.random() > sampleRate) {
    if (debug) console.log("[Performance] Skipping monitoring for this session");
    return;
  }

  if (typeof window === "undefined") return; // Server-side guard

  const session: Partial<PerformanceSession> = {
    id: generateSessionId(),
    url: window.location.href,
    timestamp: new Date(),
    userAgent: navigator.userAgent,
    metrics: {
      CLS: null,
      FCP: null,
      FID: null,
      INP: null,
      LCP: null,
      TTFB: null,
    },
    customMetrics: {},
    errors: [],
    pageLoadTime: 0,
    domInteractiveTime: 0,
    resourceTimings: [],
  };

  // Track Web Vitals
  trackWebVitals(session, debug);

  // Track custom metrics
  trackCustomMetrics(session, customMetrics);

  // Track page load timing
  trackPageLoadTiming(session);

  // Track resource timing
  trackResourceTiming(session);

  // Track errors
  trackErrors(session);

  // Send data on page unload or after a delay
  scheduleDataTransmission(session, apiEndpoint, debug);
}

/**
 * Track Core Web Vitals using Web Vitals library concepts
 */
function trackWebVitals(session: Partial<PerformanceSession>, debug: boolean): void {
  if (!session.metrics) return;

  // Track LCP (Largest Contentful Paint)
  if ("PerformanceObserver" in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        if (lastEntry && session.metrics) {
          const metric: PerformanceMetric = {
            name: "LCP",
            value: lastEntry.startTime,
            rating: getPerformanceRating("LCP", lastEntry.startTime),
            timestamp: new Date(),
            url: window.location.href,
            deviceType: getDeviceType(),
          };

          session.metrics.LCP = metric;
          if (debug) console.log("[Performance] LCP:", metric);
        }
      });

      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch (error) {
      if (debug) console.warn("[Performance] LCP tracking failed:", error);
    }

    // Track FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0];

        if (firstEntry && session.metrics) {
          const fidValue = (firstEntry as any).processingStart - firstEntry.startTime;
          const metric: PerformanceMetric = {
            name: "FID",
            value: fidValue,
            rating: getPerformanceRating("FID", fidValue),
            timestamp: new Date(),
            url: window.location.href,
            deviceType: getDeviceType(),
          };

          session.metrics.FID = metric;
          if (debug) console.log("[Performance] FID:", metric);
        }
      });

      fidObserver.observe({ type: "first-input", buffered: true });
    } catch (error) {
      if (debug) console.warn("[Performance] FID tracking failed:", error);
    }

    // Track CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }

        if (session.metrics) {
          const metric: PerformanceMetric = {
            name: "CLS",
            value: clsValue,
            rating: getPerformanceRating("CLS", clsValue),
            timestamp: new Date(),
            url: window.location.href,
            deviceType: getDeviceType(),
          };

          session.metrics.CLS = metric;
          if (debug) console.log("[Performance] CLS:", metric);
        }
      });

      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch (error) {
      if (debug) console.warn("[Performance] CLS tracking failed:", error);
    }
  }

  // Track FCP and TTFB using Navigation Timing
  if ("performance" in window && window.performance.getEntriesByType) {
    setTimeout(() => {
      const navEntries = window.performance.getEntriesByType("navigation");
      if (navEntries.length > 0 && session.metrics) {
        const navTiming = navEntries[0] as PerformanceNavigationTiming;

        // TTFB
        const ttfb = navTiming.responseStart - navTiming.requestStart;
        session.metrics.TTFB = {
          name: "TTFB",
          value: ttfb,
          rating: getPerformanceRating("TTFB", ttfb),
          timestamp: new Date(),
          url: window.location.href,
          deviceType: getDeviceType(),
        };

        // FCP (approximated)
        const paintEntries = window.performance.getEntriesByType("paint");
        const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint");
        if (fcpEntry) {
          session.metrics.FCP = {
            name: "FCP",
            value: fcpEntry.startTime,
            rating: getPerformanceRating("FCP", fcpEntry.startTime),
            timestamp: new Date(),
            url: window.location.href,
            deviceType: getDeviceType(),
          };
        }

        if (debug) {
          console.log("[Performance] TTFB:", session.metrics.TTFB);
          console.log("[Performance] FCP:", session.metrics.FCP);
        }
      }
    }, 0);
  }
}

/**
 * Track custom performance metrics
 */
function trackCustomMetrics(session: Partial<PerformanceSession>, customMetrics: string[]): void {
  if (!session.customMetrics) return;

  for (const metricName of customMetrics) {
    // Track custom timing marks
    if ("performance" in window && window.performance.getEntriesByName) {
      const marks = window.performance.getEntriesByName(metricName);
      if (marks.length > 0 && marks[0]) {
        session.customMetrics[metricName] = marks[0].startTime;
      }
    }
  }
}

/**
 * Track page load timing
 */
function trackPageLoadTiming(session: Partial<PerformanceSession>): void {
  if ("performance" in window && window.performance.timing) {
    const timing = window.performance.timing;
    session.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    session.domInteractiveTime = timing.domInteractive - timing.navigationStart;
  }
}

/**
 * Track resource timing
 */
function trackResourceTiming(session: Partial<PerformanceSession>): void {
  if ("performance" in window && window.performance.getEntriesByType) {
    setTimeout(() => {
      const resourceEntries = window.performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];

      // Filter and limit resource entries to avoid large payloads
      const importantResources = resourceEntries
        .filter((entry) => {
          // Focus on important resources
          return (
            entry.initiatorType === "img" ||
            entry.initiatorType === "script" ||
            entry.initiatorType === "css" ||
            entry.name.includes(".js") ||
            entry.name.includes(".css")
          );
        })
        .slice(0, 20); // Limit to 20 resources

      if (session.resourceTimings) {
        session.resourceTimings = importantResources;
      }
    }, 1000); // Wait 1 second for resources to load
  }
}

/**
 * Track JavaScript errors
 */
function trackErrors(session: Partial<PerformanceSession>): void {
  if (!session.errors) return;

  // Track uncaught errors
  window.addEventListener("error", (event) => {
    session.errors!.push({
      message: event.message,
      stack: event.error?.stack,
      timestamp: new Date(),
    });
  });

  // Track unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    session.errors!.push({
      message: `Unhandled Promise Rejection: ${event.reason}`,
      timestamp: new Date(),
    });
  });
}

/**
 * Schedule data transmission
 */
function scheduleDataTransmission(
  session: Partial<PerformanceSession>,
  apiEndpoint: string,
  debug: boolean
): void {
  const transmitData = () => {
    if (debug) console.log("[Performance] Transmitting session data:", session);

    // Use sendBeacon for reliability during page unload
    if ("navigator" in window && navigator.sendBeacon) {
      const success = navigator.sendBeacon(apiEndpoint, JSON.stringify(session));
      if (debug) console.log("[Performance] Beacon sent:", success);
    } else {
      // Fallback to fetch with keepalive
      fetch(apiEndpoint, {
        method: "POST",
        body: JSON.stringify(session),
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch((error) => {
        if (debug) console.warn("[Performance] Failed to send data:", error);
      });
    }
  };

  // Send data on page unload
  window.addEventListener("beforeunload", transmitData);
  window.addEventListener("pagehide", transmitData);

  // Also send data after a delay to capture metrics
  setTimeout(transmitData, 5000); // 5 seconds
}

/**
 * Get device type based on screen size and user agent
 */
function getDeviceType(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth || document.documentElement.clientWidth;
  const userAgent = navigator.userAgent.toLowerCase();

  if (width <= 768 || /mobile|android|iphone/.test(userAgent)) {
    return "mobile";
  } else if (width <= 1024 || /tablet|ipad/.test(userAgent)) {
    return "tablet";
  }

  return "desktop";
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create performance mark for custom timing
 */
export function markPerformance(name: string): void {
  if ("performance" in window && window.performance.mark) {
    window.performance.mark(name);
  }
}

/**
 * Measure performance between two marks
 */
export function measurePerformance(
  name: string,
  startMark?: string,
  endMark?: string
): number | null {
  if ("performance" in window && window.performance.measure) {
    try {
      window.performance.measure(name, startMark, endMark);
      const measures = window.performance.getEntriesByName(name);
      const lastMeasure = measures[measures.length - 1];
      return measures.length > 0 && lastMeasure ? lastMeasure.duration : null;
    } catch (error) {
      console.warn("[Performance] Failed to measure:", error);
      return null;
    }
  }
  return null;
}

/**
 * Get current performance budget status
 */
export function checkPerformanceBudget(
  metrics: WebVitalsMetrics,
  budgets: PerformanceBudget[]
): Array<{ budget: PerformanceBudget; status: "pass" | "warning" | "fail"; currentValue: number }> {
  const results = [];

  for (const budget of budgets) {
    const metric = metrics[budget.metric as keyof WebVitalsMetrics];
    if (!metric) continue;

    const currentValue = metric.value;
    let status: "pass" | "warning" | "fail" = "pass";

    if (currentValue > budget.threshold) {
      status = "fail";
    } else if (currentValue > budget.threshold * 0.8) {
      // Warning at 80% of threshold
      status = "warning";
    }

    results.push({
      budget,
      status,
      currentValue,
    });
  }

  return results;
}

/**
 * Get default performance budgets
 */
export function getDefaultPerformanceBudgets(): PerformanceBudget[] {
  return [
    { metric: "LCP", threshold: 2500, alert: true, budget: 2000 },
    { metric: "FID", threshold: 100, alert: true, budget: 80 },
    { metric: "CLS", threshold: 0.1, alert: true, budget: 0.05 },
    { metric: "FCP", threshold: 1800, alert: false, budget: 1500 },
    { metric: "TTFB", threshold: 800, alert: false, budget: 600 },
  ];
}

/**
 * Calculate performance score (0-100)
 */
export function calculatePerformanceScore(metrics: WebVitalsMetrics): number {
  const scores = [];

  // Core Web Vitals have higher weights
  if (metrics.LCP) {
    const lcpScore = metrics.LCP.value <= 2500 ? 100 : metrics.LCP.value <= 4000 ? 50 : 0;
    scores.push(lcpScore * 0.25); // 25% weight
  }

  if (metrics.FID) {
    const fidScore = metrics.FID.value <= 100 ? 100 : metrics.FID.value <= 300 ? 50 : 0;
    scores.push(fidScore * 0.25); // 25% weight
  }

  if (metrics.CLS) {
    const clsScore = metrics.CLS.value <= 0.1 ? 100 : metrics.CLS.value <= 0.25 ? 50 : 0;
    scores.push(clsScore * 0.25); // 25% weight
  }

  if (metrics.FCP) {
    const fcpScore = metrics.FCP.value <= 1800 ? 100 : metrics.FCP.value <= 3000 ? 50 : 0;
    scores.push(fcpScore * 0.15); // 15% weight
  }

  if (metrics.TTFB) {
    const ttfbScore = metrics.TTFB.value <= 800 ? 100 : metrics.TTFB.value <= 1800 ? 50 : 0;
    scores.push(ttfbScore * 0.1); // 10% weight
  }

  return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) : 0;
}

/**
 * Get performance recommendations based on metrics
 */
export function getPerformanceRecommendations(metrics: WebVitalsMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.LCP && metrics.LCP.rating !== "good") {
    recommendations.push(
      "Optimize Largest Contentful Paint by reducing server response times, preloading critical resources, and optimizing images"
    );
  }

  if (metrics.FID && metrics.FID.rating !== "good") {
    recommendations.push(
      "Improve First Input Delay by reducing JavaScript execution time, removing unused code, and using code splitting"
    );
  }

  if (metrics.CLS && metrics.CLS.rating !== "good") {
    recommendations.push(
      "Fix Cumulative Layout Shift by setting explicit dimensions on images and videos, avoiding dynamic content insertion"
    );
  }

  if (metrics.FCP && metrics.FCP.rating !== "good") {
    recommendations.push(
      "Speed up First Contentful Paint by optimizing the critical rendering path and reducing render-blocking resources"
    );
  }

  if (metrics.TTFB && metrics.TTFB.rating !== "good") {
    recommendations.push(
      "Reduce Time to First Byte by optimizing server performance, using CDN, and enabling caching"
    );
  }

  return recommendations;
}
