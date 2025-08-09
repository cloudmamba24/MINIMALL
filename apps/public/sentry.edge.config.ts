import * as Sentry from '@sentry/nextjs';
import { createEdgeConfig } from '@minimall/core/server';

Sentry.init(createEdgeConfig({
  tags: { app: 'public' },
  enableInDevelopment: !!process.env.SENTRY_ENABLE_DEV,
}));