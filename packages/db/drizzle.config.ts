import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from the root .env.local
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in environment variables");
  console.error("Please ensure .env.local exists and contains DATABASE_URL");
  process.exit(1);
}

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
} satisfies Config;
