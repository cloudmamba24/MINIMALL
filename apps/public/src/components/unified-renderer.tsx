"use client";

import { SiteConfigProvider } from "@/contexts/site-config-context";
import type { Category, SiteConfig } from "@minimall/core/client";
import { useCart } from "../hooks/use-cart";
import { useRenderMode } from "../hooks/use-mobile-detection";
import { useModalRouter } from "../hooks/use-modal-router";
import { cn } from "../lib/utils";
import { EnhancedProductQuickView } from "./enhanced-product-quick-view";
import { InstagramTab } from "./instagram/instagram-tab";
import { LookbookSection } from "./lookbook/lookbook-section";
import { EnhancedPostModal } from "./modals/enhanced-post-modal";
import { ShopTab } from "./shop/shop-tab";
import { PixelDispatcher } from "./tracking/PixelDispatcher";
import { UTMTracker } from "./tracking/UTMTracker";
import "../styles/instagram-native.css";
import { BrandHeader } from "./brand/brand-header";
import { LinkTabs, type Tab } from "./navigation/link-tabs";

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
  // const { addToCart } = useCart();
  const { openModal: openPostModal } = useModalRouter("post");
  const { openModal: openProductModal } = useModalRouter("product");

  // Flatten all post items across categories for the modal carousel (Instagram content only for 1:1 demo parity)
  const instagramCategory = (config.categories || []).find(
    (c) => c.title.toLowerCase() === "instagram"
  );
  const allPosts: Category[] = (instagramCategory?.children || []) as Category[];

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

      {/* Main Content Rendering (single orchestrator with tabs) */}
      <SiteConfigProvider config={config}>
        <div className={cn("min-h-screen bg-black text-white", className)}>
          <div className="container mx-auto px-3 md:px-4 py-6 md:py-8 max-w-xl md:max-w-2xl lg:max-w-5xl">
            {/* Brand Header */}
            {config.settings.brand && (
              <div className="mb-6 md:mb-8">
                <BrandHeader
                  title={config.settings.brand.name}
                  {...(config.settings.brand.subtitle && {
                    subtitle: config.settings.brand.subtitle,
                  })}
                  {...(config.settings.brand.logo && { logo: config.settings.brand.logo })}
                  {...(config.settings.brand.socialLinks && {
                    socialLinks: config.settings.brand.socialLinks,
                  })}
                  {...(config.settings.brand.ctaButton && {
                    ctaButton: config.settings.brand.ctaButton,
                  })}
                />
              </div>
            )}

            {/* Tabs */}
            {(() => {
              const instagramContent = (
                <InstagramTab
                  config={config}
                  onOpenPost={(postId) => openPostModal({ id: postId })}
                />
              );
              const shopCategory = config.categories.find((c) => c.title.toLowerCase() === "shop");
              const lookbookCategory = config.categories.find(
                (c) => c.title.toLowerCase() === "lookbook"
              );

              const tabs: Tab[] = [
                { id: "instagram", label: "INSTAGRAM", content: instagramContent },
                ...(shopCategory
                  ? ([
                      {
                        id: "shop",
                        label: "SHOP",
                        content: (
                          <ShopTab
                            category={shopCategory}
                            onProductClick={(productId) => openPostModal({ id: productId })}
                          />
                        ),
                      },
                    ] as Tab[])
                  : []),
                ...(lookbookCategory
                  ? ([
                      {
                        id: "lookbook",
                        label: "LOOKBOOK",
                        content: (
                          <LookbookSection
                            category={lookbookCategory}
                            onHotspotClick={(productId) => openPostModal({ id: productId })}
                          />
                        ),
                      },
                    ] as Tab[])
                  : []),
              ];

              return <LinkTabs tabs={tabs} />;
            })()}
          </div>
        </div>
      </SiteConfigProvider>

      {/* Shared Components */}
      <EnhancedProductQuickView />
      <EnhancedPostModal
        posts={allPosts}
        onProductClick={(productId) => openProductModal({ id: productId })}
      />
    </>
  );
}
