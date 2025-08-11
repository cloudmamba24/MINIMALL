"use client";

import { useEffect, useMemo } from "react";
import { Category, LayoutConfig, SiteConfig } from "@minimall/core";
import { GridRenderer } from "./GridRenderer";
import { MasonryRenderer } from "./MasonryRenderer";
import { SliderRenderer } from "./SliderRenderer";
import { StoriesRenderer } from "./StoriesRenderer";
import { routeExperiment, trackExperimentExposure, ExperimentContext } from "../../lib/experiment-router";
import { UTMUtils } from "../tracking/UTMTracker";
import { conditionalProps } from "../../lib/type-utils";

interface LayoutSwitchProps {
  category: Category;
  onTileClick?: (category: Category, index: number) => void;
  onAddToCart?: (productId: string, variantId?: string, quantity?: number) => void;
  className?: string;
  configId?: string;
  experiments?: Array<import("@minimall/core").ExperimentConfig>;
}

// Default layout configuration
const DEFAULT_LAYOUT: LayoutConfig = {
  preset: 'grid',
  rows: 2,
  columns: 2,
  gutter: 8,
  outerMargin: 16,
  borderRadius: 8,
  hoverZoom: true,
  aspect: '1:1',
  mediaFilter: 'all',
  blockId: `block_${Math.random().toString(36).substr(2, 9)}`,
};

export function LayoutSwitch({ 
  category, 
  onTileClick, 
  onAddToCart,
  className,
  configId,
  experiments = []
}: LayoutSwitchProps) {
  // Get user context for experiment routing
  const experimentContext = useMemo((): ExperimentContext | null => {
    if (!configId) return null;
    
    const sessionData = UTMUtils.getSessionData(configId);
    return {
      configId,
      sessionId: sessionData?.sessionId || 'anonymous',
      device: (sessionData?.device as ExperimentContext['device']) || 'desktop',
      metadata: {},
    };
  }, [configId]);

  // Route experiment and get final layout configuration
  const { finalLayout, experimentResult } = useMemo(() => {
    const baseLayout = category.layout || DEFAULT_LAYOUT;
    
    // Ensure blockId exists for analytics
    if (!baseLayout.blockId) {
      baseLayout.blockId = `block_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Check for active experiments
    if (experimentContext && experiments.length > 0) {
      const result = routeExperiment(category.id, ['default'], { configId: experimentContext.configId });
      if (result) {
        return {
          finalLayout: baseLayout, // Use base layout since experiments are simplified
          experimentResult: result,
        };
      }
    }

    return {
      finalLayout: baseLayout,
      experimentResult: null,
    };
  }, [category, experiments, experimentContext]);

  // Track experiment exposure
  useEffect(() => {
    if (experimentResult && experimentContext) {
      trackExperimentExposure(experimentResult.key || 'default', experimentResult.variant || 'default', experimentResult.metadata);
    }
  }, [experimentResult, experimentContext]);

  // Dispatch to appropriate renderer based on preset
  switch (finalLayout.preset) {
    case 'grid':
      return (
        <GridRenderer
          category={category}
          layout={finalLayout}
          {...conditionalProps({ className, onTileClick, onAddToCart })}
        />
      );

    case 'masonry':
      return (
        <MasonryRenderer
          category={category}
          layout={finalLayout}
          {...conditionalProps({ className, onTileClick })}
        />
      );

    case 'slider':
      return (
        <SliderRenderer
          category={category}
          layout={finalLayout}
          {...conditionalProps({ className, onTileClick })}
        />
      );

    case 'stories':
      return (
        <StoriesRenderer
          category={category}
          layout={finalLayout}
          {...conditionalProps({ className, onTileClick })}
        />
      );

    default:
      // Fallback to grid renderer for unknown presets
      console.warn(`Unknown layout preset: ${finalLayout.preset}. Falling back to grid.`);
      return (
        <GridRenderer
          category={{ ...category, layout: { ...finalLayout, preset: 'grid' } }}
          layout={{ ...finalLayout, preset: 'grid' }}
          {...conditionalProps({ className, onTileClick })}
        />
      );
  }
}