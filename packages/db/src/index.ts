import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Enhanced database connection with proper connection pooling
export function createDatabase(databaseUrl: string) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  // Connection pooling configuration for better performance
  const client = postgres(databaseUrl, {
    // Connection timeout settings
    connect_timeout: 60, // Connection timeout in seconds

    // Performance optimizations
    prepare: false, // Disable prepared statements for better compatibility
    types: {}, // Use default type parsers

    // Error handling
    onnotice: () => {
      // Suppress PostgreSQL notices
    }, // Suppress PostgreSQL notices

    // Environment-specific settings
    ...(process.env.NODE_ENV === "production"
      ? {
          // Production: More conservative settings
          max: 10, // Maximum pool size
          idle_timeout: 30, // Seconds before idle connections are closed
          transform: postgres.camel, // Use camelCase transform in production
        }
      : {
          // Development: More flexible settings
          max: 5, // Maximum pool size
          idle_timeout: 10, // Seconds before idle connections are closed
          debug: Boolean(process.env.DB_DEBUG), // Enable debug logging if DB_DEBUG is set
        }),

    // SSL configuration for production
    ssl:
      process.env.NODE_ENV === "production" && !databaseUrl.includes("localhost")
        ? { rejectUnauthorized: false }
        : false,
  });

  return drizzle(client, {
    schema,
    logger: process.env.NODE_ENV === "development" && process.env.DB_DEBUG === "true",
  });
}

// Export types
export type Database = ReturnType<typeof createDatabase>;

// Export the database instance (only if DATABASE_URL is provided)
let db: Database | null = null;
if (process.env.DATABASE_URL) {
  try {
    db = createDatabase(process.env.DATABASE_URL);
  } catch {
    // Ignore error in build environment
    db = null;
  }
}

export { db };

// Export all schema
export * from "./schema";
export { schema };

// Export query monitoring utilities
export * from "./query-monitor";

// Export query caching utilities
export * from "./query-cache";

// Export connection pool utilities
export { getDatabaseConnection, clearDatabaseConnection, getDb } from "./connection-pool";
