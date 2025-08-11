/**
 * Simple experiment router replacement
 * This is a minimal implementation to replace the deleted experiment-router
 */

export interface ExperimentContext {
  configId: string;
  sessionId: string;
  device: "mobile" | "tablet" | "desktop";
  key?: string;
  variant?: string;
  metadata: Record<string, unknown>;
}

/**
 * Route experiment - simplified to always return default variant
 */
export function routeExperiment(
  experimentKey: string,
  variants: string[] = ["default"],
  context?: Record<string, unknown>
): ExperimentContext {
  // For now, always return the first variant (usually 'default')
  return {
    configId: "default-config",
    sessionId: "anonymous",
    device: "desktop",
    key: experimentKey,
    variant: variants[0] || "default",
    metadata: context || {},
  };
}

/**
 * Track experiment exposure - simplified to console log in development
 */
export function trackExperimentExposure(
  experimentKey: string,
  variant: string,
  metadata?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Experiment] ${experimentKey}: ${variant}`, metadata);
  }

  // In production, this could send to analytics service
  // For now, it's a no-op to prevent build failures
}

/**
 * Get experiment variant for a given key
 */
export function getExperimentVariant(experimentKey: string, defaultVariant = "default"): string {
  // Simplified - always return default variant
  return defaultVariant;
}
