import type { SiteConfig } from "./types";

// R2 Configuration
interface R2Config {
	endpoint: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucketName: string;
	region?: string;
}

// S3-compatible client for Cloudflare R2
class R2Client {
	private config: R2Config;

	constructor(config: R2Config) {
		this.config = config;
	}

	private async signRequest(
		method: string,
		path: string,
		headers: Record<string, string> = {},
		body?: string,
	) {
		const url = new URL(path, this.config.endpoint);
		const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
		const dateStamp = timestamp.slice(0, 8);

		// AWS Signature Version 4 signing process
		const algorithm = "AWS4-HMAC-SHA256";
		const service = "s3";
		const region = this.config.region || "auto";
		const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

		// Create canonical request
		const canonicalHeaders = Object.entries({
			host: url.hostname,
			"x-amz-content-sha256": await this.sha256(body || ""),
			"x-amz-date": timestamp,
			...headers,
		})
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, value]) => `${key.toLowerCase()}:${value}`)
			.join("\n");

		const signedHeaders = Object.keys({
			host: url.hostname,
			"x-amz-content-sha256": await this.sha256(body || ""),
			"x-amz-date": timestamp,
			...headers,
		})
			.sort()
			.map((key) => key.toLowerCase())
			.join(";");

		const canonicalRequest = [
			method,
			url.pathname,
			url.search.slice(1),
			canonicalHeaders,
			"",
			signedHeaders,
			await this.sha256(body || ""),
		].join("\n");

		// Create string to sign
		const stringToSign = [
			algorithm,
			timestamp,
			credentialScope,
			await this.sha256(canonicalRequest),
		].join("\n");

		// Calculate signature
		const signature = await this.calculateSignature(
			this.config.secretAccessKey,
			dateStamp,
			region,
			service,
			stringToSign,
		);

		// Create authorization header
		const authorizationHeader = `${algorithm} Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

		return {
			Authorization: authorizationHeader,
			"x-amz-content-sha256": await this.sha256(body || ""),
			"x-amz-date": timestamp,
			...headers,
		};
	}

	private async sha256(data: string): Promise<string> {
		const encoder = new TextEncoder();
		const hash = await crypto.subtle.digest("SHA-256", encoder.encode(data));
		return Array.from(new Uint8Array(hash))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}

	private async calculateSignature(
		secretKey: string,
		dateStamp: string,
		region: string,
		service: string,
		stringToSign: string,
	): Promise<string> {
		const encoder = new TextEncoder();

		const kDate = await crypto.subtle.importKey(
			"raw",
			encoder.encode(`AWS4${secretKey}`),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);

		const kDateSig = await crypto.subtle.sign(
			"HMAC",
			kDate,
			encoder.encode(dateStamp),
		);

		const kRegion = await crypto.subtle.importKey(
			"raw",
			kDateSig,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);

		const kRegionSig = await crypto.subtle.sign(
			"HMAC",
			kRegion,
			encoder.encode(region),
		);

		const kService = await crypto.subtle.importKey(
			"raw",
			kRegionSig,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);

		const kServiceSig = await crypto.subtle.sign(
			"HMAC",
			kService,
			encoder.encode(service),
		);

		const kSigning = await crypto.subtle.importKey(
			"raw",
			kServiceSig,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);

		const signature = await crypto.subtle.sign(
			"HMAC",
			kSigning,
			encoder.encode(stringToSign),
		);

		return Array.from(new Uint8Array(signature))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}

	async putObject(key: string, body: string, contentType = "application/json") {
		const headers = await this.signRequest(
			"PUT",
			`/${this.config.bucketName}/${key}`,
			{
				"Content-Type": contentType,
			},
			body,
		);

		const response = await fetch(
			`${this.config.endpoint}/${this.config.bucketName}/${key}`,
			{
				method: "PUT",
				headers,
				body,
			},
		);

		if (!response.ok) {
			throw new Error(
				`Failed to upload to R2: ${response.status} ${response.statusText}`,
			);
		}

		return response;
	}

	async getObject(key: string): Promise<string> {
		const headers = await this.signRequest(
			"GET",
			`/${this.config.bucketName}/${key}`,
		);

		const response = await fetch(
			`${this.config.endpoint}/${this.config.bucketName}/${key}`,
			{
				method: "GET",
				headers,
			},
		);

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(`Object not found: ${key}`);
			}
			throw new Error(
				`Failed to fetch from R2: ${response.status} ${response.statusText}`,
			);
		}

		return response.text();
	}

	async deleteObject(key: string) {
		const headers = await this.signRequest(
			"DELETE",
			`/${this.config.bucketName}/${key}`,
		);

		const response = await fetch(
			`${this.config.endpoint}/${this.config.bucketName}/${key}`,
			{
				method: "DELETE",
				headers,
			},
		);

		if (!response.ok && response.status !== 404) {
			throw new Error(
				`Failed to delete from R2: ${response.status} ${response.statusText}`,
			);
		}

		return response;
	}

	async generatePresignedUrl(key: string, expiresIn = 3600): Promise<string> {
		const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
		const dateStamp = timestamp.slice(0, 8);

		const url = new URL(
			`/${this.config.bucketName}/${key}`,
			this.config.endpoint,
		);
		url.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
		url.searchParams.set(
			"X-Amz-Credential",
			`${this.config.accessKeyId}/${dateStamp}/auto/s3/aws4_request`,
		);
		url.searchParams.set("X-Amz-Date", timestamp);
		url.searchParams.set("X-Amz-Expires", expiresIn.toString());
		url.searchParams.set("X-Amz-SignedHeaders", "host");

		const canonicalRequest = [
			"GET",
			url.pathname,
			url.search.slice(1),
			`host:${url.hostname}`,
			"",
			"host",
			"UNSIGNED-PAYLOAD",
		].join("\n");

		const stringToSign = [
			"AWS4-HMAC-SHA256",
			timestamp,
			`${dateStamp}/auto/s3/aws4_request`,
			await this.sha256(canonicalRequest),
		].join("\n");

		const signature = await this.calculateSignature(
			this.config.secretAccessKey,
			dateStamp,
			"auto",
			"s3",
			stringToSign,
		);

		url.searchParams.set("X-Amz-Signature", signature);
		return url.toString();
	}
}

// R2 service for site configurations
export class R2ConfigService {
	private client: R2Client;

	constructor() {
		// Validate environment variables
		const endpoint = process.env.R2_ENDPOINT;
		const accessKeyId = process.env.R2_ACCESS_KEY;
		const secretAccessKey = process.env.R2_SECRET;
		const bucketName = process.env.R2_BUCKET_NAME;

		if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
			throw new Error(
				"Missing required R2 environment variables. Required: R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET, R2_BUCKET_NAME",
			);
		}

		this.client = new R2Client({
			endpoint,
			accessKeyId,
			secretAccessKey,
			bucketName,
		});
	}

	private getConfigKey(configId: string, version?: string): string {
		if (version) {
			return `configs/${configId}/versions/${version}.json`;
		}
		return `configs/${configId}/current.json`;
	}

	async saveConfig(
		configId: string,
		config: SiteConfig,
		version?: string,
	): Promise<void> {
		const key = this.getConfigKey(configId, version);
		const body = JSON.stringify(config, null, 2);

		await this.client.putObject(key, body, "application/json");
	}

	async getConfig(configId: string, version?: string): Promise<SiteConfig> {
		const key = this.getConfigKey(configId, version);

		try {
			const body = await this.client.getObject(key);
			return JSON.parse(body) as SiteConfig;
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("Object not found")
			) {
				throw new Error(`Configuration not found: ${configId}`);
			}
			throw error;
		}
	}

	async deleteConfig(configId: string): Promise<void> {
		// Delete current config
		await this.client.deleteObject(this.getConfigKey(configId));

		// TODO: Delete all versions (would require listing objects first)
	}

	async generateUploadUrl(
		shopId: string,
		filename: string,
		_contentType: string,
		expiresIn = 3600,
	): Promise<{ url: string; key: string }> {
		const key = `uploads/${shopId}/${Date.now()}-${filename}`;
		const url = await this.client.generatePresignedUrl(key, expiresIn);

		return { url, key };
	}

	async deleteObject(key: string): Promise<void> {
		await this.client.deleteObject(key);
	}

	async getObject(key: string): Promise<string> {
		return await this.client.getObject(key);
	}

	async listObjects(_prefix?: string): Promise<any[]> {
		// For now, return an empty array as R2 list objects would require
		// implementing the S3 ListObjectsV2 API call
		// This is a placeholder implementation
		console.warn("listObjects not implemented - returning empty array");
		return [];
	}

	async putObject(
		key: string,
		body: string | ArrayBuffer | Buffer,
		options: { contentType?: string } = {},
	): Promise<Response> {
		const contentType = options.contentType || "application/octet-stream";
		let bodyString: string;

		if (typeof body === "string") {
			bodyString = body;
		} else if (body instanceof Buffer) {
			bodyString = body.toString("base64");
		} else {
			bodyString = new TextDecoder().decode(body);
		}

		return await this.client.putObject(key, bodyString, contentType);
	}

	getObjectUrl(key: string): string {
		return this.getPublicUrl(key);
	}

	getPublicUrl(key: string): string {
		return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${key}`;
	}
}

