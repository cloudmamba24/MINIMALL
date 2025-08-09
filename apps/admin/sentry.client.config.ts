import { createClientConfig } from "@minimall/core";
import * as Sentry from "@sentry/nextjs";

Sentry.init(
  createClientConfig({
    tags: { app: "admin" },
    enableInDevelopment: !!process.env.SENTRY_ENABLE_DEV,
    integrations: [
      // Replay integration temporarily disabled due to version compatibility issues
      // Will be re-enabled once Sentry is updated to a compatible version
      // Sentry.replayIntegration({
      //   // Mask sensitive data in admin interface
      //   maskAllText: true,
      //   maskAllInputs: true,
      //   blockAllMedia: true,
      // }),
    ],
  })
);
