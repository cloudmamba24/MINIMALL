import { createServerConfig } from "@minimall/core/server";
import * as Sentry from "@sentry/nextjs";

Sentry.init(
  createServerConfig({
    tags: { app: "public" },
    enableInDevelopment: !!process.env.SENTRY_ENABLE_DEV,
  })
);
