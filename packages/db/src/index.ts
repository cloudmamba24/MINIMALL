import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Simplified database connection using postgres-js (most stable)
export function createDatabase(databaseUrl: string) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
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
