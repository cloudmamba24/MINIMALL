export * from './root';
export * from './trpc';
export type { AppRouter } from './root';

// Re-export commonly needed items
export { appRouter } from './root';
export { createTRPCContext } from './trpc';
