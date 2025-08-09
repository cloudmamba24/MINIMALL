import { migrate as migrateNeon } from "drizzle-orm/neon-serverless/migrator";
import { migrate } from "drizzle-orm/planetscale-serverless/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "./index";

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("🔄 Running database migrations...");

  const db = createDatabase(databaseUrl);
  const url = new URL(databaseUrl);

  try {
    // Choose migration function based on database type
    if (url.hostname.includes("planetscale") || url.hostname.includes("pscale")) {
      // biome-ignore lint/suspicious/noExplicitAny: drizzle migration types require any
      await migrate(db as any, { migrationsFolder: "./migrations" });
    } else if (url.hostname.includes("neon")) {
      // biome-ignore lint/suspicious/noExplicitAny: drizzle migration types require any
      await migrateNeon(db as any, { migrationsFolder: "./migrations" });
    } else {
      // biome-ignore lint/suspicious/noExplicitAny: drizzle migration types require any
      await migratePostgres(db as any, { migrationsFolder: "./migrations" });
    }

    console.log("✅ Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}
