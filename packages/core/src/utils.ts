/// <reference path="./global.d.ts" />
import type {
	CartItem,
	Category,
	PerformanceMetrics,
	ShopifyProduct,
	ShopifyVariant,
	SiteConfig,
} from "./types";

// Configuration utilities
export function validateSiteConfig(config: unknown): config is SiteConfig {
	try {
		// Basic validation - in a real implementation, use Zod schema
		return (
			typeof config === "object" &&
			config !== null &&
			"id" in config &&
			"categories" in config &&
			"settings" in config
		);
	} catch {
		return false;
	}
}

export function generateConfigId(): string {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < 10; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Create enhanced site config with real Shopify data
 */
export async function createEnhancedSiteConfig(
	shopDomain: string,
	accessToken?: string,
): Promise<SiteConfig> {
	// Import Shopify services dynamically to avoid circular dependencies
	const { createShopifyStorefrontService } = await import(
		"./services/shopify-storefront"
	);
	const { transformProduct } = await import("./services/shopify-transformer");

	// Clean up shop domain - remove https:// prefix and trailing slashes
	const cleanShopDomain = shopDomain
		.replace(/^https?:\/\//, '')  // Remove http:// or https://
		.replace(/\/$/, '');           // Remove trailing slash

	let realProducts: unknown[] = [];

	// Fetch real products if we have access token
	if (accessToken) {
		try {
			const shopifyService = createShopifyStorefrontService(
				cleanShopDomain,
				accessToken,
			);

			// Fetch first 8 products for the demo
			const searchResult = await shopifyService.searchProducts("*", 8);
			realProducts = (searchResult.products as unknown[]).map((p) =>
				transformProduct(
					p as {
						id: string;
						title: string;
						handle: string;
						description?: string | null;
						images?: {
							nodes?: Array<{
								id: string;
								url: string;
								altText?: string | null;
								width: number;
								height: number;
							}>;
						};
						variants?: { nodes?: Array<unknown> };
						priceRange: {
							minVariantPrice: { amount: string; currencyCode: string };
							maxVariantPrice: { amount: string; currencyCode: string };
						};
						tags?: string[];
						productType?: string;
						vendor?: string;
						availableForSale: boolean;
						createdAt: string;
						updatedAt: string;
					},
				),
			) as unknown[];

			console.log(`Loaded ${realProducts.length} products from Shopify`);
		} catch (error) {
			console.warn("Failed to load Shopify products, using mock data:", error);
		}
	}

	// Use real products or fallback to mock
	const productsToUse =
		realProducts.length > 0 ? realProducts.slice(0, 4) : ([] as unknown[]);

	return createSiteConfigWithProducts(cleanShopDomain, productsToUse, accessToken);
}

/**
 * Create site config with provided products (real or mock)
 */
function createSiteConfigWithProducts(
	shopDomain: string,
	products: unknown[],
	accessToken?: string,
): SiteConfig {
	// Generate mock products if none provided
	const mockProducts = [
		{
			id: "product-1",
			title: "Essential Tee",
			handle: "essential-tee",
			images: [
				{
					url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
				},
			],
			priceRange: { minVariantPrice: { amount: "29.00", currencyCode: "USD" } },
		},
		{
			id: "product-2",
			title: "Vintage Jacket",
			handle: "vintage-jacket",
			images: [
				{
					url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
				},
			],
			priceRange: { minVariantPrice: { amount: "89.00", currencyCode: "USD" } },
		},
		{
			id: "product-3",
			title: "Classic Jeans",
			handle: "classic-jeans",
			images: [
				{
					url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
				},
			],
			priceRange: { minVariantPrice: { amount: "65.00", currencyCode: "USD" } },
		},
		{
			id: "product-4",
			title: "Statement Sneakers",
			handle: "statement-sneakers",
			images: [
				{
					url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
				},
			],
			priceRange: {
				minVariantPrice: { amount: "125.00", currencyCode: "USD" },
			},
		},
	];

	type MinimalProduct = {
		id: string;
		title: string;
		handle: string;
		images: Array<{ url: string }>;
		priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
	};

	const finalProducts: MinimalProduct[] = (
		(products.length > 0 ? products : mockProducts) as unknown[]
	).map((p) => p as MinimalProduct);

	// Create product items for the config
	const productItems = finalProducts.map((product, index) => ({
		id: product.id,
		title: product.title,
		card: [
			"product" as const,
			{
				link: `https://${shopDomain}/products/${product.handle}`,
				price: `$${Number.parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}`,
				image: product.images[0]?.url || "",
			},
		],
		categoryType: ["single" as const, { children: [] }],
		order: index + 1,
		visible: true,
	}));

	return createBaseSiteConfig(
		shopDomain,
		productItems,
		finalProducts[0],
		accessToken,
	);
}

/**
 * Internal function to create site config structure
 */
function createBaseSiteConfig(
	shopDomain: string,
	productItems: unknown[],
	featuredProduct?: unknown,
	accessToken?: string,
): SiteConfig {
	return {
		id: generateConfigId(),
		version: "1.0.0",
		categories: [
			{
				id: "instagram",
				title: "INSTAGRAM",
				card: [
					"grid",
					{
						link: null,
						shape: ["square"],
					},
				],
				categoryType: [
					"feed",
					{
						children: [
							{
								id: "instagram-1",
								title: "Latest Post",
								card: [
									"image",
									{
										image:
											"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop",
										clickAction: {
											type: "modal",
											target: "instagram-1",
										},
										hoverEffect: {
											type: "zoom",
											intensity: 0.05,
											duration: 200,
										},
										productTags: [
											{
												productId:
													(featuredProduct as { id?: string } | undefined)
														?.id || "prod_abc",
												position: { x: 0.6, y: 0.4 },
												label:
													(featuredProduct as { title?: string } | undefined)
														?.title || "Essential Tee",
											},
										],
									},
								],
								categoryType: ["single", { children: [] }],
								order: 1,
								visible: true,
							},
							{
								id: "instagram-2",
								title: "Behind the Scenes",
								card: [
									"image",
									{
										link: "https://instagram.com/demo",
										image:
											"https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop",
									},
								],
								categoryType: ["single", { children: [] }],
								order: 2,
								visible: true,
							},
							{
								id: "instagram-3",
								title: "Style Guide",
								card: [
									"image",
									{
										link: "https://instagram.com/demo",
										image:
											"https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop",
									},
								],
								categoryType: ["single", { children: [] }],
								order: 3,
								visible: true,
							},
							{
								id: "instagram-4",
								title: "New Collection",
								card: [
									"image",
									{
										link: "https://instagram.com/demo",
										image:
											"https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=400&fit=crop",
									},
								],
								categoryType: ["single", { children: [] }],
								order: 4,
								visible: true,
							},
						],
						displayType: "grid",
						itemsPerRow: 2,
					},
				],
				order: 1,
				visible: true,
			},
			{
				id: "shop",
				title: "SHOP",
				card: [
					"product",
					{
						link: null,
					},
				],
				categoryType: [
					"products",
					{
						children: productItems as unknown as Category[],
						products: [],
						displayType: "grid",
						itemsPerRow: 2,
					},
				],
				order: 2,
				visible: true,
			},
			{
				id: "lookbook",
				title: "LOOKBOOK",
				card: [
					"image",
					{
						link: null,
						shape: ["landscape"],
					},
				],
				categoryType: [
					"gallery",
					{
						children: [
							{
								id: "lookbook-1",
								title: "Spring Collection",
								card: [
									"image",
									{
										link: null,
										image:
											"https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=600&fit=crop",
										overlay: { text: "SPRING 2024", position: "center" },
									},
								],
								categoryType: ["single", { children: [] }],
								order: 1,
								visible: true,
							},
							{
								id: "lookbook-2",
								title: "Urban Essentials",
								card: [
									"image",
									{
										link: null,
										image:
											"https://images.unsplash.com/photo-1506629905587-4b1d7673dab7?w=800&h=600&fit=crop",
										overlay: { text: "URBAN", position: "center" },
									},
								],
								categoryType: ["single", { children: [] }],
								order: 2,
								visible: true,
							},
						],
						displayType: "slider",
					},
				],
				order: 3,
				visible: true,
			},
		],
		settings: {
			checkoutLink: `https://${shopDomain}/cart`,
			shopDomain,
			brand: {
				name: "DEMO.STORE",
				subtitle: "Interactive link in bio tool by maker",
				socialLinks: {
					instagram: "https://instagram.com/demo",
					twitter: "https://twitter.com/demo",
					pinterest: "https://pinterest.com/demo",
				},
				ctaButton: {
					text: "Visit Demo.Store",
					url: `https://${shopDomain}`,
				},
			},
			theme: {
				primaryColor: "#FFFFFF",
				backgroundColor: "#000000",
				textColor: "#FFFFFF",
				accentColor: "#666666",
				fontFamily: "Inter",
				borderRadius: "sm",
			},
			animations: {
				transitions: {
					duration: 300,
					easing: "cubic-bezier(0.25, 0.8, 0.25, 1)",
				},
				modals: {
					fadeIn: 200,
					slideIn: 400,
					backdrop: {
						opacity: 0.8,
						blur: 4,
					},
				},
				hover: {
					scale: 1.05,
					duration: 200,
				},
			},
			modals: {
				backdrop: {
					blur: true,
					opacity: 0.8,
				},
				positioning: {
					centered: true,
					offsetY: 0,
				},
				behavior: {
					closeOnBackdrop: true,
					closeOnEscape: true,
					preventScroll: true,
				},
			},
			seo: {
				title: "DEMO.STORE - Link in Bio",
				description: "Interactive link in bio for fashion and lifestyle brands",
				keywords: "fashion, lifestyle, shopping, demo",
			},
			// Include Shopify settings if access token is provided
			...(accessToken && {
				shopify: {
					storefrontAccessToken: accessToken,
					installedAt: new Date().toISOString(),
				},
			}),
		},
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
}

/**
 * Legacy synchronous function for backward compatibility
 */
export function createDefaultSiteConfig(
	shopDomain: string,
	accessToken?: string,
): SiteConfig {
	return createSiteConfigWithProducts(shopDomain, [], accessToken);
}

// Category utilities
export function findCategoryById(
	categories: Category[],
	id: string,
): Category | null {
	for (const category of categories) {
		if (category.id === id) {
			return category;
		}
		if (category.children) {
			const found = findCategoryById(category.children, id);
			if (found) return found;
		}
	}
	return null;
}

export function flattenCategories(categories: Category[]): Category[] {
	const result: Category[] = [];

	function traverse(cats: Category[]) {
		for (const cat of cats) {
			result.push(cat);
			if (cat.children) {
				traverse(cat.children);
			}
		}
	}

	traverse(categories);
	return result;
}

export function reorderCategories(
	categories: Category[],
	fromIndex: number,
	toIndex: number,
): Category[] {
	const result = [...categories];
	const [removed] = result.splice(fromIndex, 1);
	if (!removed) {
		return result;
	}
	result.splice(toIndex, 0, removed);

	// Update order properties
	return result.map((cat, index) => ({
		...cat,
		order: index + 1,
	}));
}

// Cart utilities
export function calculateCartTotal(items: CartItem[]): number {
	return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function formatPrice(amount: number, currencyCode = "USD"): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currencyCode,
	}).format(amount / 100); // Assuming amounts are in cents
}

export function generateCartId(): string {
	return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function addToCart(
	currentItems: CartItem[],
	product: ShopifyProduct,
	variantId: string,
	quantity = 1,
): CartItem[] {
	const variant = product.variants.find((v) => v.id === variantId);
	if (!variant) {
		throw new Error("Variant not found");
	}

	const existingItemIndex = currentItems.findIndex(
		(item) => item.productId === product.id && item.variantId === variantId,
	);

	if (existingItemIndex >= 0) {
		// Update existing item quantity
		const updatedItems = [...currentItems];
		const existingItem = updatedItems[existingItemIndex];
		if (existingItem) {
			updatedItems[existingItemIndex] = {
				...existingItem,
				quantity: existingItem.quantity + quantity,
			};
		}
		return updatedItems;
	}

	// Add new item
	const newItem: CartItem = {
		id: `${product.id}_${variantId}`,
		productId: product.id,
		variantId,
		title: product.title,
		price: Number.parseFloat(variant.price.amount) * 100, // Convert to cents
		quantity,
		image: variant.image?.url || product.images[0]?.url || "",
		variant: {
			title: variant.title,
			selectedOptions: variant.selectedOptions,
		},
	};

	return [...currentItems, newItem];
}

export function removeFromCart(
	currentItems: CartItem[],
	itemId: string,
): CartItem[] {
	return currentItems.filter((item) => item.id !== itemId);
}

export function updateCartItemQuantity(
	currentItems: CartItem[],
	itemId: string,
	quantity: number,
): CartItem[] {
	if (quantity <= 0) {
		return removeFromCart(currentItems, itemId);
	}

	return currentItems.map((item) =>
		item.id === itemId ? { ...item, quantity } : item,
	);
}

// Shopify utilities
export function buildCheckoutUrl(
	shopDomain: string,
	items: CartItem[],
): string {
	const baseUrl = `https://${shopDomain}/cart`;

	if (items.length === 0) {
		return baseUrl;
	}

	// Build variant query string
	const variantParams = items
		.map((item) => `${item.variantId}:${item.quantity}`)
		.join(",");

	return `${baseUrl}/${variantParams}`;
}

export function extractShopFromDomain(domain: string): string {
	// Handle both myshopify.com and custom domains
	if (domain.includes(".myshopify.com")) {
		return domain.replace(".myshopify.com", "");
	}
	return domain.split(".")[0] || "";
}

export function buildStorefrontUrl(shopDomain: string): string {
	if (shopDomain.includes(".myshopify.com")) {
		return `https://${shopDomain}`;
	}
	return `https://${shopDomain}.myshopify.com`;
}

// Performance utilities
export function measureLCP(): Promise<number> {
	return new Promise((resolve) => {
		if (typeof window === "undefined") {
			resolve(0);
			return;
		}

		new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const lastEntry = entries[entries.length - 1] as PerformanceEntry;
			resolve(lastEntry.startTime);
		}).observe({ entryTypes: ["largest-contentful-paint"] });

		// Fallback after 5 seconds
		setTimeout(() => resolve(0), 5000);
	});
}

