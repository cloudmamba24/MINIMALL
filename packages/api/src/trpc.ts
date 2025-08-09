import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';

// Import database connection
let db: any = null;
try {
  const dbModule = require('@minimall/db');
  db = dbModule.db;
} catch {
  console.warn('Database package not available');
}

// Import R2 service
let getR2Service: any = null;
try {
  const r2Module = require('@minimall/core/server');
  getR2Service = r2Module.getR2Service;
} catch {
  console.warn('R2 service not available');
}

/**
 * 1. CONTEXT
 * This is the context that's available to all tRPC procedures
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  return {
    db,
    r2: getR2Service ? getR2Service() : null,
    req,
    res,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 * This is where the tRPC API is initialized, connecting the context and transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === 'ZodError'
            ? (error.cause as any).flatten()
            : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE HELPERS
 * These are the pieces you use to build your tRPC API
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure;

/**
 * Database-required procedure
 */
export const dbProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.db) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Database connection not available',
    });
  }
  return next({
    ctx: {
      ...ctx,
      db: ctx.db,
    },
  });
});

/**
 * R2-required procedure  
 */
export const r2Procedure = t.procedure.use(async ({ ctx, next }) => {
  try {
    // Test if R2 service is properly configured
    if (!ctx.r2) {
      throw new Error('R2 service not available');
    }
    return next({
      ctx: {
        ...ctx,
        r2: ctx.r2,
      },
    });
  } catch (error) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'R2 storage not configured',
    });
  }
});