// Global R2 service instance
// Create service instance lazily to avoid build-time errors
let _r2ServiceInstance: R2ConfigService | null = null;

export function getR2Service(): R2ConfigService | null {
	// Check if R2 environment variables are available
	const endpoint = process.env.R2_ENDPOINT;
	const accessKeyId = process.env.R2_ACCESS_KEY;
	const secretAccessKey = process.env.R2_SECRET;
	const bucketName = process.env.R2_BUCKET_NAME;

	if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
		const missing = [];
		if (!endpoint) missing.push('R2_ENDPOINT');
		if (!accessKeyId) missing.push('R2_ACCESS_KEY');
		if (!secretAccessKey) missing.push('R2_SECRET');
		if (!bucketName) missing.push('R2_BUCKET_NAME');
		
		console.error(
			`[R2] Missing required environment variables: ${missing.join(', ')}`,
		);
		console.error(
			"[R2] Please configure these in your .env.local file for R2 storage to work.",
		);
		return null;
	}

	if (!_r2ServiceInstance) {
		try {
			_r2ServiceInstance = new R2ConfigService();
		} catch (error) {
			console.error("Failed to initialize R2 service:", error);
			return null;
		}
	}
	return _r2ServiceInstance;
}

// DEPRECATED: Use getR2Service() instead
// This proxy is maintained for backward compatibility but should not be used in new code
export const r2Service = new Proxy({} as R2ConfigService, {
	get(_target, prop) {
		const service = getR2Service();
		if (!service) {
			throw new Error(
				"R2 service not available. Check R2 environment variables.",
			);
		}
		return service[prop as keyof R2ConfigService];
	},
});

