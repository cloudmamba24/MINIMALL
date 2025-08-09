import * as Sentry from '@sentry/nextjs';
import { createClientConfig } from '@minimall/core/src/sentry';

Sentry.init(createClientConfig({
  tags: { app: 'admin' },
  enableInDevelopment: !!process.env.SENTRY_ENABLE_DEV,
  integrations: [
    Sentry.replayIntegration({
      // Mask sensitive data in admin interface
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
}));