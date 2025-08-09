import React from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import * as Sentry from '@sentry/react';
import type { PerformanceMetrics } from './types';

// Web Vitals thresholds (in milliseconds)
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Get performance rating based on thresholds
 */
function getPerformanceRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals to analytics endpoint
 */
async function reportWebVital(metric: VitalMetric, configId?: string) {
  try {
    // Send to analytics endpoint
    const body = JSON.stringify({
      configId,
      metric: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      delta: Math.round(metric.delta),
      id: metric.id,
      navigationType: metric.navigationType,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });

    // Send to internal analytics
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true, // Ensure the request completes even if the page is unloaded
    }).catch((error) => {
      console.warn('Failed to report web vital:', error);
    });

    // Also send to Sentry for monitoring
    Sentry.addBreadcrumb({
      category: 'web-vital',
      message: `${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`,
      level: metric.rating === 'poor' ? 'warning' : 'info',
      data: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        configId,
      },
    });

    // Send poor ratings as performance issues to Sentry
    if (metric.rating === 'poor') {
      Sentry.captureMessage(
        `Poor Web Vital: ${metric.name} = ${Math.round(metric.value)}ms`,
        'warning'
      );
    }
  } catch (error) {
    console.warn('Failed to report web vital:', error);
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export function initPerformanceMonitoring(configId?: string) {
  if (typeof window === 'undefined') return;

  // Collect and report Core Web Vitals
  getCLS((metric) => {
    reportWebVital(
      {
        ...metric,
        rating: getPerformanceRating('CLS', metric.value),
      },
      configId
    );
  });

  getFID((metric) => {
    reportWebVital(
      {
        ...metric,
        rating: getPerformanceRating('FID', metric.value),
      },
      configId
    );
  });

  getFCP((metric) => {
    reportWebVital(
      {
        ...metric,
        rating: getPerformanceRating('FCP', metric.value),
      },
      configId
    );
  });

  getLCP((metric) => {
    reportWebVital(
      {
        ...metric,
        rating: getPerformanceRating('LCP', metric.value),
      },
      configId
    );
  });

  getTTFB((metric) => {
    reportWebVital(
      {
        ...metric,
        rating: getPerformanceRating('TTFB', metric.value),
      },
      configId
    );
  });
}

/**
 * Manual performance measurement utilities
 */
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();

  /**
   * Start measuring a custom metric
   */
  start(name: string) {
    this.marks.set(name, performance.now());
  }

  /**
   * End measuring and get duration
   */
  end(name: string): number | null {
    const startTime = this.marks.get(name);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    // Report to analytics
    this.reportCustomMetric(name, duration);

    return duration;
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  private async reportCustomMetric(name: string, duration: number) {
    try {
      await fetch('/api/analytics/custom-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          duration: Math.round(duration),
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
        keepalive: true,
      });
    } catch (error) {
      console.warn('Failed to report custom metric:', error);
    }
  }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker();

/**
 * React hook for performance tracking
 */
export function usePerformanceTracking() {
  const tracker = performanceTracker;

  const trackComponentMount = (componentName: string) => {
    React.useEffect(() => {
      const mountTime = performance.now();
      
      return () => {
        const duration = performance.now() - mountTime;
        tracker['reportCustomMetric'](`component-${componentName}-mount`, duration);
      };
    }, [componentName]);
  };

  const trackAsyncOperation = async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
    return tracker.measure(name, operation);
  };

  return {
    trackComponentMount,
    trackAsyncOperation,
    start: tracker.start.bind(tracker),
    end: tracker.end.bind(tracker),
  };
}

/**
 * Performance budget validation
 */
export function validatePerformanceBudgets(metrics: Partial<PerformanceMetrics>) {
  const budgets = {
    LCP: 1500, // 1.5s
    FID: 120,  // 120ms
    CLS: 0.1,  // 0.1
    TTFB: 200, // 200ms
  };

  const violations: string[] = [];

  if (metrics.lcp && metrics.lcp > budgets.LCP) {
    violations.push(`LCP exceeded budget: ${metrics.lcp}ms > ${budgets.LCP}ms`);
  }

  if (metrics.fid && metrics.fid > budgets.FID) {
    violations.push(`FID exceeded budget: ${metrics.fid}ms > ${budgets.FID}ms`);
  }

  if (metrics.cls && metrics.cls > budgets.CLS) {
    violations.push(`CLS exceeded budget: ${metrics.cls} > ${budgets.CLS}`);
  }

  if (metrics.ttfb && metrics.ttfb > budgets.TTFB) {
    violations.push(`TTFB exceeded budget: ${metrics.ttfb}ms > ${budgets.TTFB}ms`);
  }

  if (violations.length > 0) {
    Sentry.captureMessage(
      `Performance Budget Violations: ${violations.join(', ')}`,
      'warning'
    );
  }

  return violations;
}

/**
 * Resource timing analysis
 */
export function analyzeResourceTiming() {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource');
  const analysis = {
    totalResources: resources.length,
    slowResources: [],
    largeResources: [],
    failedResources: [],
  };

  for (const resource of resources) {
    const entry = resource as PerformanceResourceTiming;
    
    // Identify slow resources (>2s)
    if (entry.duration > 2000) {
      (analysis.slowResources as Array<{ name: string; duration: number }>).push({
        name: entry.name,
        duration: entry.duration,
      });
    }

    // Identify large resources (>1MB estimated)
    if (entry.transferSize && entry.transferSize > 1024 * 1024) {
      (analysis.largeResources as Array<{ name: string; size: number }>).push({
        name: entry.name,
        size: entry.transferSize,
      });
    }

    // Check for failed resources
    if (entry.transferSize === 0 && entry.duration > 0) {
      (analysis.failedResources as Array<{ name: string; duration: number }>).push({
        name: entry.name,
        duration: entry.duration,
      });
    }
  }

  // Report analysis to Sentry if issues found
  if (analysis.slowResources.length > 0 || analysis.largeResources.length > 0) {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: 'Resource timing analysis completed',
      data: analysis,
      level: 'info',
    });
  }

  return analysis;
}