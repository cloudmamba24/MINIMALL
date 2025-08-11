"use client";

import type { Category, LayoutConfig } from "@minimall/core";
import { type PanInfo, motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { conditionalProps } from "../../lib/type-utils";
import { cn } from "../../lib/utils";

interface SliderRendererProps {
  category: Category;
  layout: LayoutConfig;
  onTileClick?: (category: Category, index: number) => void;
  className?: string;
}

export function SliderRenderer({ category, layout, onTileClick, className }: SliderRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

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
  const totalItems = filteredItems.length;

  // Calculate how many items to show per slide
  const getItemsPerSlide = () => {
    if (!containerRef.current) return layout.columns;

    const containerWidth = containerRef.current.offsetWidth;
    const { responsive } = layout;

    if (responsive?.lg && containerWidth >= 1024) return responsive.lg.columns || layout.columns;
    if (responsive?.md && containerWidth >= 768) return responsive.md.columns || layout.columns;
    if (responsive?.sm && containerWidth >= 640) return responsive.sm.columns || layout.columns;

    return layout.columns;
  };

  const [itemsPerSlide, setItemsPerSlide] = useState(getItemsPerSlide());

  useEffect(() => {
    const handleResize = () => {
      setItemsPerSlide(getItemsPerSlide());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [layout.columns, layout.responsive]);

  const maxIndex = Math.max(0, totalItems - itemsPerSlide);

  // Calculate slide width
  const getSlideWidth = () => {
    if (!containerRef.current) return 300;
    return containerRef.current.offsetWidth - layout.outerMargin * 2;
  };

  const slideWidth = getSlideWidth();
  const itemWidth = (slideWidth - layout.gutter * (itemsPerSlide - 1)) / itemsPerSlide;

  // Transform x value to slide position
  const slideX = useTransform(x, [0, -slideWidth * maxIndex], [0, -slideWidth * maxIndex]);

  // Handle navigation
  const goToSlide = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(clampedIndex);
    x.set(-clampedIndex * slideWidth);
  };

  const goToNext = () => {
    if (currentIndex < maxIndex) {
      goToSlide(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  };

  // Handle drag
  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);

    const threshold = slideWidth / 4;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(velocity) > 500 || Math.abs(offset) > threshold) {
      if (offset > 0 && velocity >= 0) {
        goToPrevious();
      } else if (offset < 0 && velocity <= 0) {
        goToNext();
      } else {
        goToSlide(currentIndex);
      }
    } else {
      goToSlide(currentIndex);
    }
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

  const handleTileClick = (item: Category, index: number) => {
    if (!isDragging && onTileClick) {
      onTileClick(item, index);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ padding: `${layout.outerMargin}px` }}
    >
      {/* Main slider container */}
      <motion.div
        className="flex"
        style={{
          x: slideX,
          gap: `${layout.gutter}px`,
        }}
        drag="x"
        dragConstraints={{
          left: -slideWidth * maxIndex,
          right: 0,
        }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        {filteredItems.map((item, index) => {
          const cardDetails = item.card[1];

          return (
            <motion.div
              key={`${item.id}-${index}`}
              className="flex-shrink-0 relative overflow-hidden cursor-pointer"
              style={{
                width: `${itemWidth}px`,
                aspectRatio: getAspectRatio(),
                borderRadius: `${layout.borderRadius}px`,
              }}
              {...(layout.hoverZoom ? { whileHover: { scale: 1.05 } } : {})}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={() => handleTileClick(item, index)}
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
                  className={cn("absolute text-white font-medium z-10", {
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

              {/* Product Tags */}
              {cardDetails.productTags?.map((tag, tagIndex) => (
                <div
                  key={tagIndex}
                  className="absolute w-3 h-3 bg-white rounded-full border-2 border-black shadow-lg animate-pulse z-10"
                  style={{
                    left: `${tag.position.x * 100}%`,
                    top: `${tag.position.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {tag.label && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {tag.label}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Navigation arrows */}
      {totalItems > itemsPerSlide && (
        <>
          <button
            className={cn(
              "absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all",
              {
                "opacity-50 cursor-not-allowed": currentIndex === 0,
              }
            )}
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            className={cn(
              "absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all",
              {
                "opacity-50 cursor-not-allowed": currentIndex === maxIndex,
              }
            )}
            onClick={goToNext}
            disabled={currentIndex === maxIndex}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Pagination dots */}
      {totalItems > itemsPerSlide && maxIndex > 0 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              className={cn("w-2 h-2 rounded-full transition-all", {
                "bg-gray-800": index === currentIndex,
                "bg-gray-400 hover:bg-gray-600": index !== currentIndex,
              })}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {totalItems > itemsPerSlide && (
        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
          <motion.div
            className="bg-gray-800 h-1 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentIndex + 1) / (maxIndex + 1)) * 100}%`,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      )}
    </div>
  );
}
