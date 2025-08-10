"use client";

import { Category, LayoutConfig } from "@minimall/core/types";
import { GridRenderer } from "./GridRenderer";
import { MasonryRenderer } from "./MasonryRenderer";
import { SliderRenderer } from "./SliderRenderer";
import { StoriesRenderer } from "./StoriesRenderer";

interface LayoutSwitchProps {
  category: Category;
  onTileClick?: (category: Category, index: number) => void;
  className?: string;
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
  className 
}: LayoutSwitchProps) {
  // Use layout config from category or fallback to default
  const layout = category.layout || DEFAULT_LAYOUT;

  // Ensure blockId exists for analytics
  if (!layout.blockId) {
    layout.blockId = `block_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Dispatch to appropriate renderer based on preset
  switch (layout.preset) {
    case 'grid':
      return (
        <GridRenderer
          category={category}
          layout={layout}
          onTileClick={onTileClick}
          className={className}
        />
      );

    case 'masonry':
      return (
        <MasonryRenderer
          category={category}
          layout={layout}
          onTileClick={onTileClick}
          className={className}
        />
      );

    case 'slider':
      return (
        <SliderRenderer
          category={category}
          layout={layout}
          onTileClick={onTileClick}
          className={className}
        />
      );

    case 'stories':
      return (
        <StoriesRenderer
          category={category}
          layout={layout}
          onTileClick={onTileClick}
          className={className}
        />
      );

    default:
      // Fallback to grid renderer for unknown presets
      console.warn(`Unknown layout preset: ${layout.preset}. Falling back to grid.`);
      return (
        <GridRenderer
          category={{ ...category, layout: { ...layout, preset: 'grid' } }}
          layout={{ ...layout, preset: 'grid' }}
          onTileClick={onTileClick}
          className={className}
        />
      );
  }
}