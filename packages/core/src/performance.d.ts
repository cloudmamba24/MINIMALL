import type { PerformanceMetrics } from "./types";
export declare const WEB_VITALS_THRESHOLDS: {
    readonly LCP: {
        readonly good: 2500;
        readonly poor: 4000;
    };
    readonly FID: {
        readonly good: 100;
        readonly poor: 300;
    };
    readonly CLS: {
        readonly good: 0.1;
        readonly poor: 0.25;
    };
    readonly FCP: {
        readonly good: 1800;
        readonly poor: 3000;
    };
    readonly TTFB: {
        readonly good: 800;
        readonly poor: 1800;
    };
};
/**
 * Initialize Web Vitals monitoring
 */
export declare function initPerformanceMonitoring(configId?: string): void;
/**
 * Manual performance measurement utilities
 */
export declare class PerformanceTracker {
    private marks;
    /**
     * Start measuring a custom metric
     */
    start(name: string): void;
    /**
     * End measuring and get duration
     */
    end(name: string): number | null;
    /**
     * Measure a function execution time
     */
    measure<T>(name: string, fn: () => Promise<T>): Promise<T>;
    private reportCustomMetric;
}
export declare const performanceTracker: PerformanceTracker;
/**
 * React hook for performance tracking
 */
export declare function usePerformanceTracking(): {
    trackComponentMount: (componentName: string) => void;
    trackAsyncOperation: <T>(name: string, operation: () => Promise<T>) => Promise<T>;
    start: (name: string) => void;
    end: (name: string) => number | null;
};
/**
 * Performance budget validation
 */
export declare function validatePerformanceBudgets(metrics: Partial<PerformanceMetrics>): string[];
/**
 * Resource timing analysis
 */
export declare function analyzeResourceTiming(): {
    totalResources: number;
    slowResources: never[];
    largeResources: never[];
    failedResources: never[];
} | undefined;
//# sourceMappingURL=performance.d.ts.map