import * as Sentry from '@sentry/nextjs';
import { createClientConfig } from '@minimall/core/src/sentry';

Sentry.init(createClientConfig({
  tags: { app: 'public' },
  enableInDevelopment: !!process.env.SENTRY_ENABLE_DEV,
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content, input values, etc.
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
}));