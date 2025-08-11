"use client";

import type { Category, LayoutConfig } from "@minimall/core";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { ProductOverlay } from "../ui/ProductOverlay";

interface GridRendererProps {
  category: Category;
  layout: LayoutConfig;
  onTileClick?: (category: Category, index: number) => void;
  onAddToCart?: (productId: string, variantId?: string, quantity?: number) => void;
  className?: string;
}

export function GridRenderer({
  category,
  layout,
  onTileClick,
  onAddToCart,
  className,
}: GridRendererProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate responsive grid styles
  const getGridStyles = () => {
    const { rows, columns, gutter, outerMargin } = layout;

    return {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: `${gutter}px`,
      padding: `${outerMargin}px`,
      width: "100%",
      height: "100%",
    };
  };

  // Calculate aspect ratio for tiles
  const getAspectRatio = () => {
    switch (layout.aspect) {
      case "1:1":
        return "1";
      case "4:5":
        return "4/5";
      case "9:16":
        return "9/16";
      default:
        return "auto";
    }
  };

  // Filter items based on media type
  const getFilteredItems = () => {
    if (!category.children) return [];

    return category.children.filter((item) => {
      if (layout.mediaFilter === "all") return true;

      const cardDetails = item.card[1];
      if (layout.mediaFilter === "photo") {
        return cardDetails.image || cardDetails.imageUrl;
      }
      if (layout.mediaFilter === "video") {
        return cardDetails.videoUrl;
      }
      return true;
    });
  };

  const filteredItems = getFilteredItems();
  const maxItems = layout.rows * layout.columns;
  const displayItems = filteredItems.slice(0, maxItems);

  const handleTileClick = (item: Category, index: number) => {
    if (onTileClick) {
      onTileClick(item, index);
    }
  };

  const handleTileHover = (index: number) => {
    if (layout.hoverZoom) {
      setHoveredIndex(index);
    }
  };

  return (
    <div className={cn("w-full h-full", className)} style={getGridStyles()}>
      {displayItems.map((item, index) => {
        const cardDetails = item.card[1];
        const isHovered = hoveredIndex === index;

        return (
          <motion.div
            key={`${item.id}-${index}`}
            className="relative overflow-hidden cursor-pointer"
            style={{
              aspectRatio: getAspectRatio(),
              borderRadius: `${layout.borderRadius}px`,
            }}
            initial={false}
            animate={{
              scale: layout.hoverZoom && isHovered ? 1.05 : 1,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            onClick={() => handleTileClick(item, index)}
            onHoverStart={() => handleTileHover(index)}
            onHoverEnd={() => setHoveredIndex(null)}
          >
            {/* Background Image/Video */}
            {cardDetails.videoUrl ? (
              <video
                src={cardDetails.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={cardDetails.imageUrl || cardDetails.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}

            {/* Overlay */}
            {cardDetails.overlay && (
              <div
                className={cn("absolute text-white font-medium", {
                  "top-2 left-2": cardDetails.overlay.position === "top-left",
                  "top-2 right-2": cardDetails.overlay.position === "top-right",
                  "bottom-2 left-2": cardDetails.overlay.position === "bottom-left",
                  "bottom-2 right-2": cardDetails.overlay.position === "bottom-right",
                  "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2":
                    cardDetails.overlay.position === "center",
                })}
              >
                <span className="bg-black/50 px-2 py-1 rounded text-sm">
                  {cardDetails.overlay.text}
                </span>
              </div>
            )}

            {/* Hover Effect Overlay */}
            {layout.hoverZoom && (
              <motion.div
                className="absolute inset-0 bg-black/20 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-white font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {item.title}
                </div>
              </motion.div>
            )}

            {/* Enhanced Product Tags with One-Tap Overlay */}
            {cardDetails.productTags?.map((tag, tagIndex) => (
              <ProductOverlay
                key={tagIndex}
                tag={tag}
                tagIndex={tagIndex}
                onAddToCart={onAddToCart || (() => console.log("No cart handler provided"))}
              />
            ))}
          </motion.div>
        );
      })}

      {/* Empty slots for maintaining grid structure */}
      {Array.from({ length: maxItems - displayItems.length }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="opacity-0"
          style={{
            aspectRatio: getAspectRatio(),
            borderRadius: `${layout.borderRadius}px`,
          }}
        />
      ))}
    </div>
  );
}
