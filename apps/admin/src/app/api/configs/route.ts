import { createDefaultSiteConfig, extractShopFromDomain } from "@minimall/core";
import { configVersions, configs, db } from "@minimall/db";
import * as Sentry from "@sentry/nextjs";
import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/configs - list configs
export async function GET(_request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ success: true, items: [] });
    }

    const items = await db.select().from(configs).orderBy(desc(configs.updatedAt)).limit(50);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Failed to list configs:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Failed to list configs" }, { status: 500 });
  }
}

// POST /api/configs - create a new config and first draft version
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const body: { shopDomain?: string } = await (async () => {
      try {
        return await request.json();
      } catch {
        return {};
      }
    })();

    // Resolve shop domain from query, host, or body
    const shopFromQuery = searchParams.get("shopDomain") || searchParams.get("shop");
    const hostParam = searchParams.get("host");
    let shopDomain = body?.shopDomain as string | undefined;

    if (!shopDomain && shopFromQuery) {
      shopDomain = shopFromQuery;
    }

    if (!shopDomain && hostParam) {
      try {
        const decoded = Buffer.from(hostParam, "base64").toString("utf8");
        // Expecting format: my-shop.myshopify.com/admin
        shopDomain = decoded.replace("/admin", "");
      } catch {
        // ignore
      }
    }

    if (!shopDomain) {
      // Last resort: try header set by Shopify proxy
      shopDomain = request.headers.get("x-shopify-shop-domain") || undefined;
    }

    if (!shopDomain) {
      return NextResponse.json({ error: "shopDomain is required" }, { status: 400 });
    }

    const config = createDefaultSiteConfig(shopDomain);

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    // Save to DB as a draft version
    const versionId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx
        .insert(configs)
        .values({
          id: config.id,
          shop: extractShopFromDomain(shopDomain || ""),
          slug: config.id,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: configs.id,
          set: { updatedAt: new Date() },
        });

      await tx.insert(configVersions).values({
        id: versionId,
        configId: config.id,
        version: `v${Date.now()}`,
        data: config,
        isPublished: false,
        createdBy: "admin",
      });

      await tx
        .update(configs)
        .set({ currentVersionId: versionId, updatedAt: new Date() })
        .where(eq(configs.id, config.id));
    });

    return NextResponse.json({ success: true, configId: config.id, config });
  } catch (error) {
    console.error("Failed to create config:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Failed to create config" }, { status: 500 });
  }
}
