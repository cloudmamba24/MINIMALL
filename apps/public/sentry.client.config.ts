import { createClientConfig } from "@minimall/core/client";
import * as Sentry from "@sentry/nextjs";

Sentry.init(
  createClientConfig({
    tags: { app: "public" },
    enableInDevelopment: !!process.env.SENTRY_ENABLE_DEV,
    integrations: [
      // Replay integration temporarily disabled due to compatibility issues
      // Will be re-enabled once Sentry version is updated
      // Sentry.replayIntegration({
      //   maskAllText: true,
      //   maskAllInputs: true,
      //   blockAllMedia: true,
      // }),
    ],
  })
);
