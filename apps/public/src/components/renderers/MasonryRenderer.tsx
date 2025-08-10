"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Category, LayoutConfig } from "@minimall/core/types";
import { cn } from "../../lib/utils";

interface MasonryRendererProps {
  category: Category;
  layout: LayoutConfig;
  onTileClick?: (category: Category, index: number) => void;
  className?: string;
}

interface MasonryItem {
  item: Category;
  height: number;
  loaded: boolean;
}

export function MasonryRenderer({ 
  category, 
  layout, 
  onTileClick,
  className 
}: MasonryRendererProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [masonryItems, setMasonryItems] = useState<MasonryItem[]>([]);
  const [columnHeights, setColumnHeights] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate responsive columns
  const getColumns = () => {
    if (!containerRef.current) return layout.columns;
    
    const containerWidth = containerRef.current.offsetWidth;
    const { responsive } = layout;
    
    if (responsive?.lg && containerWidth >= 1024) return responsive.lg.columns || layout.columns;
    if (responsive?.md && containerWidth >= 768) return responsive.md.columns || layout.columns;
    if (responsive?.sm && containerWidth >= 640) return responsive.sm.columns || layout.columns;
    
    return layout.columns;
  };

  const [columns, setColumns] = useState(getColumns());

  // Initialize column heights
  useEffect(() => {
    const cols = getColumns();
    setColumns(cols);
    setColumnHeights(new Array(cols).fill(0));
  }, [layout.columns, layout.responsive]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const cols = getColumns();
      if (cols !== columns) {
        setColumns(cols);
        setColumnHeights(new Array(cols).fill(0));
        // Re-calculate positions
        calculateMasonryLayout();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [columns]);

  // Filter items based on media type
  const getFilteredItems = () => {
    if (!category.children) return [];
    
    return category.children.filter((item) => {
      if (layout.mediaFilter === 'all') return true;
      
      const cardDetails = item.card[1];
      if (layout.mediaFilter === 'photo') {
        return cardDetails.image || cardDetails.imageUrl;
      }
      if (layout.mediaFilter === 'video') {
        return cardDetails.videoUrl;
      }
      return true;
    });
  };

  // Calculate natural height for images
  const calculateImageHeight = (item: Category): Promise<number> => {
    return new Promise((resolve) => {
      const cardDetails = item.card[1];
      const imageUrl = cardDetails.imageUrl || cardDetails.image;
      
      if (!imageUrl) {
        resolve(200); // Default height
        return;
      }

      const img = new Image();
      img.onload = () => {
        const containerWidth = containerRef.current?.offsetWidth || 300;
        const columnWidth = (containerWidth - (layout.gutter * (columns - 1)) - (layout.outerMargin * 2)) / columns;
        const naturalHeight = (img.naturalHeight / img.naturalWidth) * columnWidth;
        resolve(Math.max(naturalHeight, 100)); // Minimum height of 100px
      };
      img.onerror = () => resolve(200);
      img.src = imageUrl;
    });
  };

  // Calculate masonry layout
  const calculateMasonryLayout = async () => {
    const filteredItems = getFilteredItems();
    const items: MasonryItem[] = [];
    
    for (const item of filteredItems) {
      const height = await calculateImageHeight(item);
      items.push({
        item,
        height,
        loaded: true,
      });
    }
    
    setMasonryItems(items);
  };

  useEffect(() => {
    calculateMasonryLayout();
  }, [category, layout, columns]);

  // Get column for next item (shortest column)
  const getShortestColumn = (heights: number[]) => {
    let shortestIndex = 0;
    let shortestHeight = heights[0];
    
    for (let i = 1; i < heights.length; i++) {
      if (heights[i] < shortestHeight) {
        shortestHeight = heights[i];
        shortestIndex = i;
      }
    }
    
    return shortestIndex;
  };

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

  // Calculate positions for each item
  const getItemStyles = (index: number) => {
    if (!containerRef.current || !masonryItems[index]) return {};

    const containerWidth = containerRef.current.offsetWidth;
    const columnWidth = (containerWidth - (layout.gutter * (columns - 1)) - (layout.outerMargin * 2)) / columns;
    
    // Find which column this item should go in
    let tempHeights = [...columnHeights];
    let itemColumn = 0;
    
    for (let i = 0; i <= index; i++) {
      itemColumn = getShortestColumn(tempHeights);
      if (i === index) break;
      tempHeights[itemColumn] += masonryItems[i].height + layout.gutter;
    }
    
    const x = itemColumn * (columnWidth + layout.gutter);
    const y = tempHeights[itemColumn];
    
    return {
      position: 'absolute' as const,
      left: `${x}px`,
      top: `${y}px`,
      width: `${columnWidth}px`,
      height: `${masonryItems[index].height}px`,
      borderRadius: `${layout.borderRadius}px`,
    };
  };

  // Calculate total container height
  const getContainerHeight = () => {
    if (masonryItems.length === 0) return 400;
    
    let tempHeights = new Array(columns).fill(0);
    
    masonryItems.forEach((masonryItem) => {
      const shortestColumn = getShortestColumn(tempHeights);
      tempHeights[shortestColumn] += masonryItem.height + layout.gutter;
    });
    
    return Math.max(...tempHeights) + layout.outerMargin * 2;
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{
        height: `${getContainerHeight()}px`,
        padding: `${layout.outerMargin}px`,
      }}
    >
      {masonryItems.map((masonryItem, index) => {
        const { item } = masonryItem;
        const cardDetails = item.card[1];
        const isHovered = hoveredIndex === index;
        
        return (
          <motion.div
            key={`${item.id}-${index}`}
            className="overflow-hidden cursor-pointer"
            style={getItemStyles(index)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: layout.hoverZoom && isHovered ? 1.02 : 1 
            }}
            transition={{
              opacity: { duration: 0.5, delay: index * 0.1 },
              scale: { duration: 0.3, ease: "easeOut" },
            }}
            onClick={() => handleTileClick(item, index)}
            onHoverStart={() => handleTileHover(index)}
            onHoverEnd={() => setHoveredIndex(null)}
          >
            {/* Background Image/Video */}
            {cardDetails.videoUrl ? (
              <video
                src={cardDetails.videoUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={cardDetails.imageUrl || cardDetails.image}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}

            {/* Overlay */}
            {cardDetails.overlay && (
              <div 
                className={cn(
                  "absolute text-white font-medium",
                  {
                    'top-2 left-2': cardDetails.overlay.position === 'top-left',
                    'top-2 right-2': cardDetails.overlay.position === 'top-right',
                    'bottom-2 left-2': cardDetails.overlay.position === 'bottom-left',
                    'bottom-2 right-2': cardDetails.overlay.position === 'bottom-right',
                    'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2': 
                      cardDetails.overlay.position === 'center',
                  }
                )}
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

            {/* Product Tags */}
            {cardDetails.productTags?.map((tag, tagIndex) => (
              <div
                key={tagIndex}
                className="absolute w-3 h-3 bg-white rounded-full border-2 border-black shadow-lg animate-pulse"
                style={{
                  left: `${tag.position.x * 100}%`,
                  top: `${tag.position.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
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
    </div>
  );
}