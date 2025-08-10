import { vi } from "vitest";
import type { ShopifyProduct, SiteConfig } from "./types";

/**
 * Mock data factory for testing
 */
export const createMockSiteConfig = (
	overrides: Partial<SiteConfig> = {},
): SiteConfig => ({
	id: "test-config",
	version: "1.0.0",
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
	categories: [
		{
			id: "instagram",
			title: "Instagram",
			card: [
				"image",
				{
					imageUrl: "https://example.com/image.jpg",
					link: "https://instagram.com/test",
				},
			],
			categoryType: [
				"feed",
				{
					displayType: "grid",
					itemsPerRow: 3,
					children: [],
				},
			],
			visible: true,
			order: 1,
		},
	],
	settings: {
		checkoutLink: "https://test.myshopify.com/cart",
		shopDomain: "test.myshopify.com",
		theme: {
			primaryColor: "#000000",
			backgroundColor: "#FFFFFF",
			textColor: "#333333",
			accentColor: "#FF0000",
			fontFamily: "Inter",
			borderRadius: "md",
		},
		brand: {
			name: "Test Store",
			subtitle: "Test Description",
		},
		seo: {
			title: "Test Store",
			description: "Test store description",
		},
	},
	...overrides,
});

/**
 * Mock Shopify product factory
 */
export const createMockShopifyProduct = (
	overrides: Partial<ShopifyProduct> = {},
): ShopifyProduct => ({
	id: "gid://shopify/Product/123",
	title: "Test Product",
	handle: "test-product",
	description: "Test product description",
	images: [
		{
			id: "gid://shopify/ProductImage/123",
			url: "https://cdn.shopify.com/test-image.jpg",
			altText: "Test Image",
			width: 500,
			height: 500,
		},
	],
	variants: [
		{
			id: "gid://shopify/ProductVariant/123",
			title: "Default Title",
			price: { amount: "29.99", currencyCode: "USD" },
			availableForSale: true,
			selectedOptions: [],
			requiresShipping: true,
		},
	],
	priceRange: {
		minVariantPrice: { amount: "29.99", currencyCode: "USD" },
		maxVariantPrice: { amount: "29.99", currencyCode: "USD" },
	},
	tags: ["test", "product"],
	productType: "Test Type",
	vendor: "Test Vendor",
	availableForSale: true,
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
	...overrides,
});

/**
 * Mock R2 service for testing
 */
export const createMockR2Service = () => ({
	getConfig: vi.fn().mockResolvedValue(createMockSiteConfig()),
	putConfig: vi.fn().mockResolvedValue(undefined),
	deleteConfig: vi.fn().mockResolvedValue(undefined),
	listConfigs: vi.fn().mockResolvedValue([]),
});

/**
 * Mock Shopify service for testing
 */
export const createMockShopifyService = () => ({
	getProduct: vi.fn().mockResolvedValue(createMockShopifyProduct()),
	getProducts: vi.fn().mockResolvedValue([createMockShopifyProduct()]),
	searchProducts: vi.fn().mockResolvedValue([createMockShopifyProduct()]),
	createCart: vi.fn().mockResolvedValue({
		id: "test-cart-id",
		checkoutUrl: "https://test.myshopify.com/cart/test-checkout-url",
	}),
	addToCart: vi.fn().mockResolvedValue(undefined),
	updateCartItem: vi.fn().mockResolvedValue(undefined),
	removeFromCart: vi.fn().mockResolvedValue(undefined),
});

/**
 * Mock edge cache for testing
 */
export const createMockEdgeCache = () => ({
	get: vi.fn(),
	set: vi.fn(),
	delete: vi.fn(),
	clear: vi.fn(),
});
