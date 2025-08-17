/**
 * Enhanced Database Connection with Retry Logic
 * Provides robust connection handling with automatic retries and proper error reporting
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DatabaseConnection = ReturnType<typeof drizzle>;

interface ConnectionOptions {
  maxRetries?: number;
  retryDelay?: number;
  verbose?: boolean;
}

class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private connection: DatabaseConnection | null = null;
  private connectionString: string | null = null;
  private lastError: Error | null = null;
  private connectionAttempts = 0;

  private constructor() {}

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  /**
   * Get or create a database connection with retry logic
   */
  async getConnectionWithRetry(
    connectionUrl?: string,
    options: ConnectionOptions = {}
  ): Promise<DatabaseConnection> {
    const { maxRetries = 3, retryDelay = 1000, verbose = true } = options;
    const url = connectionUrl || process.env.DATABASE_URL;

    if (!url) {
      const error = new Error(
        "DATABASE_URL is not configured. Please set the DATABASE_URL environment variable in your .env.local file."
      );
      if (verbose) {
        console.error("[Database] Configuration error:", error.message);
        console.error("[Database] Check your .env.local file and ensure DATABASE_URL is set");
      }
      throw error;
    }

    // Return existing connection if URL hasn't changed and connection is healthy
    if (this.connection && this.connectionString === url) {
      try {
        // Test the connection with a simple query
        await this.testConnection(this.connection);
        return this.connection;
      } catch (error) {
        if (verbose) {
          console.warn("[Database] Existing connection failed health check, reconnecting...");
        }
        this.connection = null;
      }
    }

    // Attempt to create new connection with retries
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (verbose && attempt > 1) {
          console.log(`[Database] Connection attempt ${attempt}/${maxRetries}...`);
        }

        const sql = neon(url);
        const newConnection = drizzle(sql, { schema });
        
        // Test the connection before returning
        await this.testConnection(newConnection);
        
        this.connection = newConnection;
        this.connectionString = url;
        this.connectionAttempts = attempt;
        
        if (verbose) {
          console.log(`[Database] Successfully connected on attempt ${attempt}`);
        }
        
        return newConnection;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (verbose) {
          console.error(`[Database] Connection attempt ${attempt} failed:`, lastError.message);
        }
        
        if (attempt < maxRetries) {
          await this.delay(retryDelay * attempt); // Exponential backoff
        }
      }
    }

    // All retries failed
    this.lastError = lastError;
    const finalError = new Error(
      `Failed to establish database connection after ${maxRetries} attempts. Last error: ${lastError?.message || "Unknown error"}`
    );
    
    if (verbose) {
      console.error("[Database] All connection attempts failed");
      console.error("[Database] Troubleshooting tips:");
      console.error("  1. Check if DATABASE_URL is correct in .env.local");
      console.error("  2. Verify database server is accessible");
      console.error("  3. Check network connectivity");
      console.error("  4. Ensure SSL settings are correct");
    }
    
    throw finalError;
  }

  /**
   * Test database connection with a simple query
   */
  private async testConnection(db: DatabaseConnection): Promise<void> {
    try {
      // Execute a simple query to test the connection
      const result = await db.execute<{ test: number }>(
        { sql: "SELECT 1 as test", params: [], types: {} } as any
      );
      if (!result) {
        throw new Error("Connection test query returned no result");
      }
    } catch (error) {
      throw new Error(
        `Database connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get synchronous connection (for backward compatibility)
   * Note: This will throw if connection is not available
   */
  getConnection(connectionUrl?: string): DatabaseConnection {
    const url = connectionUrl || process.env.DATABASE_URL;

    if (!url) {
      throw new Error(
        "DATABASE_URL is not configured. Please set the DATABASE_URL environment variable."
      );
    }

    // Return existing connection if available
    if (this.connection && this.connectionString === url) {
      return this.connection;
    }

    // Try to create connection synchronously (no retries)
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
   * Clear the connection (useful for testing or connection string changes)
   */
  clearConnection(): void {
    this.connection = null;
    this.connectionString = null;
    this.lastError = null;
    this.connectionAttempts = 0;
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    attempts: number;
    lastError: string | null;
  } {
    return {
      connected: this.connection !== null,
      attempts: this.connectionAttempts,
      lastError: this.lastError?.message || null,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export functions
export const getDatabaseConnectionWithRetry = async (
  connectionUrl?: string,
  options?: ConnectionOptions
): Promise<DatabaseConnection> => {
  return DatabaseConnectionManager.getInstance().getConnectionWithRetry(connectionUrl, options);
};

export const getDatabaseConnection = (connectionUrl?: string): DatabaseConnection => {
  return DatabaseConnectionManager.getInstance().getConnection(connectionUrl);
};

export const clearDatabaseConnection = (): void => {
  DatabaseConnectionManager.getInstance().clearConnection();
};

export const getDatabaseStatus = () => {
  return DatabaseConnectionManager.getInstance().getStatus();
};