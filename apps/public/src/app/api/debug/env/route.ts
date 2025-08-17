import { NextResponse } from "next/server";

export async function GET() {
  // Only show this in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? "***SET***" : "NOT SET",
    R2_ENDPOINT: process.env.R2_ENDPOINT ? "***SET***" : "NOT SET",
    R2_ACCESS_KEY: process.env.R2_ACCESS_KEY ? "***SET***" : "NOT SET",
    R2_SECRET: process.env.R2_SECRET ? "***SET***" : "NOT SET",
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ? "***SET***" : "NOT SET",
    SHOPIFY_DOMAIN: process.env.SHOPIFY_DOMAIN ? "***SET***" : "NOT SET",
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
      ? "***SET***"
      : "NOT SET",
    NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env
      .NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
      ? "***SET***"
      : "NOT SET",
    JWT_SECRET: process.env.JWT_SECRET ? "***SET***" : "NOT SET",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "***SET***" : "NOT SET",
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    envVarsStatus: envVars,
    envFileCheck: {
      cwd: process.cwd(),
      dotEnvLocalExists: require("node:fs").existsSync(".env.local"),
      dotEnvExists: require("node:fs").existsSync(".env"),
      rootEnvLocalExists: require("node:fs").existsSync("../../.env.local"),
      parentEnvLocalExists: require("node:fs").existsSync("../.env.local"),
    },
  });
}
