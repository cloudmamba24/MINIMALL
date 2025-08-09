export interface SiteConfig {
    id: string;
    version: string;
    categories: Category[];
    settings: Settings;
    createdAt: string;
    updatedAt: string;
}
export interface Category {
    id: string;
    title: string;
    card: [string, CardDetails];
    categoryType: [string, CategoryTypeDetails];
    children?: Category[];
    order?: number;
    visible?: boolean;
}
export interface CardDetails {
    link?: string | null;
    shape?: string[];
    image?: string;
    imageUrl?: string;
    videoUrl?: string;
    description?: string;
    products?: Product[];
    price?: string;
    overlay?: {
        text: string;
        position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
    };
    productTags?: ProductTag[];
    clickAction?: ClickAction;
    hoverEffect?: HoverEffect;
}
export interface CategoryTypeDetails {
    children: Category[];
    products?: Product[];
    displayType?: "grid" | "slider" | "list";
    itemsPerRow?: number;
}
export interface Product {
    id: string;
    productId: string;
    variantId?: string | null;
}
export interface Settings {
    checkoutLink: string;
    shopDomain: string;
    theme: Theme;
    seo?: SEOSettings;
    brand?: BrandSettings;
    animations?: AnimationSettings;
    modals?: ModalSettings;
}
export interface BrandSettings {
    name: string;
    subtitle?: string;
    logo?: string;
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        pinterest?: string;
        tiktok?: string;
        youtube?: string;
        website?: string;
    };
    ctaButton?: {
        text: string;
        url: string;
    };
}
export interface Theme {
    primaryColor: string;
    backgroundColor: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: string;
    borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
}
export interface SEOSettings {
    title?: string;
    description?: string;
    keywords?: string;
}
export interface ShopifyProduct {
    id: string;
    title: string;
    handle: string;
    description: string;
    images: ShopifyImage[];
    variants: ShopifyVariant[];
    priceRange: {
        minVariantPrice: MoneyV2;
        maxVariantPrice: MoneyV2;
    };
    tags: string[];
    productType: string;
    vendor: string;
    availableForSale: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface ShopifyVariant {
    id: string;
    title: string;
    price: MoneyV2;
    compareAtPrice?: MoneyV2;
    availableForSale: boolean;
    selectedOptions: SelectedOption[];
    image?: ShopifyImage;
    sku?: string;
    barcode?: string;
    weight?: number;
    weightUnit?: string;
    requiresShipping: boolean;
}
export interface ShopifyImage {
    id: string;
    url: string;
    altText?: string;
    width: number;
    height: number;
}
export interface MoneyV2 {
    amount: string;
    currencyCode: string;
}
export interface SelectedOption {
    name: string;
    value: string;
}
export interface CartItem {
    id: string;
    productId: string;
    variantId: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    variant: {
        title: string;
        selectedOptions: SelectedOption[];
    };
}
export interface Cart {
    id: string;
    items: CartItem[];
    totalQuantity: number;
    totalPrice: number;
    checkoutUrl?: string;
    createdAt: string;
    updatedAt: string;
}
export interface PerformanceMetrics {
    configId: string;
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
    loadTime?: number;
    timestamp: Date;
    userAgent?: string;
    connection?: string;
    viewport?: {
        width: number;
        height: number;
    };
}
export interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}
export interface PaginatedResponse<T = unknown> extends APIResponse<T> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
export interface AdminUser {
    id: string;
    email: string;
    name: string;
    shopDomain: string;
    role: "owner" | "admin" | "editor";
    permissions: string[];
    createdAt: string;
    updatedAt: string;
}
export interface ConfigVersion {
    id: string;
    configId: string;
    version: string;
    data: SiteConfig;
    createdBy: string;
    createdAt: string;
    isPublished: boolean;
    publishedAt?: string;
}
export interface ShopifyWebhookPayload {
    id: string;
    event: string;
    shop_domain: string;
    created_at: string;
    data: unknown;
}
export interface ImageProcessingOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "avif" | "jpg" | "png";
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}
export interface OptimizedImage {
    original: string;
    webp?: string;
    avif?: string;
    placeholder?: string;
    dimensions: {
        width: number;
        height: number;
    };
}
export interface AnalyticsEvent {
    event: string;
    configId: string;
    userId?: string;
    sessionId: string;
    timestamp: Date;
    properties: Record<string, unknown>;
    userAgent?: string;
    referrer?: string;
    utm?: {
        source?: string;
        medium?: string;
        campaign?: string;
        term?: string;
        content?: string;
    };
}
export interface AnalyticsSummary {
    configId: string;
    period: "day" | "week" | "month";
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    averageSessionDuration: number;
    topProducts: Array<{
        productId: string;
        views: number;
        clicks: number;
        conversions: number;
    }>;
    topSources: Array<{
        source: string;
        visits: number;
        conversions: number;
    }>;
}
export interface AppError {
    code: string;
    message: string;
    details?: unknown;
    timestamp: Date;
    stack?: string;
    userId?: string;
    configId?: string;
}
export interface FeatureFlags {
    enableAdvancedAnalytics: boolean;
    enableABTesting: boolean;
    enableVideoCards: boolean;
    enableCustomCSS: boolean;
    enableMultiLanguage: boolean;
    maxConfigsPerShop: number;
    maxCategoriesPerConfig: number;
    maxItemsPerCategory: number;
}
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type ConfigEvent = {
    type: "CONFIG_CREATED";
    configId: string;
    data: SiteConfig;
} | {
    type: "CONFIG_UPDATED";
    configId: string;
    data: Partial<SiteConfig>;
} | {
    type: "CONFIG_PUBLISHED";
    configId: string;
    versionId: string;
} | {
    type: "CONFIG_DELETED";
    configId: string;
};
export type CartEvent = {
    type: "ITEM_ADDED";
    cartId: string;
    item: CartItem;
} | {
    type: "ITEM_REMOVED";
    cartId: string;
    itemId: string;
} | {
    type: "ITEM_UPDATED";
    cartId: string;
    itemId: string;
    updates: Partial<CartItem>;
} | {
    type: "CART_CLEARED";
    cartId: string;
};
export declare const CARD_TYPES: readonly ["image", "video", "product", "grid"];
export declare const CATEGORY_TYPES: readonly ["feed", "products", "gallery"];
export declare const DISPLAY_TYPES: readonly ["grid", "slider", "list"];
export declare const THEME_RADIUS_OPTIONS: readonly ["none", "sm", "md", "lg", "xl"];
export type CardType = (typeof CARD_TYPES)[number];
export type CategoryType = (typeof CATEGORY_TYPES)[number];
export type DisplayType = (typeof DISPLAY_TYPES)[number];
export type ThemeRadius = (typeof THEME_RADIUS_OPTIONS)[number];
export interface ProductTag {
    productId: string;
    position: {
        x: number;
        y: number;
    };
    label?: string;
}
export interface ClickAction {
    type: "modal" | "quickview" | "link" | "cart";
    target?: string;
    data?: unknown;
}
export interface HoverEffect {
    type: "zoom" | "fade" | "slide" | "overlay";
    intensity?: number;
    duration?: number;
}
export interface AnimationSettings {
    transitions: {
        duration: number;
        easing: string;
    };
    modals: {
        fadeIn: number;
        slideIn: number;
        backdrop: {
            opacity: number;
            blur: number;
        };
    };
    hover: {
        scale: number;
        duration: number;
    };
}
export interface ModalSettings {
    backdrop: {
        blur: boolean;
        opacity: number;
    };
    positioning: {
        centered: boolean;
        offsetY?: number;
    };
    behavior: {
        closeOnBackdrop: boolean;
        closeOnEscape: boolean;
        preventScroll: boolean;
    };
}
//# sourceMappingURL=types.d.ts.map