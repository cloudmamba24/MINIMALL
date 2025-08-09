import type { SiteConfig } from "./types";
export declare class R2ConfigService {
    private client;
    constructor();
    private getConfigKey;
    saveConfig(configId: string, config: SiteConfig, version?: string): Promise<void>;
    getConfig(configId: string, version?: string): Promise<SiteConfig>;
    deleteConfig(configId: string): Promise<void>;
    generateUploadUrl(shopId: string, filename: string, _contentType: string, expiresIn?: number): Promise<{
        url: string;
        key: string;
    }>;
    getPublicUrl(key: string): string;
}
export declare function getR2Service(): R2ConfigService;
export declare const r2Service: R2ConfigService;
export declare class EdgeCache {
    private static instance;
    private cache;
    static getInstance(): EdgeCache;
    set<T>(key: string, data: T, ttl: number): void;
    get<T>(key: string): T | null;
    delete(key: string): void;
    clear(): void;
}
export declare const edgeCache: EdgeCache;
//# sourceMappingURL=r2.d.ts.map