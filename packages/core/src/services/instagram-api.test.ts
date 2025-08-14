/**
 * Tests for Instagram API Service
 * Covers authentication, data fetching, and error handling
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
	InstagramService,
	createInstagramService,
	validateInstagramToken,
	fetchInstagramMedia,
	transformInstagramPost,
	getInstagramUserInfo,
	refreshInstagramToken,
	handleInstagramError,
	parseInstagramWebhook,
	generateInstagramAuthUrl,
	extractInstagramPostId
} from "./instagram-api";

// Mock fetch globally
global.fetch = vi.fn();

describe("Instagram API Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("InstagramService Class", () => {
		it("should initialize with access token", () => {
			const service = new InstagramService("test_token");
			expect(service.accessToken).toBe("test_token");
		});

		it("should set correct API base URL", () => {
			const service = new InstagramService("test_token");
			expect(service.baseUrl).toBe("https://graph.instagram.com");
		});
	});

	describe("createInstagramService", () => {
		it("should create service with valid token", () => {
			const service = createInstagramService("valid_token_123");
			expect(service).toBeInstanceOf(InstagramService);
			expect(service.accessToken).toBe("valid_token_123");
		});

		it("should throw error with invalid token", () => {
			expect(() => createInstagramService("")).toThrow("Invalid Instagram access token");
			expect(() => createInstagramService(null as any)).toThrow("Invalid Instagram access token");
		});
	});

	describe("validateInstagramToken", () => {
		it("should validate correct token format", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({
					id: "123456789",
					username: "testuser"
				})
			};
			(global.fetch as any).mockResolvedValueOnce(mockResponse);

			const isValid = await validateInstagramToken("valid_token");
			expect(isValid).toBe(true);
		});

		it("should reject invalid token", async () => {
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

			const isValid = await validateInstagramToken("invalid_token");
			expect(isValid).toBe(false);
		});

		it("should handle network errors", async () => {
			(global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

			const isValid = await validateInstagramToken("token");
			expect(isValid).toBe(false);
		});
	});

	describe("fetchInstagramMedia", () => {
		it("should fetch user media successfully", async () => {
			const mockMediaResponse = {
				ok: true,
				json: () => Promise.resolve({
					data: [
						{
							id: "17841400894568159",
							media_type: "IMAGE",
							media_url: "https://scontent.cdninstagram.com/image.jpg",
							caption: "Test caption #hashtag",
							timestamp: "2023-01-01T12:00:00+0000",
							permalink: "https://www.instagram.com/p/ABC123/"
						},
						{
							id: "17841400894568160",
							media_type: "VIDEO",
							media_url: "https://scontent.cdninstagram.com/video.mp4",
							thumbnail_url: "https://scontent.cdninstagram.com/thumb.jpg",
							caption: "Video post",
							timestamp: "2023-01-01T13:00:00+0000",
							permalink: "https://www.instagram.com/p/DEF456/"
						}
					],
					paging: {
						next: "https://graph.instagram.com/next_page"
					}
				})
			};
			(global.fetch as any).mockResolvedValueOnce(mockMediaResponse);

			const result = await fetchInstagramMedia("test_token", {
				limit: 10,
				fields: ["id", "media_type", "media_url", "caption", "timestamp"]
			});

			expect(result.data).toHaveLength(2);
			expect(result.data[0].media_type).toBe("IMAGE");
			expect(result.data[1].media_type).toBe("VIDEO");
			expect(result.paging?.next).toBeDefined();
		});

		it("should handle empty media response", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({
					data: [],
					paging: {}
				})
			};
			(global.fetch as any).mockResolvedValueOnce(mockResponse);

			const result = await fetchInstagramMedia("test_token");
			expect(result.data).toHaveLength(0);
		});

		it("should handle API errors", async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				json: () => Promise.resolve({
					error: {
						message: "Invalid request",
						code: 100
					}
				})
			};
			(global.fetch as any).mockResolvedValueOnce(mockResponse);

			await expect(fetchInstagramMedia("invalid_token")).rejects.toThrow("Instagram API error: Invalid request");
		});
	});

	describe("transformInstagramPost", () => {
		it("should transform Instagram image post", () => {
			const instagramPost = {
				id: "17841400894568159",
				media_type: "IMAGE",
				media_url: "https://scontent.cdninstagram.com/image.jpg",
				caption: "Beautiful sunset! #nature #photography #amazing",
				timestamp: "2023-01-01T12:00:00+0000",
				permalink: "https://www.instagram.com/p/ABC123/",
				like_count: 150,
				comments_count: 25
			};

			const result = transformInstagramPost(instagramPost);

			expect(result.id).toBe("17841400894568159");
			expect(result.platform).toBe("instagram");
			expect(result.mediaUrls).toEqual(["https://scontent.cdninstagram.com/image.jpg"]);
			expect(result.caption).toBe("Beautiful sunset! #nature #photography #amazing");
			expect(result.hashtags).toEqual(["nature", "photography", "amazing"]);
			expect(result.engagement.likes).toBe(150);
			expect(result.engagement.comments).toBe(25);
		});

		it("should transform Instagram video post", () => {
			const instagramPost = {
				id: "17841400894568160",
				media_type: "VIDEO",
				media_url: "https://scontent.cdninstagram.com/video.mp4",
				thumbnail_url: "https://scontent.cdninstagram.com/thumb.jpg",
				caption: "Check out this amazing video!",
				timestamp: "2023-01-01T13:00:00+0000",
				permalink: "https://www.instagram.com/p/DEF456/"
			};

			const result = transformInstagramPost(instagramPost);

			expect(result.mediaUrls).toEqual(["https://scontent.cdninstagram.com/video.mp4"]);
			expect(result.mediaMetadata.thumbnail).toBe("https://scontent.cdninstagram.com/thumb.jpg");
			expect(result.mediaMetadata.format).toBe("video");
		});

		it("should handle carousel posts", () => {
			const instagramPost = {
				id: "17841400894568161",
				media_type: "CAROUSEL_ALBUM",
				children: {
					data: [
						{
							id: "child1",
							media_type: "IMAGE",
							media_url: "https://scontent.cdninstagram.com/image1.jpg"
						},
						{
							id: "child2", 
							media_type: "VIDEO",
							media_url: "https://scontent.cdninstagram.com/video1.mp4"
						}
					]
				},
				caption: "Multiple images and videos",
				timestamp: "2023-01-01T14:00:00+0000",
				permalink: "https://www.instagram.com/p/GHI789/"
			};

			const result = transformInstagramPost(instagramPost);

			expect(result.mediaUrls).toHaveLength(2);
			expect(result.mediaUrls[0]).toBe("https://scontent.cdninstagram.com/image1.jpg");
			expect(result.mediaUrls[1]).toBe("https://scontent.cdninstagram.com/video1.mp4");
		});

		it("should extract hashtags from caption", () => {
			const instagramPost = {
				id: "test",
				media_type: "IMAGE",
				media_url: "https://example.com/image.jpg",
				caption: "Love this #beautiful #sunset at the #beach! #nofilter #photography",
				timestamp: "2023-01-01T12:00:00+0000",
				permalink: "https://www.instagram.com/p/TEST/"
			};

			const result = transformInstagramPost(instagramPost);
			expect(result.hashtags).toEqual(["beautiful", "sunset", "beach", "nofilter", "photography"]);
		});

		it("should extract mentions from caption", () => {
			const instagramPost = {
				id: "test",
				media_type: "IMAGE",  
				media_url: "https://example.com/image.jpg",
				caption: "Great collaboration with @partner and @photographer for this shoot!",
				timestamp: "2023-01-01T12:00:00+0000",
				permalink: "https://www.instagram.com/p/TEST/"
			};

			const result = transformInstagramPost(instagramPost);
			expect(result.mentions).toEqual(["partner", "photographer"]);
		});
	});

	describe("getInstagramUserInfo", () => {
		it("should fetch user information", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({
					id: "123456789",
					username: "testuser",
					account_type: "BUSINESS",
					media_count: 150,
					followers_count: 1000,
					follows_count: 250
				})
			};
			(global.fetch as any).mockResolvedValueOnce(mockResponse);

			const userInfo = await getInstagramUserInfo("test_token");

			expect(userInfo.id).toBe("123456789");
			expect(userInfo.username).toBe("testuser");
			expect(userInfo.account_type).toBe("BUSINESS");
			expect(userInfo.followers_count).toBe(1000);
		});

		it("should handle user info API errors", async () => {
			const mockResponse = {
				ok: false,
				status: 403,
				json: () => Promise.resolve({
					error: {
						message: "Insufficient permissions"
					}
				})
			};
			(global.fetch as any).mockResolvedValueOnce(mockResponse);

			await expect(getInstagramUserInfo("token")).rejects.toThrow("Instagram API error: Insufficient permissions");
		});
	});

	describe("refreshInstagramToken", () => {
		it("should refresh long-lived token", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve({
					access_token: "new_long_lived_token",
					token_type: "bearer",
					expires_in: 5183944 // ~60 days
				})
			};
			(global.fetch as any).mockResolvedValueOnce(mockResponse);

			const result = await refreshInstagramToken("current_token");

			expect(result.access_token).toBe("new_long_lived_token");
			expect(result.expires_in).toBe(5183944);
		});

		it("should handle refresh errors", async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				json: () => Promise.resolve({
					error: {
						message: "Invalid token"
					}
				})
			};
			(global.fetch as any).mockResolvedValueOnce(mockResponse);

			await expect(refreshInstagramToken("invalid_token")).rejects.toThrow("Instagram API error: Invalid token");
		});
	});

	describe("handleInstagramError", () => {
		it("should handle rate limit errors", () => {
			const error = {
				code: 4,
				message: "Application request limit reached",
				type: "OAuthException"
			};

			const result = handleInstagramError(error);
			expect(result.isRetryable).toBe(true);
			expect(result.retryAfter).toBeGreaterThan(0);
			expect(result.category).toBe("rate_limit");
		});

		it("should handle authentication errors", () => {
			const error = {
				code: 190,
				message: "Invalid OAuth access token",
				type: "OAuthException"
			};

			const result = handleInstagramError(error);
			expect(result.isRetryable).toBe(false);
			expect(result.category).toBe("authentication");
		});

		it("should handle permission errors", () => {
			const error = {
				code: 10,
				message: "Application does not have permission for this action",
				type: "OAuthException"
			};

			const result = handleInstagramError(error);
			expect(result.isRetryable).toBe(false);
			expect(result.category).toBe("permissions");
		});

		it("should handle unknown errors", () => {
			const error = {
				code: 999,
				message: "Unknown error",
				type: "UnknownException"
			};

			const result = handleInstagramError(error);
			expect(result.category).toBe("unknown");
			expect(result.isRetryable).toBe(false);
		});
	});

	describe("generateInstagramAuthUrl", () => {
		it("should generate correct authorization URL", () => {
			const authUrl = generateInstagramAuthUrl({
				clientId: "test_client_id",
				redirectUri: "https://app.example.com/callback",
				scopes: ["user_profile", "user_media"],
				state: "random_state_123"
			});

			expect(authUrl).toContain("https://api.instagram.com/oauth/authorize");
			expect(authUrl).toContain("client_id=test_client_id");
			expect(authUrl).toContain("redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback");
			expect(authUrl).toContain("scope=user_profile%2Cuser_media");
			expect(authUrl).toContain("state=random_state_123");
			expect(authUrl).toContain("response_type=code");
		});

		it("should handle basic scopes", () => {
			const authUrl = generateInstagramAuthUrl({
				clientId: "test_client",
				redirectUri: "https://app.com/callback"
			});

			expect(authUrl).toContain("scope=user_profile%2Cuser_media");
		});
	});

	describe("extractInstagramPostId", () => {
		it("should extract post ID from Instagram URL", () => {
			const url = "https://www.instagram.com/p/ABC123def456/";
			const postId = extractInstagramPostId(url);
			expect(postId).toBe("ABC123def456");
		});

		it("should handle URLs with query parameters", () => {
			const url = "https://www.instagram.com/p/XYZ789/?utm_source=ig_web_copy_link";
			const postId = extractInstagramPostId(url);
			expect(postId).toBe("XYZ789");
		});

		it("should handle mobile URLs", () => {
			const url = "https://instagram.com/p/GHI456/";
			const postId = extractInstagramPostId(url);
			expect(postId).toBe("GHI456");
		});

		it("should return null for invalid URLs", () => {
			expect(extractInstagramPostId("https://example.com")).toBeNull();
			expect(extractInstagramPostId("not-a-url")).toBeNull();
			expect(extractInstagramPostId("")).toBeNull();
		});

		it("should handle reels URLs", () => {
			const url = "https://www.instagram.com/reel/ABC123def456/";
			const postId = extractInstagramPostId(url);
			expect(postId).toBe("ABC123def456");
		});
	});

	describe("parseInstagramWebhook", () => {
		it("should parse valid webhook payload", () => {
			const payload = {
				object: "instagram",
				entry: [
					{
						id: "123456789",
						time: 1642678800,
						changes: [
							{
								field: "media",
								value: {
									media_id: "17841400894568159"
								}
							}
						]
					}
				]
			};

			const result = parseInstagramWebhook(payload);
			expect(result.isValid).toBe(true);
			expect(result.entries).toHaveLength(1);
			expect(result.entries[0].userId).toBe("123456789");
			expect(result.entries[0].changes[0].field).toBe("media");
		});

		it("should reject invalid webhook payload", () => {
			const invalidPayload = {
				object: "facebook", // Wrong object type
				entry: []
			};

			const result = parseInstagramWebhook(invalidPayload);
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("Invalid webhook object type");
		});

		it("should handle empty entries", () => {
			const payload = {
				object: "instagram",
				entry: []
			};

			const result = parseInstagramWebhook(payload);
			expect(result.isValid).toBe(true);
			expect(result.entries).toHaveLength(0);
		});
	});

	describe("Error Scenarios", () => {
		it("should handle network timeouts", async () => {
			(global.fetch as any).mockImplementationOnce(() => 
				Promise.reject(new Error("Request timeout"))
			);

			await expect(fetchInstagramMedia("token")).rejects.toThrow("Request timeout");
		});

		it("should handle malformed API responses", async () => {
			const mockResponse = {
				ok: true,
				json: () => Promise.reject(new Error("Invalid JSON"))
			};
			(global.fetch as any).mockResolvedValueOnce(mockResponse);

			await expect(fetchInstagramMedia("token")).rejects.toThrow("Invalid JSON");
		});

		it("should handle missing required fields", () => {
			const incompletePost = {
				id: "test",
				// missing media_type, media_url, etc.
			};

			expect(() => transformInstagramPost(incompletePost as any))
				.toThrow("Invalid Instagram post data");
		});
	});
});