// Cache utilities for edge functions
export class EdgeCache {
	private static instance: EdgeCache;
	private cache = new Map<
		string,
		{ data: unknown; expires: number; tags: string[] }
	>();

	static getInstance(): EdgeCache {
		if (!EdgeCache.instance) {
			EdgeCache.instance = new EdgeCache();
		}
		return EdgeCache.instance;
	}

	set<T>(key: string, data: T, ttl: number, tags: string[] = []): void {
		this.cache.set(key, {
			data,
			expires: Date.now() + ttl * 1000,
			tags,
		});
	}

	get<T>(key: string): T | null {
		const item = this.cache.get(key);

		if (!item) return null;

		if (Date.now() > item.expires) {
			this.cache.delete(key);
			return null;
		}

		return item.data as T;
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * Invalidate all cache entries with specific tags
	 */
	invalidateByTags(tags: string[]): number {
		let invalidated = 0;
		for (const [key, item] of this.cache.entries()) {
			if (item.tags.some((tag) => tags.includes(tag))) {
				this.cache.delete(key);
				invalidated++;
			}
		}
		return invalidated;
	}

	/**
	 * Invalidate all cache entries matching a pattern
	 */
	invalidateByPattern(pattern: RegExp): number {
		let invalidated = 0;
		for (const [key] of this.cache.entries()) {
			if (pattern.test(key)) {
				this.cache.delete(key);
				invalidated++;
			}
		}
		return invalidated;
	}

	/**
	 * Get cache statistics
	 */
	getStats() {
		const now = Date.now();
		let expired = 0;
		let valid = 0;

		for (const [_key, item] of this.cache.entries()) {
			if (now > item.expires) {
				expired++;
			} else {
				valid++;
			}
		}

		return {
			total: this.cache.size,
			valid,
			expired,
			hitRate: valid / (valid + expired) || 0,
		};
	}

	clear(): void {
		this.cache.clear();
	}

	/**
	 * Clean up expired entries
	 */
	cleanup(): number {
		const now = Date.now();
		let removed = 0;

		for (const [key, item] of this.cache.entries()) {
			if (now > item.expires) {
				this.cache.delete(key);
				removed++;
			}
		}

		return removed;
	}
}

export const edgeCache = EdgeCache.getInstance();
