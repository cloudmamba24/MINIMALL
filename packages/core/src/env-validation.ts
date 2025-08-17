// Environment validation using our debugging documentation patterns
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database
  DATABASE_URL: z.string().url().optional(),
  DATABASE_HOST: z.string().optional(),
  DATABASE_NAME: z.string().optional(),

  // R2 Storage
  R2_ENDPOINT: z.string().url().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ACCESS_KEY: z.string().optional(),
  R2_SECRET: z.string().optional(),

  // Shopify
  SHOPIFY_API_KEY: z.string().optional(),
  SHOPIFY_API_SECRET: z.string().optional(),
  SHOPIFY_SCOPES: z.string().optional(),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),

  // Auth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),

  // External APIs
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Optional monitoring
  SENTRY_DSN: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (env: Record<string, string | undefined> = process.env): Env => {
  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages: string[] = [];
      const missingRequired: string[] = [];
      const invalidFormat: string[] = [];

      error.errors.forEach((err) => {
        const fieldPath = err.path.join(".");
        errorMessages.push(`  - ${fieldPath}: ${err.message}`);

        // Helpful debugging info from our documentation
        const envKey = err.path[0] as string;
        const currentValue = env[envKey];

        if (!currentValue) {
          missingRequired.push(envKey);
          errorMessages.push("    Current value: undefined");
          errorMessages.push("    💡 Check your .env.local file or deployment environment");
        } else if (err.code === "invalid_string" && err.validation === "url") {
          invalidFormat.push(`${envKey} (invalid URL)`);
          errorMessages.push(`    Current value: "${currentValue}"`);
          errorMessages.push("    💡 Must be a valid URL (include http:// or https://)");
        } else if (err.code === "too_small") {
          invalidFormat.push(`${envKey} (too short)`);
          errorMessages.push(`    Current value length: ${currentValue.length}`);
          errorMessages.push(`    💡 Minimum length required: ${err.minimum}`);
        }
      });

      // Create a comprehensive error message
      let errorSummary = "\n❌ Environment validation failed:\n\n";

      if (missingRequired.length > 0) {
        errorSummary += "Missing required environment variables:\n";
        missingRequired.forEach((key) => {
          errorSummary += `  • ${key}\n`;
        });
        errorSummary += "\n";
      }

      if (invalidFormat.length > 0) {
        errorSummary += "Invalid format for environment variables:\n";
        invalidFormat.forEach((item) => {
          errorSummary += `  • ${item}\n`;
        });
        errorSummary += "\n";
      }

      errorSummary += "Details:\n";
      errorSummary += errorMessages.join("\n");

      // In production, fail hard with clear message
      if (env.NODE_ENV === "production") {
        throw new Error(errorSummary);
      }

      // In development, show detailed error but continue
      console.error(errorSummary);
      console.warn("\n⚠️  Continuing with invalid environment in development mode\n");
      return envSchema.parse({}); // Return defaults
    }

    // If it's not a Zod error, throw it as is
    throw error;
  }
};

// Environment debugging utility from our documentation
export const debugEnvironment = (env: Record<string, string | undefined> = process.env) => {
  console.log("🔍 Environment Debug Info:");
  console.log(`NODE_ENV: ${env.NODE_ENV}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Node version: ${process.version}`);

  const sensitiveKeys = ["SECRET", "KEY", "TOKEN", "PASSWORD"];

  Object.entries(env)
    .filter(
      ([key]) =>
        key.startsWith("DATABASE_") ||
        key.startsWith("R2_") ||
        key.startsWith("SHOPIFY_") ||
        key.startsWith("NEXTAUTH_") ||
        key.startsWith("STRIPE_")
    )
    .forEach(([key, value]) => {
      const isSensitive = sensitiveKeys.some((sensitive) => key.includes(sensitive));
      console.log(`${key}: ${isSensitive ? "[REDACTED]" : value || "[UNSET]"}`);
    });
};

// Service availability checker
export const checkServiceAvailability = async () => {
  const results = {
    database: false,
    r2: false,
    shopify: false,
  };

  // Database check
  try {
    if (process.env.DATABASE_URL) {
      // Simple connection test would go here
      results.database = true;
    }
  } catch (error) {
    console.warn("Database connection check failed:", error);
  }

  // R2 check
  try {
    if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY) {
      results.r2 = true;
    }
  } catch (error) {
    console.warn("R2 service check failed:", error);
  }

  // Shopify check
  try {
    if (process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET) {
      results.shopify = true;
    }
  } catch (error) {
    console.warn("Shopify service check failed:", error);
  }

  return results;
};
