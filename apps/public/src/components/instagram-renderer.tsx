"use client";

import { useModalRouter } from "@/hooks/use-modal-router";
import { animationTokens } from "@/lib/animation-tokens";
import { createAnalytics, createImpressionTracker } from "@/lib/enhanced-analytics";
import { useCart } from "@/store/app-store";
import type { Category, SiteConfig } from "@minimall/core/client";
import { motion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandHeader } from "./brand/brand-header";
import { ContentItem } from "./content/content-item";
import { EnhancedCartDrawer } from "./modals/enhanced-cart-drawer";
import { EnhancedPostModal } from "./modals/enhanced-post-modal";
import { EnhancedProductQuickView } from "./modals/enhanced-product-quick-view";
import { LinkTabs, type Tab } from "./navigation/link-tabs";

interface InstagramRendererProps {
  config: SiteConfig;
  className?: string | undefined;
}

/**
 * InstagramRenderer - Enhanced Instagram-Native Experience
 *
 * Features:
 * - Instagram-style grid (2 columns, square ratio)
 * - Heart icon overlays on product images
 * - Dark theme optimized for mobile
 * - Modal-based navigation (no page reloads)
 * - Smooth animations and gestures
 * - Tab-based content switching
 */
export function InstagramRenderer({ config, className = "" }: InstagramRendererProps) {
  // Development debugging for infinite loops
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[InstagramRenderer] Render with config ID:", config.id, "timestamp:", Date.now());
  }

  const { settings } = config;
  const _analytics = useMemo(() => createAnalytics(config.id), [config.id]);
  const cart = useCart();

  // Enhanced modal routing
  const { openModal: openPostModal } = useModalRouter("post");
  const { openModal: openProductModal } = useModalRouter("product");
  const { openModal: openCartModal } = useModalRouter("cart");

  // Stable callbacks to prevent re-renders
  const handlePostModal = useCallback(
    (postId: string, _post: Category) => {
      openPostModal({ id: postId });
    },
    [openPostModal]
  );

  const handleProductModal = useCallback(
    (productId: string) => {
      openProductModal({ id: productId });
    },
    [openProductModal]
  );

  const handleCartModal = useCallback(() => {
    openCartModal({ open: "true" });
  }, [openCartModal]);

  // Ultra-stable tabs creation using config.id instead of categories array
  const tabs = useMemo(() => {
    const categoryTabs = config.categories.map((category) => ({
      id: category.id,
      label: category.title,
      content: category,
    }));

    const cartTab = {
      id: "cart",
      label: cart.totalItems > 0 ? `Cart (${cart.totalItems})` : "Cart",
      content: null as Category | null,
      onClick: handleCartModal,
      isAction: true,
    };

    return [...categoryTabs, cartTab];
  }, [config.categories, cart.totalItems, handleCartModal]);

  // Memoize rendered tabs to prevent infinite re-renders
  const renderedTabs = useMemo(
    () =>
      tabs.map((tab) => {
        const renderedTab: Tab = {
          id: tab.id,
          label: tab.label,
          content:
            tab.content && typeof tab.content === "object" && "children" in tab.content ? (
              <InstagramGrid key={tab.id} category={tab.content} openPostModal={handlePostModal} />
            ) : null,
        };

        if ("onClick" in tab) {
          renderedTab.onClick = tab.onClick;
        }

        if ("isAction" in tab) {
          renderedTab.isAction = tab.isAction;
        }

        return renderedTab;
      }),
    [tabs, handlePostModal]
  );

  return (
    <motion.div
      className={`min-h-screen bg-black text-white ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: animationTokens.duration.normal / 1000,
        ease: animationTokens.easing.entrance,
      }}
    >
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8 max-w-xl md:max-w-2xl lg:max-w-5xl">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.1,
            duration: animationTokens.duration.normal / 1000,
            ease: animationTokens.easing.entrance,
          }}
        >
          <BrandHeader
            title={settings.brand?.name || "DEMO.STORE"}
            {...(settings.brand?.subtitle && { subtitle: settings.brand.subtitle })}
            {...(settings.brand?.logo && { logo: settings.brand.logo })}
            {...(settings.brand?.socialLinks && { socialLinks: settings.brand.socialLinks })}
            {...(settings.brand?.ctaButton && { ctaButton: settings.brand.ctaButton })}
          />
        </motion.div>

        {/* Tab Navigation & Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: animationTokens.duration.normal / 1000,
            ease: animationTokens.easing.entrance,
          }}
        >
          <LinkTabs tabs={renderedTabs} />
        </motion.div>
      </div>

      {/* Enhanced Modals with URL routing */}
      <EnhancedPostModal
        posts={config.categories.filter((cat) => cat.children && cat.children.length > 0)}
        onProductClick={handleProductModal}
      />

      <EnhancedProductQuickView />

      <EnhancedCartDrawer shopDomain={settings.shopDomain} />
    </motion.div>
  );
}

interface InstagramGridProps {
  category: Category;
  openPostModal: (postId: string, post: Category) => void;
}

const InstagramGrid = memo(function InstagramGrid({ category, openPostModal }: InstagramGridProps) {
  const [, categoryTypeDetails] = category.categoryType;
  const gridRef = useRef<HTMLDivElement | null>(null);
  const analytics = useMemo(() => createAnalytics(category.id), [category.id]);

  if (!category.children || category.children.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No content available</p>
      </div>
    );
  }

  // For slider display (like lookbook) - vertical scroll
  if (categoryTypeDetails.displayType === "slider") {
    return (
      <div className="space-y-4">
        {category.children.map((child, index) => {
          const [cardType, cardDetails] = child.card;

          return (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * (animationTokens.duration.stagger / 1000),
                duration: animationTokens.duration.normal / 1000,
                ease: animationTokens.easing.entrance,
              }}
              className="w-full"
            >
              <InstagramContentItem
                child={child}
                cardType={cardType}
                cardDetails={cardDetails}
                onClick={() => openPostModal(child.id, child)}
                className="aspect-[4/3] rounded-lg"
              />
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Client-side pagination for infinite scroll
  const items = category.children;
  const [visibleCount, setVisibleCount] = useState(Math.min(24, items.length));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isLoadingMore && visibleCount < items.length) {
          setIsLoadingMore(true);
          // Simulate async load and smooth UX
          setTimeout(() => {
            setVisibleCount((c) => Math.min(c + 12, items.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, visibleCount, items.length]);

  // Pause videos when tiles go offscreen
  // biome-ignore lint/correctness/useExhaustiveDependencies: items.length triggers video observer re-initialization when content changes
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const videos = Array.from(root.querySelectorAll("video")) as HTMLVideoElement[];
    if (videos.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = entry.target as HTMLVideoElement;
          if (!entry.isIntersecting) {
            try {
              v.pause();
            } catch (_error) {
              /* ignore */
            }
          }
        }
      },
      { threshold: 0.2 }
    );
    for (const v of videos) io.observe(v);
    return () => io.disconnect();
  }, [items.length]);

  // Track impressions for tiles entering viewport
  // biome-ignore lint/correctness/useExhaustiveDependencies: visibleCount triggers impression tracking re-initialization for analytics accuracy
  useEffect(() => {
    if (!gridRef.current) return;
    const io = createImpressionTracker(analytics, 0.5);
    const cards = Array.from(gridRef.current.querySelectorAll("[data-item-id]")) as HTMLElement[];
    for (const el of cards) io.observe(el);
    return () => io.disconnect();
  }, [analytics, visibleCount]);

  // Instagram-style grid (2 columns, square aspect ratio)
  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        gridRef.current = el;
      }}
      className="grid grid-cols-2 md:grid-cols-3 gap-1.5 md:gap-2 w-full max-w-sm md:max-w-2xl lg:max-w-4xl mx-auto"
    >
      {items.slice(0, visibleCount).map((child, index) => {
        const [cardType, cardDetails] = child.card;

        return (
          <motion.div
            key={child.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: index * (animationTokens.duration.stagger / 1000),
              duration: animationTokens.duration.normal / 1000,
              ease: animationTokens.easing.entrance,
            }}
            whileHover={{
              scale: 1.02,
              transition: {
                duration: animationTokens.duration.fast / 1000,
                ease: animationTokens.easing.entrance,
              },
            }}
            whileTap={{ scale: 0.98 }}
            className="relative aspect-square md:aspect-[4/5] lg:aspect-square"
            data-item-id={child.id}
            data-category-id={category.id}
          >
            <button
              type="button"
              onClick={() => {
                analytics.trackTileClick({
                  configId: category.id,
                  itemId: child.id,
                  categoryId: category.id,
                });
                openPostModal(child.id, child);
              }}
              className="w-full h-full relative overflow-hidden bg-gray-800 group"
            >
              <InstagramContentItem
                child={child}
                cardType={cardType}
                cardDetails={cardDetails}
                showInstagramEffects={true}
              />
            </button>
          </motion.div>
        );
      })}

      {/* Skeletons when loading more */}
      {isLoadingMore &&
        items.slice(visibleCount, Math.min(visibleCount + 12, items.length)).map((child) => (
          <div
            key={`skeleton-${child.id}`}
            className="relative aspect-square md:aspect-[4/5] lg:aspect-square"
          >
            <div className="w-full h-full loading-shimmer rounded-sm" />
          </div>
        ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="col-span-full h-6" />
    </div>
  );
});

interface InstagramContentItemProps {
  child: Category;
  cardType: string;
  cardDetails: unknown;
  onClick?: () => void;
  showInstagramEffects?: boolean;
  className?: string;
}

function InstagramContentItem({
  child,
  cardType,
  cardDetails,
  onClick,
  showInstagramEffects = false,
  className = "",
}: InstagramContentItemProps) {
  // Cast cardDetails for type safety
  const details = cardDetails as Record<string, unknown> & {
    videoUrl?: string;
    poster?: string;
    image?: string;
    imageUrl?: string;
    overlay?: { position: string; text: string };
    gallery?: unknown[];
    price?: string;
  };
  const isVideo = cardType === "video" || Boolean(details.videoUrl);

  const content = (
    <div className={`relative w-full h-full overflow-hidden bg-gray-800 group ${className}`}>
      {/* Background Media: image or video */}
      {isVideo ? (
        <video
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          poster={details.poster || details.image || details.imageUrl || undefined}
          onMouseEnter={(e) => {
            if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
            // Autoplay on hover for desktop
            try {
              (e.currentTarget as HTMLVideoElement).play().catch((_error) => {
                /* ignore autoplay failure */
              });
            } catch (_error) {
              /* ignore */
            }
          }}
          onMouseLeave={(e) => {
            try {
              (e.currentTarget as HTMLVideoElement).pause();
            } catch (_error) {
              /* ignore */
            }
          }}
          // On mobile, user taps to toggle play/pause
          onClick={(e) => {
            const v = e.currentTarget as HTMLVideoElement;
            try {
              v.paused ? v.play() : v.pause();
            } catch (_error) {
              /* ignore */
            }
          }}
          aria-label="Toggle video playback"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const v = e.currentTarget as HTMLVideoElement;
              try {
                v.paused ? v.play() : v.pause();
              } catch (_error) {
                /* ignore */
              }
            }
          }}
        >
          {details.videoUrl && <source src={details.videoUrl} />}
        </video>
      ) : (
        <img
          src={details.image || details.imageUrl || ""}
          alt={child.title || "Content item"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      )}

      {/* Instagram-style overlay effects */}
      {showInstagramEffects && (
        <>
          {/* Heart icon overlay (appears on hover) */}
          <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Like"
            >
              <title>Like this post</title>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          {/* Multiple images indicator (if applicable) */}
          {details.gallery && details.gallery.length > 1 && (
            <div className="absolute top-2 right-2">
              <svg
                className="w-4 h-4 text-white drop-shadow-md"
                fill="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Multiple images"
              >
                <title>Multiple images available</title>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
          )}
        </>
      )}

      {/* Original overlay content */}
      {details.overlay && (
        <div
          className={`
          absolute z-10 text-white font-bold text-xs px-2 py-1 
          ${details.overlay.position === "top-left" ? "top-2 left-2" : ""}
          ${details.overlay.position === "top-right" ? "top-2 right-2" : ""}
          ${details.overlay.position === "bottom-left" ? "bottom-2 left-2" : ""}
          ${details.overlay.position === "bottom-right" ? "bottom-2 right-2" : ""}
          ${details.overlay.position === "center" ? "inset-0 flex items-center justify-center text-center text-lg" : ""}
        `}
        >
          <span
            className={
              details.overlay.position === "center"
                ? "bg-black bg-opacity-50 px-4 py-2 rounded"
                : ""
            }
          >
            {details.overlay.text}
          </span>
        </div>
      )}

      {/* Title and price */}
      {(child.title || details.price) && !showInstagramEffects && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          {child.title && (
            <h3 className="text-white text-sm font-medium leading-tight">{child.title}</h3>
          )}
          {details.price && <p className="text-white/90 text-xs mt-1">{details.price}</p>}
        </div>
      )}

      {/* Video Play Icon */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <svg
              className="w-6 h-6 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Play video"
            >
              <title>Play video</title>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Product Price Badge */}
      {cardType === "product" && details.price && showInstagramEffects && (
        <div className="absolute top-2 left-2 bg-white text-black text-xs px-2 py-1 rounded-full font-medium">
          {details.price}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full h-full">
        {content}
      </button>
    );
  }

  return content;
}