export function measureFID(): Promise<number> {
	return new Promise((resolve) => {
		if (typeof window === "undefined") {
			resolve(0);
			return;
		}

		new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
				processingStart: number;
			};
			resolve(lastEntry.processingStart - lastEntry.startTime);
		}).observe({ entryTypes: ["first-input"] });

		// Fallback after 5 seconds
		setTimeout(() => resolve(0), 5000);
	});
}

export function createPerformanceMetrics(
	configId: string,
): Partial<PerformanceMetrics> {
	if (typeof window === "undefined") {
		return { configId, timestamp: new Date() };
	}

	const navigation = performance.getEntriesByType(
		"navigation",
	)[0] as PerformanceNavigationTiming;
	const connection = (
		navigator as unknown as { connection?: { effectiveType?: string } }
	).connection;

	return {
		configId,
		ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0,
		timestamp: new Date(),
		userAgent: navigator.userAgent,
		connection: connection?.effectiveType,
	};
}

// URL utilities
export function buildSiteUrl(
	baseUrl: string,
	configId: string,
	draft?: string,
): string {
	const url = new URL(`/g/${configId}`, baseUrl);
	if (draft) {
		url.searchParams.set("draft", draft);
	}
	return url.toString();
}

export function buildProductUrl(
	baseUrl: string,
	configId: string,
	productId: string,
): string {
	return new URL(`/g/${configId}/qv/${productId}`, baseUrl).toString();
}

