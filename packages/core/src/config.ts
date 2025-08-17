/**
 * Centralized Configuration Management
 * Removes hardcoded localhost references and provides environment-based URLs
 */

export interface AppConfig {
  environment: "development" | "test" | "production";
  urls: {
    base: string;
    admin: string;
    public: string;
    api: string;
  };
  database: {
    url: string;
    poolSize: number;
  };
  shopify: {
    apiKey: string;
    apiSecret: string;
    scopes: string;
    webhookSecret: string;
    domain: string;
    storefrontToken: string;
  };
  storage: {
    endpoint: string;
    bucket: string;
    publicUrl: string;
  };
  auth: {
    nextAuthUrl: string;
    nextAuthSecret: string;
  };
  features: {
    advancedAnalytics: boolean;
    socialImport: boolean;
    performanceMonitoring: boolean;
  };
}

/**
 * Get the base URL for the current environment
 */
function getBaseUrl(type: "admin" | "public" = "public"): string {
  // Check for Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Check for explicit environment URLs
  if (type === "admin" && process.env.NEXT_PUBLIC_ADMIN_URL) {
    return process.env.NEXT_PUBLIC_ADMIN_URL;
  }

  if (type === "public" && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Default ports for local development
  const defaultPorts = {
    admin: 3001,
    public: 3000,
  };

  // Only use localhost in development
  if (process.env.NODE_ENV === "development") {
    return `http://localhost:${defaultPorts[type]}`;
  }

  // In production without explicit URLs, throw error
  throw new Error(
    `Missing required environment variable: ${type === "admin" ? "NEXT_PUBLIC_ADMIN_URL" : "NEXT_PUBLIC_BASE_URL"}`
  );
}

/**
 * Load and validate application configuration
 */
export function loadConfig(): AppConfig {
  const environment = (process.env.NODE_ENV || "development") as AppConfig["environment"];

  try {
    const config: AppConfig = {
      environment,
      urls: {
        base: getBaseUrl("public"),
        admin: getBaseUrl("admin"),
        public: getBaseUrl("public"),
        api: `${getBaseUrl("admin")}/api`,
      },
      database: {
        url: process.env.DATABASE_URL || "",
        poolSize: Number.parseInt(process.env.DATABASE_POOL_SIZE || "10", 10),
      },
      shopify: {
        apiKey: process.env.SHOPIFY_API_KEY || "",
        apiSecret: process.env.SHOPIFY_API_SECRET || "",
        scopes: process.env.SHOPIFY_SCOPES || "",
        webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || "",
        domain: process.env.SHOPIFY_DOMAIN || "",
        storefrontToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "",
      },
      storage: {
        endpoint: process.env.R2_ENDPOINT || "",
        bucket: process.env.R2_BUCKET_NAME || "",
        publicUrl: process.env.R2_PUBLIC_URL || "",
      },
      auth: {
        nextAuthUrl: process.env.NEXTAUTH_URL || getBaseUrl("admin"),
        nextAuthSecret: process.env.NEXTAUTH_SECRET || "",
      },
      features: {
        advancedAnalytics: process.env.FEATURE_ADVANCED_ANALYTICS === "true",
        socialImport: process.env.FEATURE_SOCIAL_IMPORT === "true",
        performanceMonitoring: process.env.FEATURE_PERFORMANCE_MONITORING === "true",
      },
    };

    // Validate required fields in production
    if (environment === "production") {
      validateProductionConfig(config);
    }

    return config;
  } catch (error) {
    // In build time, return minimal config
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return getMinimalConfig();
    }
    throw error;
  }
}

/**
 * Validate production configuration
 */
function validateProductionConfig(config: AppConfig): void {
  const requiredFields = [
    { path: "database.url", value: config.database.url },
    { path: "shopify.apiKey", value: config.shopify.apiKey },
    { path: "shopify.apiSecret", value: config.shopify.apiSecret },
    { path: "auth.nextAuthSecret", value: config.auth.nextAuthSecret },
  ];

  const missingFields = requiredFields.filter((field) => !field.value).map((field) => field.path);

  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration for production: ${missingFields.join(", ")}`);
  }
}

/**
 * Get minimal config for build time
 */
function getMinimalConfig(): AppConfig {
  return {
    environment: "development",
    urls: {
      base: "http://localhost:3000",
      admin: "http://localhost:3001",
      public: "http://localhost:3000",
      api: "http://localhost:3001/api",
    },
    database: {
      url: "",
      poolSize: 10,
    },
    shopify: {
      apiKey: "",
      apiSecret: "",
      scopes: "",
      webhookSecret: "",
      domain: "",
      storefrontToken: "",
    },
    storage: {
      endpoint: "",
      bucket: "",
      publicUrl: "",
    },
    auth: {
      nextAuthUrl: "http://localhost:3001",
      nextAuthSecret: "",
    },
    features: {
      advancedAnalytics: false,
      socialImport: false,
      performanceMonitoring: false,
    },
  };
}

// Export singleton config instance
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

// Export helper functions for common use cases
export function getApiUrl(path = ""): string {
  const config = getConfig();
  return `${config.urls.api}${path}`;
}

export function getPublicUrl(path = ""): string {
  const config = getConfig();
  return `${config.urls.public}${path}`;
}

export function getAdminUrl(path = ""): string {
  const config = getConfig();
  return `${config.urls.admin}${path}`;
}

export function isProduction(): boolean {
  return getConfig().environment === "production";
}

export function isDevelopment(): boolean {
  return getConfig().environment === "development";
}

export function isFeatureEnabled(feature: keyof AppConfig["features"]): boolean {
  return getConfig().features[feature];
}

export default {
  loadConfig,
  getConfig,
  getApiUrl,
  getPublicUrl,
  getAdminUrl,
  isProduction,
  isDevelopment,
  isFeatureEnabled,
};
