/**
 * Tests for Instagram API Service
 * Covers authentication, data fetching, and error handling
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
	InstagramBasicDisplayAPI,
	createInstagramAPI,
	isValidInstagramUrl,
	extractInstagramPostId,
	type InstagramAPIConfig,
	type InstagramMedia,
	type InstagramUser
} from "./instagram-api";

// Mock fetch globally
global.fetch = vi.fn();

describe("Instagram API Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("InstagramBasicDisplayAPI Class", () => {
		const config: InstagramAPIConfig = {
			clientId: "test_client_id",
			clientSecret: "test_client_secret",
			redirectUri: "http://localhost:3000/auth/instagram",
			accessToken: "test_token"
		};

		it("should initialize with configuration", () => {
			const api = new InstagramBasicDisplayAPI(config);
			expect(api).toBeInstanceOf(InstagramBasicDisplayAPI);
		});

		it("should generate authorization URL", () => {
			const api = new InstagramBasicDisplayAPI(config);
			const authUrl = api.getAuthorizationUrl();
			
			expect(authUrl).toContain("https://api.instagram.com/oauth/authorize");
			expect(authUrl).toContain(config.clientId);
			expect(authUrl).toContain(encodeURIComponent(config.redirectUri));
		});
	});

	describe("createInstagramAPI", () => {
		it("should create API instance with valid config", () => {
			const config: InstagramAPIConfig = {
				clientId: "valid_client_id",
				clientSecret: "valid_secret",
				redirectUri: "http://localhost:3000/auth"
			};
			const api = createInstagramAPI(config);
			expect(api).toBeInstanceOf(InstagramBasicDisplayAPI);
		});
	});

	describe("getUserProfile", () => {
		it("should fetch user profile successfully", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({
					id: "123456789",
					username: "testuser",
					media_count: 50
				})
			};
			(global.fetch as any).mockResolvedValueOnce(mockResponse);

			const config: InstagramAPIConfig = {
				clientId: "test_client_id",
				clientSecret: "test_client_secret",
				redirectUri: "http://localhost:3000/auth"
			};
			const api = new InstagramBasicDisplayAPI(config);
			const profile = await api.getUserProfile("valid_token");
			
			expect(profile.id).toBe("123456789");
			expect(profile.username).toBe("testuser");
		});

		it("should handle API errors gracefully", async () => {
			const mockResponse = {
				ok: false,
				status: 401,
				json: () => Promise.resolve({
					error: {
						message: "Invalid OAuth access token"
					}
				})
			};
			(global.fetch as any).mockResolvedValueOnce(mockResponse);

			const config: InstagramAPIConfig = {
				clientId: "test_client_id",
				clientSecret: "test_client_secret",
				redirectUri: "http://localhost:3000/auth"
			};
			const api = new InstagramBasicDisplayAPI(config);
			
			await expect(api.getUserProfile("invalid_token"))
				.rejects.toThrow("Invalid OAuth access token");
		});
	});

	describe("Utility Functions", () => {
		describe("isValidInstagramUrl", () => {
			it("should validate Instagram post URLs", () => {
				const validUrls = [
					"https://www.instagram.com/p/ABC123/",
					"https://instagram.com/p/XYZ789/",
					"http://www.instagram.com/p/DEF456/"
				];

				validUrls.forEach(url => {
					expect(isValidInstagramUrl(url)).toBe(true);
				});
			});

			it("should reject invalid URLs", () => {
				const invalidUrls = [
					"https://facebook.com/post/123",
					"not-a-url",
					"https://instagram.com/user/",
					""
				];

				invalidUrls.forEach(url => {
					expect(isValidInstagramUrl(url)).toBe(false);
				});
			});
		});

		describe("extractInstagramPostId", () => {
			it("should extract post ID from Instagram URLs", () => {
				const testCases = [
					{
						url: "https://www.instagram.com/p/ABC123/",
						expected: "ABC123"
					},
					{
						url: "https://instagram.com/p/XYZ789/?utm_source=ig_share",
						expected: "XYZ789"
					}
				];

				testCases.forEach(({ url, expected }) => {
					expect(extractInstagramPostId(url)).toBe(expected);
				});
			});

			it("should return null for invalid URLs", () => {
				expect(extractInstagramPostId("not-an-instagram-url")).toBeNull();
				expect(extractInstagramPostId("https://facebook.com/post/123")).toBeNull();
			});
		});
	});
});