// Image utilities
export function optimizeImageUrl(
	url: string,
	width?: number,
	height?: number,
): string {
	if (!url.includes("cdn.shopify.com")) {
		return url;
	}

	const urlObj = new URL(url);

	if (width) {
		urlObj.searchParams.set("width", width.toString());
	}

	if (height) {
		urlObj.searchParams.set("height", height.toString());
	}

	// Add format optimization
	urlObj.searchParams.set("format", "webp");

	return urlObj.toString();
}

export function generateImageSrcSet(url: string, sizes: number[]): string {
	return sizes
		.map((size) => `${optimizeImageUrl(url, size)} ${size}w`)
		.join(", ");
}

// Validation utilities
export function isValidHexColor(color: string): boolean {
	return /^#[0-9A-F]{6}$/i.test(color);
}

export function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

export function sanitizeHtml(html: string): string {
	if (typeof window === "undefined") {
		// Server-side: basic sanitization by escaping HTML
		return html
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#x27;");
	}

	const div = document.createElement("div");
	div.textContent = html;
	return div.innerHTML;
}

// Debounce utility for performance
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout>;

	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

// Deep clone utility
export function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

// Local storage utilities
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
	if (typeof window === "undefined") {
		return fallback;
	}

	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : fallback;
	} catch {
		return fallback;
	}
}

export function safeLocalStorageSet<T>(key: string, value: T): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}
