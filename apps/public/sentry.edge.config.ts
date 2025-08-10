import { createEdgeConfig } from "@minimall/core/server";
import * as Sentry from "@sentry/nextjs";

Sentry.init(
  createEdgeConfig({
    tags: { app: "public" },
    enableInDevelopment: !!process.env.SENTRY_ENABLE_DEV,
  })
);
