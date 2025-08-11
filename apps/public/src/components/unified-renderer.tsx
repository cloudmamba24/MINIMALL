"use client";

import type { Category, SiteConfig } from "@minimall/core/client";
import { useCart } from "../hooks/use-cart";
import { useModalRouter } from "../hooks/use-modal-router";
import { useRenderMode } from "../hooks/use-mobile-detection";
import { conditionalProps } from "../lib/type-utils";
import { cn } from "../lib/utils";
import { EnhancedProductQuickView } from "./enhanced-product-quick-view";
import { EnhancedPostModal } from "./modals/enhanced-post-modal";
import { InstagramRenderer } from "./instagram-renderer";
import { Renderer } from "./renderer";
import { LayoutSwitch } from "./renderers/LayoutSwitch";
import { PixelDispatcher } from "./tracking/PixelDispatcher";
import { UTMTracker } from "./tracking/UTMTracker";
import "../styles/instagram-native.css";

interface UnifiedRendererProps {
  config: SiteConfig;
  className?: string;
  forceMode?: "instagram-native" | "flexible";
}

/**
 * UnifiedRenderer - Enhanced Multi-Modal Experience System
 *
 * Automatically selects the optimal rendering mode based on device:
 * - Mobile (≤768px): Instagram-native experience with layout system integration
 * - Desktop (>768px): Layout-based experience with advanced renderers
 *
 * Features:
 * - UTM tracking and analytics pixel integration
 * - Mobile-native gestures and interactions
 * - Layout-based rendering (grid, masonry, slider, stories)
 * - Revenue attribution and A/B testing ready
 */
export function UnifiedRenderer({ config, className, forceMode }: UnifiedRendererProps) {
  const detectedMode = useRenderMode();
  const renderMode = forceMode || detectedMode;
  const { addToCart } = useCart();
  const { openModal: openPostModal } = useModalRouter("post");
  const { openModal: openProductModal } = useModalRouter("product");

  // Flatten all post items across categories for the modal carousel
  const allPosts: Category[] = (config.categories || [])
    .flatMap((category) => category.children || [])
    .filter(Boolean) as Category[];

  // Development debug logging
  if (process.env.NODE_ENV === "development") {
    console.log(`[UnifiedRenderer] Mode: ${renderMode}, Config ID: ${config.id}`);
  }

  return (
    <>
      {/* UTM Tracking - Initialize on page load */}
      <UTMTracker configId={config.id} />

      {/* Analytics Pixels */}
      {config.settings.pixels && (
        <PixelDispatcher pixels={config.settings.pixels} configId={config.id} />
      )}

      {/* Main Content Rendering */}
      {renderMode === "instagram-native" ? (
        <MobileNativeRenderer
          config={config}
          onAddToCart={addToCart}
          onOpenPost={(postId) => openPostModal({ id: postId })}
          {...conditionalProps({ className })}
        />
      ) : (
        <DesktopLayoutRenderer
          config={config}
          onAddToCart={addToCart}
          onOpenPost={(postId) => openPostModal({ id: postId })}
          {...conditionalProps({ className })}
        />
      )}

      {/* Shared Components */}
      <EnhancedProductQuickView />

      {/* Global Post Modal bound to URL; opens with any grid tile click */}
      <EnhancedPostModal
        posts={allPosts}
        onProductClick={(productId) => openProductModal({ id: productId })}
      />
    </>
  );
}

/**
 * Mobile-Native Renderer
 * Enhanced Instagram-style experience with gesture support
 */
function MobileNativeRenderer({
  config,
  className,
  onAddToCart,
  onOpenPost,
}: {
  config: SiteConfig;
  className?: string;
  onAddToCart: (
    productId: string,
    variantId?: string,
    quantity?: number
  ) => Promise<{ success: boolean; error?: any }>;
  onOpenPost: (postId: string) => void;
}) {
  return (
    <div className={cn("instagram-native", className)}>
      {/* Instagram-style brand header */}
      {config.settings.brand && (
        <div className="instagram-header">
          <h1 className="instagram-header-title">{config.settings.brand.name}</h1>
          {config.settings.brand.subtitle && (
            <p className="instagram-header-subtitle">{config.settings.brand.subtitle}</p>
          )}
        </div>
      )}

      {/* Category tabs for multiple categories */}
      {config.categories.length > 1 && (
        <div className="instagram-tabs">
          {config.categories.map((category) => (
            <button key={category.id} className="instagram-tab active">
              {category.title}
            </button>
          ))}
        </div>
      )}

      {/* Use layout system for categories that have layout config */}
      {config.categories.map((category, index) => (
        <div key={category.id}>
          {category.layout ? (
            <LayoutSwitch
              category={category}
              configId={config.id}
              {...conditionalProps({
                experiments: config.settings.experiments,
                className: "instagram-grid",
              })}
              onTileClick={(clickedCategory) => {
                if (clickedCategory?.id) onOpenPost(clickedCategory.id);
              }}
              onAddToCart={onAddToCart}
            />
          ) : (
            // Fallback to existing InstagramRenderer for categories without layout
            <InstagramRenderer config={config} className={className || undefined} />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Desktop Layout Renderer
 * Advanced layout system with full feature set
 */
function DesktopLayoutRenderer({
  config,
  className,
  onAddToCart,
  onOpenPost,
}: {
  config: SiteConfig;
  className?: string;
  onAddToCart: (
    productId: string,
    variantId?: string,
    quantity?: number
  ) => Promise<{ success: boolean; error?: any }>;
  onOpenPost: (postId: string) => void;
}) {
  return (
    <div className={className}>
      {config.categories.map((category) => (
        <div key={category.id} className="mb-12">
          {category.layout ? (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">{category.title}</h2>
              <LayoutSwitch
                category={category}
                configId={config.id}
                {...conditionalProps({
                  experiments: config.settings.experiments,
                  className: "desktop-layout",
                })}
                onTileClick={(clickedCategory) => {
                  if (clickedCategory?.id) onOpenPost(clickedCategory.id);
                }}
                onAddToCart={onAddToCart}
              />
            </div>
          ) : (
            // Fallback to existing Renderer
            <Renderer config={config} className={className || undefined} />
          )}
        </div>
      ))}
    </div>
  );
}
