/**
 * Tests for Shopify GraphQL Response Transformer
 * Ensures data normalization and type safety
 */

import { describe, expect, it } from "vitest";
import {
	transformMoney,
	transformImage,
	transformSelectedOption,
	transformVariant,
	transformProduct,
	getOptionValues,
	findVariantByOptions,
	calculateDiscountPercentage,
	optimizeShopifyImageUrl,
	formatShopifyPrice,
	centsToDisplay,
} from "./shopify-transformer";
import type { MoneyV2, ShopifyImage, SelectedOption, ShopifyVariant, ShopifyProduct } from "../types";

describe("Shopify Transformer", () => {
	describe("transformMoney", () => {
		it("should transform GraphQL money to MoneyV2", () => {
			const graphqlMoney = { amount: "19.99", currencyCode: "USD" };
			const result = transformMoney(graphqlMoney);
			
			expect(result).toEqual({
				amount: "19.99",
				currencyCode: "USD"
			});
		});

		it("should handle different currencies", () => {
			const graphqlMoney = { amount: "25.50", currencyCode: "EUR" };
			const result = transformMoney(graphqlMoney);
			
			expect(result.currencyCode).toBe("EUR");
			expect(result.amount).toBe("25.50");
		});
	});

	describe("transformImage", () => {
		it("should transform GraphQL image to ShopifyImage", () => {
			const graphqlImage = {
				id: "gid://shopify/ProductImage/123",
				url: "https://cdn.shopify.com/image.jpg",
				altText: "Product image",
				width: 800,
				height: 600
			};
			
			const result = transformImage(graphqlImage);
			
			expect(result).toEqual({
				id: "gid://shopify/ProductImage/123",
				url: "https://cdn.shopify.com/image.jpg",
				altText: "Product image",
				width: 800,
				height: 600
			});
		});

		it("should handle null altText", () => {
			const graphqlImage = {
				id: "gid://shopify/ProductImage/123",
				url: "https://cdn.shopify.com/image.jpg",
				altText: null,
				width: 800,
				height: 600
			};
			
			const result = transformImage(graphqlImage);
			expect(result.altText).toBe("");
		});

		it("should handle undefined altText", () => {
			const graphqlImage = {
				id: "gid://shopify/ProductImage/123",
				url: "https://cdn.shopify.com/image.jpg",
				width: 800,
				height: 600
			};
			
			const result = transformImage(graphqlImage);
			expect(result.altText).toBe("");
		});
	});

	describe("transformSelectedOption", () => {
		it("should transform GraphQL selected option", () => {
			const graphqlOption = { name: "Size", value: "Large" };
			const result = transformSelectedOption(graphqlOption);
			
			expect(result).toEqual({
				name: "Size",
				value: "Large"
			});
		});

		it("should handle color options", () => {
			const graphqlOption = { name: "Color", value: "Red" };
			const result = transformSelectedOption(graphqlOption);
			
			expect(result.name).toBe("Color");
			expect(result.value).toBe("Red");
		});
	});

	describe("getOptionValues", () => {
		it("should extract unique option values from variants", () => {
			const mockVariants: ShopifyVariant[] = [
				{
					id: "1",
					title: "Small / Red",
					price: { amount: "19.99", currencyCode: "USD" },
					availableForSale: true,
					selectedOptions: [
						{ name: "Size", value: "Small" },
						{ name: "Color", value: "Red" }
					],
					requiresShipping: true
				},
				{
					id: "2", 
					title: "Large / Blue",
					price: { amount: "24.99", currencyCode: "USD" },
					availableForSale: true,
					selectedOptions: [
						{ name: "Size", value: "Large" },
						{ name: "Color", value: "Blue" }
					],
					requiresShipping: true
				}
			];

			const result = getOptionValues(mockVariants, "Size");
			expect(result).toEqual(["Small", "Large"]);
		});

		it("should return empty array for non-existent option", () => {
			const mockVariants: ShopifyVariant[] = [];
			const result = getOptionValues(mockVariants, "Material");
			expect(result).toEqual([]);
		});
	});

	describe("findVariantByOptions", () => {
		it("should find variant by matching options", () => {
			const mockVariants: ShopifyVariant[] = [
				{
					id: "1",
					title: "Small / Red",
					price: { amount: "19.99", currencyCode: "USD" },
					availableForSale: true,
					selectedOptions: [
						{ name: "Size", value: "Small" },
						{ name: "Color", value: "Red" }
					],
					requiresShipping: true
				},
				{
					id: "2",
					title: "Large / Blue", 
					price: { amount: "24.99", currencyCode: "USD" },
					availableForSale: true,
					selectedOptions: [
						{ name: "Size", value: "Large" },
						{ name: "Color", value: "Blue" }
					],
					requiresShipping: true
				}
			];

			const targetOptions = [
				{ name: "Size", value: "Large" },
				{ name: "Color", value: "Blue" }
			];

			const result = findVariantByOptions(mockVariants, targetOptions);
			expect(result?.id).toBe("2");
		});

		it("should return undefined for non-matching options", () => {
			const mockVariants: ShopifyVariant[] = [
				{
					id: "1",
					title: "Small / Red",
					price: { amount: "19.99", currencyCode: "USD" },
					availableForSale: true,
					selectedOptions: [
						{ name: "Size", value: "Small" },
						{ name: "Color", value: "Red" }
					],
					requiresShipping: true
				}
			];

			const targetOptions = [
				{ name: "Size", value: "XL" },
				{ name: "Color", value: "Green" }
			];

			const result = findVariantByOptions(mockVariants, targetOptions);
			expect(result).toBeUndefined();
		});
	});

	describe("calculateDiscountPercentage", () => {
		it("should calculate discount percentage correctly", () => {
			const originalPrice = { amount: "100.00", currencyCode: "USD" };
			const salePrice = { amount: "75.00", currencyCode: "USD" };
			
			const result = calculateDiscountPercentage(originalPrice, salePrice);
			expect(result).toBe(25);
		});

		it("should return 0 for no discount", () => {
			const originalPrice = { amount: "50.00", currencyCode: "USD" };
			const salePrice = { amount: "50.00", currencyCode: "USD" };
			
			const result = calculateDiscountPercentage(originalPrice, salePrice);
			expect(result).toBe(0);
		});

		it("should handle edge case of sale price higher than original", () => {
			const originalPrice = { amount: "50.00", currencyCode: "USD" };
			const salePrice = { amount: "60.00", currencyCode: "USD" };
			
			const result = calculateDiscountPercentage(originalPrice, salePrice);
			expect(result).toBe(0);
		});

		it("should round to nearest integer", () => {
			const originalPrice = { amount: "100.00", currencyCode: "USD" };
			const salePrice = { amount: "66.67", currencyCode: "USD" };
			
			const result = calculateDiscountPercentage(originalPrice, salePrice);
			expect(result).toBe(33); // Should round 33.33 to 33
		});
	});

	describe("optimizeShopifyImageUrl", () => {
		it("should add width parameter to Shopify image URL", () => {
			const url = "https://cdn.shopify.com/s/files/1/image.jpg";
			const result = optimizeShopifyImageUrl(url, { width: 800 });
			
			expect(result).toBe("https://cdn.shopify.com/s/files/1/image_800x.jpg");
		});

		it("should add width and height parameters", () => {
			const url = "https://cdn.shopify.com/s/files/1/image.jpg";
			const result = optimizeShopifyImageUrl(url, { width: 800, height: 600 });
			
			expect(result).toBe("https://cdn.shopify.com/s/files/1/image_800x600.jpg");
		});

		it("should return original URL for non-Shopify images", () => {
			const url = "https://example.com/image.jpg";
			const result = optimizeShopifyImageUrl(url, { width: 800 });
			
			expect(result).toBe(url);
		});

		it("should handle quality parameter", () => {
			const url = "https://cdn.shopify.com/s/files/1/image.jpg";
			const result = optimizeShopifyImageUrl(url, { width: 800, quality: 80 });
			
			expect(result).toBe("https://cdn.shopify.com/s/files/1/image_800x.jpg");
		});
	});

	describe("formatShopifyPrice", () => {
		it("should format USD price correctly", () => {
			const money = { amount: "19.99", currencyCode: "USD" };
			const result = formatShopifyPrice(money);
			
			expect(result).toBe("$19.99");
		});

		it("should format EUR price correctly", () => {
			const money = { amount: "25.50", currencyCode: "EUR" };
			const result = formatShopifyPrice(money);
			
			expect(result).toBe("€25.50");
		});

		it("should handle whole numbers", () => {
			const money = { amount: "20.00", currencyCode: "USD" };
			const result = formatShopifyPrice(money);
			
			expect(result).toBe("$20.00");
		});

		it("should handle unsupported currency", () => {
			const money = { amount: "100.00", currencyCode: "JPY" };
			const result = formatShopifyPrice(money);
			
			expect(result).toBe("100.00 JPY");
		});
	});

	describe("centsToDisplay", () => {
		it("should convert cents to display format", () => {
			const result = centsToDisplay(1999);
			expect(result).toBe("19.99");
		});

		it("should handle whole dollars", () => {
			const result = centsToDisplay(2000);
			expect(result).toBe("20.00");
		});

		it("should handle zero", () => {
			const result = centsToDisplay(0);
			expect(result).toBe("0.00");
		});

		it("should handle single digits", () => {
			const result = centsToDisplay(5);
			expect(result).toBe("0.05");
		});

		it("should handle large amounts", () => {
			const result = centsToDisplay(123456);
			expect(result).toBe("1234.56");
		});
	});

	describe("transformProduct", () => {
		it("should transform complete product data", () => {
			const mockGraphQLProduct = {
				id: "gid://shopify/Product/123",
				title: "Test Product",
				handle: "test-product",
				description: "A test product",
				images: {
					edges: [
						{
							node: {
								id: "gid://shopify/ProductImage/456",
								url: "https://cdn.shopify.com/image.jpg",
								altText: "Product image",
								width: 800,
								height: 600
							}
						}
					]
				},
				variants: {
					edges: [
						{
							node: {
								id: "gid://shopify/ProductVariant/789",
								title: "Default Title",
								price: { amount: "29.99", currencyCode: "USD" },
								compareAtPrice: null,
								availableForSale: true,
								selectedOptions: [],
								requiresShipping: true
							}
						}
					]
				},
				priceRange: {
					minVariantPrice: { amount: "29.99", currencyCode: "USD" },
					maxVariantPrice: { amount: "29.99", currencyCode: "USD" }
				},
				tags: ["test", "sample"],
				productType: "Clothing",
				vendor: "Test Vendor",
				availableForSale: true,
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-02T00:00:00Z"
			};

			const result = transformProduct(mockGraphQLProduct);

			expect(result.id).toBe("gid://shopify/Product/123");
			expect(result.title).toBe("Test Product");
			expect(result.handle).toBe("test-product");
			expect(result.images).toHaveLength(1);
			expect(result.variants).toHaveLength(1);
			expect(result.priceRange.minVariantPrice.amount).toBe("29.99");
		});

		it("should handle product with no images", () => {
			const mockGraphQLProduct = {
				id: "gid://shopify/Product/123",
				title: "Test Product",
				handle: "test-product",
				description: "A test product",
				images: { edges: [] },
				variants: {
					edges: [
						{
							node: {
								id: "gid://shopify/ProductVariant/789",
								title: "Default Title",
								price: { amount: "29.99", currencyCode: "USD" },
								compareAtPrice: null,
								availableForSale: true,
								selectedOptions: [],
								requiresShipping: true
							}
						}
					]
				},
				priceRange: {
					minVariantPrice: { amount: "29.99", currencyCode: "USD" },
					maxVariantPrice: { amount: "29.99", currencyCode: "USD" }
				},
				tags: [],
				productType: "Clothing",
				vendor: "Test Vendor",
				availableForSale: true,
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-02T00:00:00Z"
			};

			const result = transformProduct(mockGraphQLProduct);
			expect(result.images).toHaveLength(0);
		});

		it("should handle product with multiple variants", () => {
			const mockGraphQLProduct = {
				id: "gid://shopify/Product/123",
				title: "Test Product",
				handle: "test-product",
				description: "A test product",
				images: { edges: [] },
				variants: {
					edges: [
						{
							node: {
								id: "gid://shopify/ProductVariant/789",
								title: "Small",
								price: { amount: "29.99", currencyCode: "USD" },
								compareAtPrice: { amount: "39.99", currencyCode: "USD" },
								availableForSale: true,
								selectedOptions: [{ name: "Size", value: "Small" }],
								requiresShipping: true
							}
						},
						{
							node: {
								id: "gid://shopify/ProductVariant/790",
								title: "Large",
								price: { amount: "34.99", currencyCode: "USD" },
								compareAtPrice: null,
								availableForSale: false,
								selectedOptions: [{ name: "Size", value: "Large" }],
								requiresShipping: true
							}
						}
					]
				},
				priceRange: {
					minVariantPrice: { amount: "29.99", currencyCode: "USD" },
					maxVariantPrice: { amount: "34.99", currencyCode: "USD" }
				},
				tags: ["sale"],
				productType: "Clothing",
				vendor: "Test Vendor",
				availableForSale: true,
				createdAt: "2023-01-01T00:00:00Z",
				updatedAt: "2023-01-02T00:00:00Z"
			};

			const result = transformProduct(mockGraphQLProduct);
			
			expect(result.variants).toHaveLength(2);
			expect(result.variants[0].compareAtPrice?.amount).toBe("39.99");
			expect(result.variants[1].availableForSale).toBe(false);
		});
	});
});
