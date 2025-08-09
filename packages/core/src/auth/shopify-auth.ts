import crypto from "crypto";
import type { NextRequest } from "next/server";

export interface ShopifySession {
	shop: string;
	accessToken: string;
	scope: string;
	expiresAt?: Date;
	onlineAccessInfo?: {
		associated_user: {
			id: number;
			first_name: string;
			last_name: string;
			email: string;
			account_owner: boolean;
		};
	};
}

export interface ShopifyAuthConfig {
	apiKey: string;
	apiSecret: string;
	scopes: string[];
	hostName: string;
}

export class ShopifyAuth {
	private config: ShopifyAuthConfig;

	constructor(config: ShopifyAuthConfig) {
		this.config = config;
	}

	generateAuthUrl(shop: string, state?: string): string {
		const params = new URLSearchParams({
			client_id: this.config.apiKey,
			scope: this.config.scopes.join(","),
			redirect_uri: `${this.config.hostName}/api/auth/shopify/callback`,
			state: state || this.generateState(),
			"grant_options[]": "per-user",
		});

		return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
	}

	async exchangeCodeForToken(
		shop: string,
		code: string,
	): Promise<ShopifySession> {
		const tokenUrl = `https://${shop}/admin/oauth/access_token`;

		const response = await fetch(tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				client_id: this.config.apiKey,
				client_secret: this.config.apiSecret,
				code,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to exchange code for token: ${error}`);
		}

		const data = await response.json();

		return {
			shop,
			accessToken: data.access_token,
			scope: data.scope,
			expiresAt: data.expires_in
				? new Date(Date.now() + data.expires_in * 1000)
				: undefined,
			onlineAccessInfo: data.associated_user
				? {
						associated_user: data.associated_user,
					}
				: undefined,
		};
	}

	generateState(): string {
		return crypto.randomBytes(16).toString("hex");
	}

	validateShop(shop: string): boolean {
		const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.myshopify\.com$/;
		return shopRegex.test(shop);
	}

	validateHmac(query: URLSearchParams, hmac: string): boolean {
		const params = new URLSearchParams(query);
		params.delete("hmac");
		params.delete("signature");

		const sortedParams = Array.from(params.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, value]) => `${key}=${value}`)
			.join("&");

		const computedHmac = crypto
			.createHmac("sha256", this.config.apiSecret)
			.update(sortedParams)
			.digest("hex");

		return crypto.timingSafeEqual(
			Buffer.from(hmac, "hex"),
			Buffer.from(computedHmac, "hex"),
		);
	}

	async verifyWebhook(body: string, signature: string): Promise<boolean> {
		const computedSignature = crypto
			.createHmac("sha256", this.config.apiSecret)
			.update(body, "utf8")
			.digest("base64");

		return crypto.timingSafeEqual(
			Buffer.from(signature, "base64"),
			Buffer.from(computedSignature, "base64"),
		);
	}

	extractShopFromRequest(request: NextRequest): string | null {
		// Try to extract shop from various sources
		const url = new URL(request.url);

		// From query parameter
		const shopParam = url.searchParams.get("shop");
		if (shopParam && this.validateShop(shopParam)) {
			return shopParam;
		}

		// From subdomain (if hosted on custom domain)
		const host = request.headers.get("host");
		if (host) {
			const subdomain = host.split(".")[0];
			const shopDomain = `${subdomain}.myshopify.com`;
			if (this.validateShop(shopDomain)) {
				return shopDomain;
			}
		}

		// From X-Shopify-Shop-Domain header (in embedded app context)
		const shopifyShopDomain = request.headers.get("x-shopify-shop-domain");
		if (shopifyShopDomain && this.validateShop(shopifyShopDomain)) {
			return shopifyShopDomain;
		}

		return null;
	}

	createSessionToken(session: ShopifySession): string {
		const payload = {
			shop: session.shop,
			accessToken: session.accessToken,
			scope: session.scope,
			expiresAt: session.expiresAt?.getTime(),
			iat: Math.floor(Date.now() / 1000),
		};

		// Simple JWT-like token for demo (in production, use a proper JWT library)
		const header = Buffer.from(
			JSON.stringify({ alg: "HS256", typ: "JWT" }),
		).toString("base64url");
		const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
		const signature = crypto
			.createHmac("sha256", this.config.apiSecret)
			.update(`${header}.${body}`)
			.digest("base64url");

		return `${header}.${body}.${signature}`;
	}

	verifySessionToken(token: string): ShopifySession | null {
		try {
			const [header, body, signature] = token.split(".");

			// Verify signature
			const expectedSignature = crypto
				.createHmac("sha256", this.config.apiSecret)
				.update(`${header}.${body}`)
				.digest("base64url");

			if (
				!crypto.timingSafeEqual(
					Buffer.from(signature),
					Buffer.from(expectedSignature),
				)
			) {
				return null;
			}

			const payload = JSON.parse(Buffer.from(body, "base64url").toString());

			// Check expiration
			if (payload.expiresAt && Date.now() > payload.expiresAt) {
				return null;
			}

			return {
				shop: payload.shop,
				accessToken: payload.accessToken,
				scope: payload.scope,
				expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
			};
		} catch {
			return null;
		}
	}
}

// Create singleton instance
let authInstance: ShopifyAuth | null = null;

export function getShopifyAuth(): ShopifyAuth {
	if (!authInstance) {
		const apiKey = process.env.SHOPIFY_API_KEY;
		const apiSecret = process.env.SHOPIFY_API_SECRET;
		const hostName = process.env.NEXT_PUBLIC_APP_URL;

		if (!apiKey || !apiSecret || !hostName) {
			throw new Error("Missing required Shopify auth environment variables");
		}

		authInstance = new ShopifyAuth({
			apiKey,
			apiSecret,
			scopes: [
				"read_products",
				"write_products",
				"read_themes",
				"write_themes",
				"read_customers",
				"read_orders",
			],
			hostName,
		});
	}

	return authInstance;
}
