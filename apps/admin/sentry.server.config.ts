import { createServerConfig } from "@minimall/core";
import * as Sentry from "@sentry/nextjs";

Sentry.init(
  createServerConfig({
    tags: { app: "admin" },
    enableInDevelopment: !!process.env.SENTRY_ENABLE_DEV,
  })
);
