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
      // drizzle migration types require any
      await migrate(db as unknown as object, { migrationsFolder: "./migrations" } as unknown as { migrationsFolder: string });
    } else if (url.hostname.includes("neon")) {
      // drizzle migration types require any
      await migrateNeon(db as unknown as object, { migrationsFolder: "./migrations" } as unknown as { migrationsFolder: string });
    } else {
      // drizzle migration types require any
      await migratePostgres(db as unknown as object, { migrationsFolder: "./migrations" } as unknown as { migrationsFolder: string });
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
