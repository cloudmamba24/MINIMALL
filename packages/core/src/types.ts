// Core types for the link-in-bio platform

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
	layout?: LayoutConfig; // New layout system
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
		position:
			| "top-left"
			| "top-right"
			| "bottom-left"
			| "bottom-right"
			| "center";
	};
	// Enhanced for interactivity
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
	pixels?: PixelSettings; // Analytics pixels
	experiments?: ExperimentConfig[]; // A/B testing
	shopify?: ShopifySettings; // Shopify integration settings
}

export interface ShopifySettings {
	storefrontAccessToken?: string; // Per-shop storefront token
	webhookSecret?: string; // For webhook validation
	appId?: string; // Shopify app installation ID
	scope?: string[]; // Granted permissions
	installedAt?: string; // Installation timestamp
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

// Shopify types
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

// Cart types
export interface CartItem {
	id: string;
	productId: string;
	variantId: string;
	title: string;
	price: number; // in cents
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
	totalPrice: number; // in cents
	checkoutUrl?: string;
	createdAt: string;
	updatedAt: string;
}

// Performance monitoring types
export interface PerformanceMetrics {
	configId: string;
	lcp?: number; // Largest Contentful Paint
	fid?: number; // First Input Delay
	cls?: number; // Cumulative Layout Shift
	ttfb?: number; // Time to First Byte
	loadTime?: number;
	timestamp: Date;
	userAgent?: string;
	connection?: string;
	viewport?: {
		width: number;
		height: number;
	};
}

// API Response types
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

// Admin types
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

// Webhook types
export interface ShopifyWebhookPayload {
	id: string;
	event: string;
	shop_domain: string;
	created_at: string;
	data: unknown;
}

// Image processing types
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

// Analytics types
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

// Error types
export interface AppError {
	code: string;
	message: string;
	details?: unknown;
	timestamp: Date;
	stack?: string;
	userId?: string;
	configId?: string;
}

// Feature flags
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

// Utility types
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> &
	Partial<Pick<T, K>>;

// Event types for real-time updates
export type ConfigEvent =
	| { type: "CONFIG_CREATED"; configId: string; data: SiteConfig }
	| { type: "CONFIG_UPDATED"; configId: string; data: Partial<SiteConfig> }
	| { type: "CONFIG_PUBLISHED"; configId: string; versionId: string }
	| { type: "CONFIG_DELETED"; configId: string };

export type CartEvent =
	| { type: "ITEM_ADDED"; cartId: string; item: CartItem }
	| { type: "ITEM_REMOVED"; cartId: string; itemId: string }
	| {
			type: "ITEM_UPDATED";
			cartId: string;
			itemId: string;
			updates: Partial<CartItem>;
	  }
	| { type: "CART_CLEARED"; cartId: string };

// Constants
export const CARD_TYPES = ["image", "video", "product", "grid"] as const;
export const CATEGORY_TYPES = ["feed", "products", "gallery"] as const;
export const DISPLAY_TYPES = ["grid", "slider", "list"] as const;
export const THEME_RADIUS_OPTIONS = ["none", "sm", "md", "lg", "xl"] as const;

export type CardType = (typeof CARD_TYPES)[number];
export type CategoryType = (typeof CATEGORY_TYPES)[number];
export type DisplayType = (typeof DISPLAY_TYPES)[number];
export type ThemeRadius = (typeof THEME_RADIUS_OPTIONS)[number];

// Enhanced interactivity types
export interface ProductTag {
	productId: string;
	position: {
		x: number; // 0-1 relative position
		y: number; // 0-1 relative position
	};
	label?: string;
}

export interface ClickAction {
	type: "modal" | "quickview" | "link" | "cart";
	target?: string; // postId, productId, or URL
	data?: unknown; // Additional action data
}

export interface HoverEffect {
	type: "zoom" | "fade" | "slide" | "overlay";
	intensity?: number; // 0-1 scale
	duration?: number; // milliseconds
}

export interface AnimationSettings {
	transitions: {
		duration: number; // Default transition duration in ms
		easing: string; // CSS easing function
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
		scale: number; // Default hover scale
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

// Enhanced Layout System Types
export interface LayoutConfig {
	preset: LayoutPreset | SocialLayoutPreset;
	rows: number; // 1-6
	columns: number; // 1-4
	gutter: number; // 0-32 px
	outerMargin: number; // 0-64 px
	borderRadius: number; // 0-24 px
	hoverZoom: boolean;
	aspect: AspectRatio;
	mediaFilter: MediaFilter;
	responsive?: ResponsiveOverrides;
	blockId: string; // Stable ID for analytics
	experimentKey?: string; // A/B variant label
}

export interface ResponsiveOverrides {
	sm?: Partial<
		Pick<LayoutConfig, "rows" | "columns" | "gutter" | "outerMargin">
	>;
	md?: Partial<
		Pick<LayoutConfig, "rows" | "columns" | "gutter" | "outerMargin">
	>;
	lg?: Partial<
		Pick<LayoutConfig, "rows" | "columns" | "gutter" | "outerMargin">
	>;
}

// Analytics and Attribution Types
export interface PixelSettings {
	facebook?: string;
	google?: string;
	tiktok?: string;
	pinterest?: string;
	snapchat?: string;
	custom?: Array<{
		name: string;
		id: string;
		type: "script" | "pixel" | "tag";
	}>;
}

export interface ExperimentConfig {
	key: string;
	name: string;
	description?: string;
	targets: ExperimentTarget[];
	trafficSplit: number; // 0-100 percentage
	status: "draft" | "running" | "paused" | "completed";
	startDate?: string;
	endDate?: string;
}

export interface ExperimentTarget {
	blockId: string;
	variantPercent: number; // 0-100
}

// Enhanced Analytics Events
export interface EnhancedAnalyticsEvent extends AnalyticsEvent {
	blockId?: string;
	layoutPreset?: LayoutPreset;
	variantId?: string;
	experimentKey?: string;
	device: DeviceType;
	country?: string;
}

// Template System Types
export interface LayoutTemplate {
	id: string;
	name: string;
	description: string;
	category: TemplateCategory;
	layout: LayoutConfig;
	preview?: string;
	tags: string[];
}

// Database Extension Types
export interface Shop {
	shopDomain: string;
	storefrontAccessToken: string;
	createdAt: string;
	updatedAt: string;
}

export interface Asset {
	id: string;
	shopDomain: string;
	type: "image" | "video";
	r2Key: string;
	originalFilename: string;
	fileSize: number;
	dimensions?: {
		width: number;
		height: number;
	};
	variants: AssetVariant[];
	createdAt: string;
	updatedAt: string;
}

export interface AssetVariant {
	key: string;
	width: number;
	height: number;
	format: string;
	quality?: number;
}

export interface UsageRollup {
	id: string;
	shopDomain: string;
	month: string; // YYYY-MM format
	mau: number; // Monthly Active Users
	impressions: number;
	checkouts: number;
	revenue: number; // in cents
	createdAt: string;
}

// Type Unions and Constants
export const LAYOUT_PRESETS = ["grid", "masonry", "slider", "stories"] as const;
export const ASPECT_RATIOS = ["1:1", "4:5", "9:16", "auto"] as const;
export const MEDIA_FILTERS = ["all", "photo", "video"] as const;
export const DEVICE_TYPES = ["mobile", "tablet", "desktop"] as const;
export const TEMPLATE_CATEGORIES = [
	"classic",
	"minimal",
	"video",
	"ecommerce",
] as const;

export type LayoutPreset = (typeof LAYOUT_PRESETS)[number];
export type AspectRatio = (typeof ASPECT_RATIOS)[number];
export type MediaFilter = (typeof MEDIA_FILTERS)[number];
export type DeviceType = (typeof DEVICE_TYPES)[number];
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

// UTM Tracking Types
export interface UTMParameters {
	source?: string;
	medium?: string;
	campaign?: string;
	term?: string;
	content?: string;
}

export interface AttributionData {
	configId: string;
	blockId: string;
	layoutPreset: LayoutPreset;
	experimentKey?: string;
	utm: UTMParameters;
	sessionId: string;
	device: DeviceType;
	timestamp: Date;
}

// Revenue Attribution Types
export interface RevenueAttribution extends AttributionData {
	orderId: string;
	lineItemId: string;
	productId: string;
	variantId: string;
	quantity: number;
	price: number; // in cents
	revenue: number; // in cents (price * quantity)
}

// Social Media Types
export type SocialPlatform = 'instagram' | 'tiktok' | 'twitter' | 'manual';

export interface SocialPost {
	id: string;
	configId: string;
	shopDomain: string;
	platform: SocialPlatform;
	originalUrl?: string; // null for manual uploads
	postId?: string; // Platform-specific post ID
	caption: string;
	hashtags: string[];
	mentions: string[];
	mediaUrls: string[]; // R2 URLs
	mediaMetadata: SocialMediaMetadata;
	engagement: SocialEngagement;
	author: SocialAuthor;
	publishedAt?: string; // Original post date
	importedAt: string;
	isActive: boolean;
	productTags: ProductTag[];
	performance: SocialPerformance;
	createdAt: string;
	updatedAt: string;
}

export interface SocialMediaMetadata {
	dimensions?: {
		width: number;
		height: number;
	};
	duration?: number; // for videos
	aspectRatio?: string;
	fileSize?: number;
	format?: string;
	thumbnail?: string; // for videos
}

export interface SocialEngagement {
	likes: number;
	comments: number;
	shares: number;
	views: number;
	saves?: number; // Instagram specific
	engagementRate?: number; // calculated
}

export interface SocialAuthor {
	username: string;
	displayName?: string;
	avatarUrl?: string;
	verified?: boolean;
	followerCount?: number;
	bio?: string;
}

export interface SocialPerformance {
	impressions: number;
	reach: number;
	profileVisits: number;
	websiteClicks: number;
	productViews: number;
	addToCarts: number;
	checkouts: number;
	purchases: number;
	revenue: number; // in cents
	clickThroughRate: number;
	conversionRate: number;
}

export interface SocialConnection {
	id: string;
	shopDomain: string;
	platform: Exclude<SocialPlatform, 'manual'>;
	platformUserId: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
	accessToken: string;
	refreshToken?: string;
	tokenExpiresAt?: string;
	scopes: string[];
	isActive: boolean;
	lastSyncAt?: string;
	syncSettings: SocialSyncSettings;
	createdAt: string;
	updatedAt: string;
}

export interface SocialSyncSettings {
	autoImport: boolean;
	importInterval: number; // minutes
	maxPostsPerSync: number;
	includeStories?: boolean;
	includeReels?: boolean;
	hashtagFilters?: string[]; // only import posts with these hashtags
	mentionFilters?: string[]; // only import posts with these mentions
	minimumEngagement?: number; // minimum likes to import
}

export interface SocialAnalytics {
	id: string;
	postId: string;
	configId: string;
	shopDomain: string;
	// Social engagement metrics
	impressions: number;
	reach: number;
	profileVisits: number;
	websiteClicks: number;
	// Commerce metrics
	productViews: number;
	addToCarts: number;
	checkouts: number;
	purchases: number;
	revenue: number; // in cents
	// Attribution data
	firstTouch: boolean;
	lastTouch: boolean;
	influenceScore: number; // 0-100 scale
	// Time-based metrics
	date: string; // YYYY-MM-DD
	hour?: number; // 0-23 for hourly breakdown
	createdAt: string;
}

// Social Media Import Types
export interface SocialImportRequest {
	url: string;
	platform: SocialPlatform;
	configId: string;
	options?: SocialImportOptions;
}

export interface SocialImportOptions {
	downloadMedia: boolean;
	tagProducts: boolean;
	extractHashtags: boolean;
	extractMentions: boolean;
	generateThumbnail: boolean; // for videos
}

export interface SocialImportResult {
	success: boolean;
	post?: SocialPost;
	error?: string;
	warnings?: string[];
}

// Enhanced Layout Types for Social Media
export interface SocialLayoutConfig extends LayoutConfig {
	socialFeatures: {
		showCaptions: 'hover' | 'always' | 'never';
		showEngagement: boolean;
		showUsernames: boolean;
		showTimestamps: boolean;
		platformBadges: boolean;
		hashtagHighlight: boolean;
	};
	filterOptions: {
		byPlatform: boolean;
		byHashtag: boolean;
		byDate: boolean;
		byEngagement: boolean;
	};
}

// Social-Enhanced Category Types
export interface SocialCategory extends Category {
	socialFilters?: {
		platforms?: SocialPlatform[];
		hashtags?: string[];
		mentions?: string[];
		dateRange?: {
			start: string;
			end: string;
		};
		minEngagement?: number;
	};
}

// Social Media Preset Constants
export const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'twitter', 'manual'] as const;
export const SOCIAL_LAYOUT_PRESETS = [
	'instagram-grid',
	'tiktok-vertical', 
	'pinterest-masonry',
	'twitter-timeline',
	'stories-horizontal'
] as const;

export type SocialLayoutPreset = (typeof SOCIAL_LAYOUT_PRESETS)[number];
