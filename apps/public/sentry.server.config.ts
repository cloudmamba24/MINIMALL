import * as Sentry from '@sentry/nextjs';
import { createServerConfig } from '@minimall/core/server';

Sentry.init(createServerConfig({
  tags: { app: 'public' },
  enableInDevelopment: !!process.env.SENTRY_ENABLE_DEV,
}));