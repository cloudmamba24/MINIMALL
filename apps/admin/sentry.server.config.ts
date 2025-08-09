import * as Sentry from '@sentry/nextjs';
import { createServerConfig } from '@minimall/core/src/sentry';

Sentry.init(createServerConfig({
  tags: { app: 'admin' },
  enableInDevelopment: !!process.env.SENTRY_ENABLE_DEV,
}));