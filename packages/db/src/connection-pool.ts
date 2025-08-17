/**
 * Database Connection Pool Manager
 * Singleton pattern to ensure single connection pool across the application
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DatabaseConnection = ReturnType<typeof drizzle>;

class DatabasePool {
  private static instance: DatabasePool;
  private connection: DatabaseConnection | null = null;
  private connectionString: string | null = null;

  private constructor() {}

  static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  /**
   * Get or create a database connection
   * Reuses existing connection if available and connection string hasn't changed
   */
  getConnection(connectionUrl?: string): DatabaseConnection {
    const url = connectionUrl || process.env.DATABASE_URL;

    if (!url) {
      throw new Error(
        "DATABASE_URL is not configured. Please set the DATABASE_URL environment variable."
      );
    }

    // If connection exists and URL hasn't changed, return existing connection
    if (this.connection && this.connectionString === url) {
      return this.connection;
    }

    // Create new connection if URL changed or no connection exists
    try {
      const sql = neon(url);
      this.connection = drizzle(sql, { schema });
      this.connectionString = url;
      return this.connection;
    } catch (error) {
      throw new Error(
        `Failed to establish database connection: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Clear the connection pool (useful for testing or connection string changes)
   */
  clearConnection(): void {
    this.connection = null;
    this.connectionString = null;
  }
}

// Export singleton instance getter
export const getDatabaseConnection = (connectionUrl?: string): DatabaseConnection => {
  return DatabasePool.getInstance().getConnection(connectionUrl);
};

// Export function to clear connection (mainly for testing)
export const clearDatabaseConnection = (): void => {
  DatabasePool.getInstance().clearConnection();
};

// Default export for backward compatibility
export { getDatabaseConnection as getDb };
