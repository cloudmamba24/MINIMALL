'use client';

import { type SiteConfig } from '@minimall/core/client';
import { useRenderMode } from '../hooks/use-mobile-detection';
import { Renderer } from './renderer';
import { InstagramRenderer } from './instagram-renderer';
import { EnhancedProductQuickView } from './enhanced-product-quick-view';

interface UnifiedRendererProps {
  config: SiteConfig;
  className?: string;
  forceMode?: 'instagram-native' | 'flexible';
}

/**
 * UnifiedRenderer - Dual Experience System
 * 
 * Automatically selects the optimal rendering mode based on device:
 * - Mobile (≤768px): Instagram-native experience (dark theme, modals, gestures)
 * - Desktop (>768px): Flexible experience (traditional layout)
 * 
 * InstagramRenderer provides the enhanced Instagram-native experience,
 * while Renderer provides the flexible desktop experience.
 */
export function UnifiedRenderer({ config, className, forceMode }: UnifiedRendererProps) {
  const detectedMode = useRenderMode();
  const renderMode = forceMode || detectedMode;

  // Development debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[UnifiedRenderer] Mode: ${renderMode}, Config ID: ${config.id}`);
  }

  switch (renderMode) {
    case 'instagram-native':
      // Use enhanced InstagramRenderer for mobile Instagram-native experience
      return (
        <>
          <InstagramRenderer config={config} className={className || undefined} />
          <EnhancedProductQuickView />
        </>
      );
      
    case 'flexible':
    default:
      // Use existing Renderer for flexible desktop experience
      return (
        <>
          <Renderer config={config} className={className || undefined} />
          <EnhancedProductQuickView />
        </>
      );
  }
}