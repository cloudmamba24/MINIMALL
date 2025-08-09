import { createTRPCRouter } from './trpc';
import { configsRouter } from './routers/configs';
import { analyticsRouter } from './routers/analytics';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  configs: configsRouter,
  analytics: analyticsRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;