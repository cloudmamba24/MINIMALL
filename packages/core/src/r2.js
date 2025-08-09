// S3-compatible client for Cloudflare R2
class R2Client {
    config;
    constructor(config) {
        this.config = config;
    }
    async signRequest(method, path, headers = {}, body) {
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
        const signature = await this.calculateSignature(this.config.secretAccessKey, dateStamp, region, service, stringToSign);
        // Create authorization header
        const authorizationHeader = `${algorithm} Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
        return {
            Authorization: authorizationHeader,
            "x-amz-content-sha256": await this.sha256(body || ""),
            "x-amz-date": timestamp,
            ...headers,
        };
    }
    async sha256(data) {
        const encoder = new TextEncoder();
        const hash = await crypto.subtle.digest("SHA-256", encoder.encode(data));
        return Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }
    async calculateSignature(secretKey, dateStamp, region, service, stringToSign) {
        const encoder = new TextEncoder();
        const kDate = await crypto.subtle.importKey("raw", encoder.encode(`AWS4${secretKey}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const kDateSig = await crypto.subtle.sign("HMAC", kDate, encoder.encode(dateStamp));
        const kRegion = await crypto.subtle.importKey("raw", kDateSig, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const kRegionSig = await crypto.subtle.sign("HMAC", kRegion, encoder.encode(region));
        const kService = await crypto.subtle.importKey("raw", kRegionSig, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const kServiceSig = await crypto.subtle.sign("HMAC", kService, encoder.encode(service));
        const kSigning = await crypto.subtle.importKey("raw", kServiceSig, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const signature = await crypto.subtle.sign("HMAC", kSigning, encoder.encode(stringToSign));
        return Array.from(new Uint8Array(signature))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }
    async putObject(key, body, contentType = "application/json") {
        const headers = await this.signRequest("PUT", `/${this.config.bucketName}/${key}`, {
            "Content-Type": contentType,
        }, body);
        const response = await fetch(`${this.config.endpoint}/${this.config.bucketName}/${key}`, {
            method: "PUT",
            headers,
            body,
        });
        if (!response.ok) {
            throw new Error(`Failed to upload to R2: ${response.status} ${response.statusText}`);
        }
        return response;
    }
    async getObject(key) {
        const headers = await this.signRequest("GET", `/${this.config.bucketName}/${key}`);
        const response = await fetch(`${this.config.endpoint}/${this.config.bucketName}/${key}`, {
            method: "GET",
            headers,
        });
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Object not found: ${key}`);
            }
            throw new Error(`Failed to fetch from R2: ${response.status} ${response.statusText}`);
        }
        return response.text();
    }
    async deleteObject(key) {
        const headers = await this.signRequest("DELETE", `/${this.config.bucketName}/${key}`);
        const response = await fetch(`${this.config.endpoint}/${this.config.bucketName}/${key}`, {
            method: "DELETE",
            headers,
        });
        if (!response.ok && response.status !== 404) {
            throw new Error(`Failed to delete from R2: ${response.status} ${response.statusText}`);
        }
        return response;
    }
    async generatePresignedUrl(key, expiresIn = 3600) {
        const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
        const dateStamp = timestamp.slice(0, 8);
        const url = new URL(`/${this.config.bucketName}/${key}`, this.config.endpoint);
        url.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
        url.searchParams.set("X-Amz-Credential", `${this.config.accessKeyId}/${dateStamp}/auto/s3/aws4_request`);
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
        const signature = await this.calculateSignature(this.config.secretAccessKey, dateStamp, "auto", "s3", stringToSign);
        url.searchParams.set("X-Amz-Signature", signature);
        return url.toString();
    }
}
// R2 service for site configurations
export class R2ConfigService {
    client;
    constructor() {
        // Validate environment variables
        const endpoint = process.env.R2_ENDPOINT;
        const accessKeyId = process.env.R2_ACCESS_KEY;
        const secretAccessKey = process.env.R2_SECRET;
        const bucketName = process.env.R2_BUCKET_NAME;
        if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
            throw new Error("Missing required R2 environment variables. Required: R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET, R2_BUCKET_NAME");
        }
        this.client = new R2Client({
            endpoint,
            accessKeyId,
            secretAccessKey,
            bucketName,
        });
    }
    getConfigKey(configId, version) {
        if (version) {
            return `configs/${configId}/versions/${version}.json`;
        }
        return `configs/${configId}/current.json`;
    }
    async saveConfig(configId, config, version) {
        const key = this.getConfigKey(configId, version);
        const body = JSON.stringify(config, null, 2);
        await this.client.putObject(key, body, "application/json");
    }
    async getConfig(configId, version) {
        const key = this.getConfigKey(configId, version);
        try {
            const body = await this.client.getObject(key);
            return JSON.parse(body);
        }
        catch (error) {
            if (error instanceof Error &&
                error.message.includes("Object not found")) {
                throw new Error(`Configuration not found: ${configId}`);
            }
            throw error;
        }
    }
    async deleteConfig(configId) {
        // Delete current config
        await this.client.deleteObject(this.getConfigKey(configId));
        // TODO: Delete all versions (would require listing objects first)
    }
    async generateUploadUrl(shopId, filename, _contentType, expiresIn = 3600) {
        const key = `uploads/${shopId}/${Date.now()}-${filename}`;
        const url = await this.client.generatePresignedUrl(key, expiresIn);
        return { url, key };
    }
    getPublicUrl(key) {
        return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${key}`;
    }
}
// Global R2 service instance
// Create service instance lazily to avoid build-time errors
let _r2ServiceInstance = null;
export function getR2Service() {
    if (!_r2ServiceInstance) {
        _r2ServiceInstance = new R2ConfigService();
    }
    return _r2ServiceInstance;
}
// Backward compatibility
export const r2Service = new Proxy({}, {
    get(_target, prop) {
        return getR2Service()[prop];
    },
});
// Cache utilities for edge functions
export class EdgeCache {
    static instance;
    cache = new Map();
    static getInstance() {
        if (!EdgeCache.instance) {
            EdgeCache.instance = new EdgeCache();
        }
        return EdgeCache.instance;
    }
    set(key, data, ttl) {
        this.cache.set(key, {
            data,
            expires: Date.now() + ttl * 1000,
        });
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
}
export const edgeCache = EdgeCache.getInstance();
//# sourceMappingURL=r2.js.map