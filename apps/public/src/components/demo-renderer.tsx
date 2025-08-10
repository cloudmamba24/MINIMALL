"use client";

import { useModalRouter } from "@/hooks/use-modal-router";
import { animationTokens } from "@/lib/animation-tokens";
import { useCart } from "@/store/app-store";
import type { Category, SiteConfig } from "@minimall/core/client";
import { motion } from "framer-motion";
import { memo, useCallback, useMemo } from "react";
import { BrandHeader } from "./brand/brand-header";
import { ContentItem } from "./content/content-item";
import { ContentGrid, GridItem } from "./layout/content-grid";
import { EnhancedCartDrawer } from "./modals/enhanced-cart-drawer";
import { EnhancedPostModal } from "./modals/enhanced-post-modal";
import { EnhancedProductQuickView } from "./modals/enhanced-product-quick-view";
import { LinkTabs, type Tab } from "./navigation/link-tabs";

interface DemoRendererProps {
  config: SiteConfig;
  className?: string;
}

export function DemoRenderer({ config, className = "" }: DemoRendererProps) {
  // Development debugging for infinite loops
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[DemoRenderer] Render with config ID:", config.id, "timestamp:", Date.now());
  }

  const { settings } = config;
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
  }, [config.id, cart.totalItems, handleCartModal]); // Use config.id instead of categories array

  // Memoize rendered tabs to prevent infinite re-renders
  const renderedTabs = useMemo(
    () =>
      tabs.map((tab) => {
        const renderedTab: Tab = {
          id: tab.id,
          label: tab.label,
          content:
            tab.content && typeof tab.content === "object" && "children" in tab.content ? (
              <CategoryContent
                key={tab.id}
                category={tab.content}
                openPostModal={handlePostModal}
              />
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
      <div className="container mx-auto px-4 py-8 max-w-lg">
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

interface CategoryContentProps {
  category: Category;
  openPostModal: (postId: string, post: Category) => void;
}

const CategoryContent = memo(function CategoryContent({
  category,
  openPostModal,
}: CategoryContentProps) {
  const [, categoryTypeDetails] = category.categoryType;

  if (!category.children || category.children.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No content available</p>
      </div>
    );
  }

  // For slider display (like lookbook)
  if (categoryTypeDetails.displayType === "slider") {
    return (
      <div className="space-y-4">
        {category.children.map((child) => {
          const [cardType, cardDetails] = child.card;

          return (
            <div key={child.id} className="w-full">
              <ContentItem
                type={cardType === "product" ? "product" : cardType === "video" ? "video" : "image"}
                image={cardDetails.image || cardDetails.imageUrl || ""}
                title={child.title}
                {...(cardDetails.price && { price: cardDetails.price })}
                {...(cardDetails.link && { href: cardDetails.link })}
                {...(cardDetails.overlay && { overlay: cardDetails.overlay })}
                className="aspect-[4/3] rounded-lg"
              />
            </div>
          );
        })}
      </div>
    );
  }

  // For grid display (instagram, shop) with staggered animations
  return (
    <ContentGrid>
      {category.children.map((child, index) => {
        const [cardType, cardDetails] = child.card;

        return (
          <motion.div
            key={child.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: index * (animationTokens.duration.stagger / 1000),
              duration: animationTokens.duration.normal / 1000,
              ease: animationTokens.easing.entrance,
            }}
            whileHover={{
              scale: 1.05,
              transition: {
                duration: animationTokens.duration.fast / 1000,
                ease: animationTokens.easing.entrance,
              },
            }}
            whileTap={{ scale: 0.95 }}
          >
            <GridItem
              onClick={() => {
                // Handle click action from card details or default to modal
                if (cardDetails.clickAction?.type === "modal") {
                  openPostModal(child.id, child);
                } else if (cardDetails.link) {
                  window.open(cardDetails.link, "_blank");
                } else {
                  openPostModal(child.id, child);
                }
              }}
            >
              <ContentItem
                type={cardType === "product" ? "product" : cardType === "video" ? "video" : "image"}
                image={cardDetails.image || cardDetails.imageUrl || ""}
                title={child.title}
                {...(cardDetails.price && { price: cardDetails.price })}
                {...(cardDetails.overlay && { overlay: cardDetails.overlay })}
              />
            </GridItem>
          </motion.div>
        );
      })}
    </ContentGrid>
  );
});
