/**
 * Instagram-Native Tile System
 * Three distinct tile types for the grid
 */

export type TileType = "shoppable" | "editorial" | "navigation";

export interface BaseTile {
  id: string;
  type: TileType;
  order: number;
  visible: boolean;
  pinned?: boolean;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Shoppable Media Post - Image/video with tagged products
export interface ShoppableTile extends BaseTile {
  type: "shoppable";
  media: {
    type: "image" | "video";
    url: string;
    thumbnailUrl?: string;
    width: number;
    height: number;
    aspectRatio: "1:1" | "4:5" | "9:16";
    duration?: number; // For videos, in seconds
    coverFrame?: number; // For videos, timestamp in seconds
  };
  caption?: string;
  products: ProductTag[];
  hotspotStyle: "dot" | "dot-text" | "numbered";
  hotspotsVisible: boolean; // Can be false for analytics-only
  clickAction: "modal" | "product" | "cart";
  layout: "standard" | "wide" | "tall";
  analytics: {
    views: number;
    taps: number;
    productClicks: number;
    addToCart: number;
  };
}

// Editorial Post - Non-shoppable content for branding
export interface EditorialTile extends BaseTile {
  type: "editorial";
  media: {
    type: "image" | "video";
    url: string;
    thumbnailUrl?: string;
    width: number;
    height: number;
    aspectRatio: "1:1" | "4:5" | "9:16";
    duration?: number;
    coverFrame?: number;
  };
  caption?: string;
  link?: {
    url: string;
    type: "internal" | "external";
    target?: "_blank" | "_self";
  };
  layout: "standard" | "wide" | "tall";
  analytics: {
    views: number;
    taps: number;
    linkClicks: number;
  };
}

// Navigation Tile - Text overlay for navigation
export interface NavigationTile extends BaseTile {
  type: "navigation";
  background: {
    type: "color" | "gradient" | "image";
    value: string; // Hex color, gradient string, or image URL
  };
  text: {
    primary: string;
    secondary?: string;
    alignment: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";
    size: "small" | "medium" | "large" | "xlarge";
    color: string; // Hex color
    fontWeight: "normal" | "medium" | "semibold" | "bold";
  };
  link: {
    url: string;
    type: "collection" | "page" | "external";
    target?: "_blank" | "_self";
  };
  icon?: {
    type: "arrow" | "plus" | "star" | "heart" | "bag" | "custom";
    position: "before" | "after";
    url?: string; // For custom icons
  };
  layout: "standard" | "wide" | "tall";
  analytics: {
    views: number;
    clicks: number;
  };
}

// Product Tag for hotspots
export interface ProductTag {
  id: string;
  productId: string;
  variantId?: string;
  position: {
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
  };
  label?: string;
  price?: string;
  visible: boolean;
  pulseAnimation?: boolean;
  clickAction: "quickview" | "product" | "cart";
}

// Tile Collection
export interface TileCollection {
  id: string;
  name: string;
  description?: string;
  tiles: string[]; // Tile IDs
  layout: GridLayout;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Grid Layout Configuration
export interface GridLayout {
  type: "grid" | "masonry" | "stories";
  columns: {
    mobile: 2 | 3;
    tablet: 3 | 4;
    desktop: 4 | 5 | 6;
  };
  gap: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  aspectRatio?: "1:1" | "4:5" | "9:16" | "mixed";
  density: "compact" | "regular" | "spacious";
}

// Tile Union Type
export type Tile = ShoppableTile | EditorialTile | NavigationTile;

// Helper type guards
export function isShoppableTile(tile: Tile): tile is ShoppableTile {
  return tile.type === "shoppable";
}

export function isEditorialTile(tile: Tile): tile is EditorialTile {
  return tile.type === "editorial";
}

export function isNavigationTile(tile: Tile): tile is NavigationTile {
  return tile.type === "navigation";
}

// Conversion from legacy Category to new Tile system
export function categoryToTile(category: any): Tile | null {
  // Implementation to convert existing categories to tiles
  // This is a migration helper
  
  if (!category || !category.card) return null;
  
  const [cardType, cardDetails] = category.card;
  const hasProducts = cardDetails.products && cardDetails.products.length > 0;
  const hasLink = cardDetails.link && !hasProducts;
  const isNavigation = cardDetails.overlay && cardDetails.overlay.text;
  
  const baseFields = {
    id: category.id,
    order: category.order || 0,
    visible: category.visible !== false,
    pinned: false,
    scheduledAt: null,
    publishedAt: new Date(),
    createdAt: new Date(category.createdAt || Date.now()),
    updatedAt: new Date(category.updatedAt || Date.now()),
  };
  
  // Navigation tile
  if (isNavigation) {
    return {
      ...baseFields,
      type: "navigation",
      background: {
        type: cardDetails.image ? "image" : "color",
        value: cardDetails.image || "#000000",
      },
      text: {
        primary: cardDetails.overlay.text,
        alignment: cardDetails.overlay.position || "center",
        size: "medium",
        color: "#FFFFFF",
        fontWeight: "semibold",
      },
      link: {
        url: cardDetails.link || "#",
        type: "collection",
      },
      layout: "standard",
      analytics: {
        views: 0,
        clicks: 0,
      },
    } as NavigationTile;
  }
  
  // Shoppable tile
  if (hasProducts) {
    return {
      ...baseFields,
      type: "shoppable",
      media: {
        type: cardDetails.videoUrl ? "video" : "image",
        url: cardDetails.videoUrl || cardDetails.image || cardDetails.imageUrl,
        width: 1080,
        height: 1080,
        aspectRatio: "1:1",
      },
      products: cardDetails.productTags || [],
      hotspotStyle: "dot-text",
      hotspotsVisible: true,
      clickAction: "modal",
      layout: "standard",
      analytics: {
        views: 0,
        taps: 0,
        productClicks: 0,
        addToCart: 0,
      },
    } as ShoppableTile;
  }
  
  // Editorial tile
  return {
    ...baseFields,
    type: "editorial",
    media: {
      type: cardDetails.videoUrl ? "video" : "image",
      url: cardDetails.videoUrl || cardDetails.image || cardDetails.imageUrl,
      width: 1080,
      height: 1080,
      aspectRatio: "1:1",
    },
    caption: cardDetails.description,
    link: cardDetails.link ? {
      url: cardDetails.link,
      type: "external",
    } : undefined,
    layout: "standard",
    analytics: {
      views: 0,
      taps: 0,
      linkClicks: 0,
    },
  } as EditorialTile;
}