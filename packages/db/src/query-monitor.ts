interface QueryMetrics {
  query: string;
  duration: number;
  params: unknown[] | undefined;
  timestamp: Date;
  stack: string | undefined;
}

class QueryMonitor {
  private slowQueries: QueryMetrics[] = [];
  private slowThreshold: number;
  private maxHistorySize: number;

  constructor(slowThreshold = 1000, maxHistorySize = 100) {
    this.slowThreshold = slowThreshold; // milliseconds
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Monitor a query execution
   */
  async measureQuery<T>(
    queryFn: () => Promise<T>,
    queryDescription: string,
    params?: unknown[]
  ): Promise<T> {
    const startTime = Date.now();
    const stack = new Error().stack;

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > this.slowThreshold) {
        const metrics: QueryMetrics = {
          query: queryDescription,
          duration,
          params,
          timestamp: new Date(),
          stack: stack?.split("\n").slice(1, 6).join("\n"), // First 5 stack frames
        };

        this.recordSlowQuery(metrics);
        this.logSlowQuery(metrics);
      }

      // Always log query info in development
      if (process.env.NODE_ENV === "development" && process.env.DB_DEBUG === "true") {
        console.log(`🔍 Query executed in ${duration}ms: ${queryDescription}`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Query failed after ${duration}ms: ${queryDescription}`, {
        error: error instanceof Error ? error.message : "Unknown error",
        params,
      });
      throw error;
    }
  }

  /**
   * Record slow query for analysis
   */
  private recordSlowQuery(metrics: QueryMetrics): void {
    this.slowQueries.push(metrics);

    // Maintain history size limit
    if (this.slowQueries.length > this.maxHistorySize) {
      this.slowQueries.shift();
    }
  }

  /**
   * Log slow query with details
   */
  private logSlowQuery(metrics: QueryMetrics): void {
    console.warn(`🐌 Slow query detected (${metrics.duration}ms):`, {
      query: metrics.query,
      duration: `${metrics.duration}ms`,
      timestamp: metrics.timestamp.toISOString(),
      params: metrics.params,
      stack: metrics.stack,
    });

    // Send to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      this.reportToMonitoring(metrics);
    }
  }

  /**
   * Report slow query to external monitoring (implement as needed)
   */
  private reportToMonitoring(metrics: QueryMetrics): void {
    // This could integrate with Sentry, DataDog, New Relic, etc.
    try {
      if (typeof window === "undefined") {
        // Server-side: Use Sentry if available
        const Sentry = require("@sentry/nextjs");
        if (Sentry) {
          Sentry.addBreadcrumb({
            category: "database",
            message: `Slow query: ${metrics.query}`,
            data: {
              duration: metrics.duration,
              params: metrics.params,
            },
            level: "warning",
          });
        }
      }
    } catch {
      // Silently fail if monitoring is not available
    }
  }

  /**
   * Get slow query statistics
   */
  getSlowQueryStats(): {
    totalSlowQueries: number;
    averageDuration: number;
    slowestQuery: QueryMetrics | null;
    recentSlowQueries: QueryMetrics[];
  } {
    if (this.slowQueries.length === 0) {
      return {
        totalSlowQueries: 0,
        averageDuration: 0,
        slowestQuery: null,
        recentSlowQueries: [],
      };
    }

    const totalDuration = this.slowQueries.reduce((sum, q) => sum + q.duration, 0);
    const averageDuration = totalDuration / this.slowQueries.length;
    const slowestQuery = this.slowQueries.reduce((slowest, current) =>
      current.duration > slowest.duration ? current : slowest
    );

    return {
      totalSlowQueries: this.slowQueries.length,
      averageDuration: Math.round(averageDuration),
      slowestQuery,
      recentSlowQueries: this.slowQueries.slice(-10), // Last 10 slow queries
    };
  }

  /**
   * Clear slow query history
   */
  clearHistory(): void {
    this.slowQueries = [];
  }

  /**
   * Update slow query threshold
   */
  setSlowThreshold(milliseconds: number): void {
    this.slowThreshold = milliseconds;
  }
}

// Create singleton instance
export const queryMonitor = new QueryMonitor(
  // Configurable slow query threshold (default 1000ms)
  Number(process.env.SLOW_QUERY_THRESHOLD) || 1000,
  // Configurable history size (default 100 queries)
  Number(process.env.QUERY_HISTORY_SIZE) || 100
);

/**
 * Decorator for monitoring database queries
 */
export function monitorQuery<T extends unknown[], R>(_queryDescription: string) {
  return (
    target: unknown,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) => {
    const method = descriptor.value;
    if (!method) return;

    descriptor.value = async function (...args: T): Promise<R> {
      return queryMonitor.measureQuery(
        () => method.apply(this, args),
        `${(target as Record<string, unknown>)?.constructor?.name || "Unknown"}.${propertyName}`,
        args
      );
    };
  };
}

/**
 * Utility to wrap any query function with monitoring
 */
export async function withQueryMonitoring<T>(
  queryFn: () => Promise<T>,
  description: string,
  params?: unknown[]
): Promise<T> {
  return queryMonitor.measureQuery(queryFn, description, params);
}
