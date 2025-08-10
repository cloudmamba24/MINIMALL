import { Category, ExperimentConfig, LayoutConfig } from "@minimall/core/types";

/**
 * A/B Testing Experiment Router
 * 
 * This module handles traffic splitting for layout experiments,
 * ensuring consistent user experiences and proper analytics tracking.
 */

export interface ExperimentContext {
  configId: string;
  sessionId: string;
  userId?: string;
  device: 'mobile' | 'tablet' | 'desktop';
}

export interface ExperimentResult {
  experimentKey: string;
  variantId: string;
  isControl: boolean;
  trafficPercent: number;
  selectedLayout: LayoutConfig;
}

/**
 * Route user to experiment variant based on traffic splitting rules
 */
export function routeExperiment(
  category: Category,
  experiments: ExperimentConfig[],
  context: ExperimentContext
): ExperimentResult | null {
  // Find active experiments targeting this category's block
  if (!category.layout?.blockId) {
    return null;
  }

  const activeExperiments = experiments.filter(exp => 
    exp.status === 'running' &&
    exp.targets.some(target => target.blockId === category.layout!.blockId) &&
    isExperimentActive(exp)
  );

  if (activeExperiments.length === 0) {
    return null;
  }

  // For multiple experiments, use the first one (in practice, avoid overlapping experiments)
  const experiment = activeExperiments[0];
  const target = experiment.targets.find(t => t.blockId === category.layout!.blockId);
  
  if (!target) {
    return null;
  }

  // Generate consistent hash for this user/session + experiment
  const userHash = generateUserHash(context, experiment.key);
  const hashPercent = userHash % 100;

  // Determine if user gets the variant
  const getsVariant = hashPercent < target.variantPercent;
  const trafficPercent = getsVariant ? target.variantPercent : (100 - target.variantPercent);

  // For this implementation, we'll assume the variant modifies the layout
  // In a more complex system, variants could be stored separately
  const selectedLayout = getsVariant 
    ? applyExperimentVariant(category.layout!, experiment)
    : category.layout!;

  return {
    experimentKey: experiment.key,
    variantId: getsVariant ? 'variant' : 'control',
    isControl: !getsVariant,
    trafficPercent,
    selectedLayout,
  };
}

/**
 * Check if an experiment is currently active based on date range
 */
function isExperimentActive(experiment: ExperimentConfig): boolean {
  const now = new Date();
  
  if (experiment.startDate) {
    const startDate = new Date(experiment.startDate);
    if (now < startDate) return false;
  }
  
  if (experiment.endDate) {
    const endDate = new Date(experiment.endDate);
    if (now > endDate) return false;
  }
  
  return true;
}

/**
 * Generate consistent hash for user + experiment combination
 * This ensures the same user always gets the same variant
 */
function generateUserHash(context: ExperimentContext, experimentKey: string): number {
  const identifier = context.userId || context.sessionId;
  const hashString = `${identifier}-${experimentKey}-${context.configId}`;
  
  // Simple hash function - in production, consider using a more robust hash
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash);
}

/**
 * Apply experiment variant to a layout configuration
 * This is where you'd define what changes for each experiment
 */
function applyExperimentVariant(
  baseLayout: LayoutConfig, 
  experiment: ExperimentConfig
): LayoutConfig {
  // Example experiment variations - customize based on your experiment needs
  const variantLayout = { ...baseLayout };
  
  // Example: Test different grid configurations
  if (experiment.key.includes('grid-size')) {
    variantLayout.rows = Math.min(baseLayout.rows + 1, 6);
    variantLayout.columns = Math.min(baseLayout.columns + 1, 4);
  }
  
  // Example: Test different spacing
  if (experiment.key.includes('spacing')) {
    variantLayout.gutter = Math.min(baseLayout.gutter + 4, 32);
    variantLayout.outerMargin = Math.min(baseLayout.outerMargin + 8, 64);
  }
  
  // Example: Test different presets
  if (experiment.key.includes('preset')) {
    const presets: Array<LayoutConfig['preset']> = ['grid', 'masonry', 'slider'];
    const currentIndex = presets.indexOf(baseLayout.preset);
    variantLayout.preset = presets[(currentIndex + 1) % presets.length];
  }
  
  // Example: Test different aspect ratios
  if (experiment.key.includes('aspect')) {
    const aspects: Array<LayoutConfig['aspect']> = ['1:1', '4:5', '9:16'];
    const currentIndex = aspects.indexOf(baseLayout.aspect);
    variantLayout.aspect = aspects[(currentIndex + 1) % aspects.length];
  }
  
  // Mark this layout as a variant for tracking
  variantLayout.experimentKey = experiment.key;
  
  return variantLayout;
}

/**
 * Track experiment exposure for analytics
 */
export function trackExperimentExposure(
  result: ExperimentResult,
  context: ExperimentContext
) {
  // Track the experiment exposure event
  if (typeof window !== 'undefined') {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'experiment_exposure', {
        experiment_key: result.experimentKey,
        variant_id: result.variantId,
        is_control: result.isControl,
        config_id: context.configId,
        device: context.device,
      });
    }
    
    // Custom analytics
    if ((window as any).minimallPixels) {
      (window as any).minimallPixels.dispatch('experiment_exposure', {
        experimentKey: result.experimentKey,
        variantId: result.variantId,
        isControl: result.isControl,
        configId: context.configId,
        device: context.device,
        trafficPercent: result.trafficPercent,
      });
    }
  }
  
  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Experiment Exposure:', {
      experiment: result.experimentKey,
      variant: result.variantId,
      isControl: result.isControl,
      trafficPercent: result.trafficPercent,
    });
  }
}

/**
 * Get experiment status for a given context
 * Useful for debugging and admin interfaces
 */
export function getExperimentStatus(
  configId: string,
  experiments: ExperimentConfig[],
  context: ExperimentContext
): Array<{
  experimentKey: string;
  status: string;
  variantId: string | null;
  reason: string;
}> {
  return experiments.map(experiment => {
    if (experiment.status !== 'running') {
      return {
        experimentKey: experiment.key,
        status: 'inactive',
        variantId: null,
        reason: `Status: ${experiment.status}`,
      };
    }
    
    if (!isExperimentActive(experiment)) {
      return {
        experimentKey: experiment.key,
        status: 'inactive',
        variantId: null,
        reason: 'Outside date range',
      };
    }
    
    const userHash = generateUserHash(context, experiment.key);
    const hashPercent = userHash % 100;
    const target = experiment.targets[0]; // Simplified for single target
    
    if (!target) {
      return {
        experimentKey: experiment.key,
        status: 'inactive',
        variantId: null,
        reason: 'No targets configured',
      };
    }
    
    const getsVariant = hashPercent < target.variantPercent;
    
    return {
      experimentKey: experiment.key,
      status: 'active',
      variantId: getsVariant ? 'variant' : 'control',
      reason: `Hash: ${hashPercent}, Threshold: ${target.variantPercent}`,
    };
  });
}

/**
 * Utility to create a simple A/B test experiment configuration
 */
export function createSimpleExperiment(
  key: string,
  name: string,
  blockId: string,
  trafficPercent: number,
  description?: string
): ExperimentConfig {
  return {
    key,
    name,
    description,
    targets: [{
      blockId,
      variantPercent: trafficPercent,
    }],
    trafficSplit: trafficPercent,
    status: 'draft',
    startDate: undefined,
    endDate: undefined,
  };
}