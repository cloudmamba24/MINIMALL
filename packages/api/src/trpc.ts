import { TRPCError, initTRPC } from '@trpc/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { validateEnv } from '@minimall/core';

// Dynamic imports for better compatibility
async function getDatabase() {
  try {
    const { db } = await import('@minimall/db');
    return db;
  } catch {
    console.warn('Database package not available');
    return null;
  }
}

async function getR2ServiceInstance() {
  try {
    const { getR2Service } = await import('@minimall/core/server');
    return getR2Service();
  } catch {
    console.warn('R2 service not available');
    return null;
  }
}

/**
 * 1. CONTEXT
 * This is the context that's available to all tRPC procedures
 */
// Generate request correlation ID for tracing
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;
  const requestId = req.headers['x-request-id'] || generateRequestId();

  // Validate environment on context creation
  const env = validateEnv();
  
  const [db, r2] = await Promise.all([
    getDatabase(),
    getR2ServiceInstance()
  ]);

  return {
    db,
    r2,
    req,
    res,
    requestId,
    env,
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

// Performance monitoring middleware from our debugging docs
const performanceMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now();
  
  const result = await next({
    ctx: {
      ...ctx,
      requestId: ctx.requestId,
    },
  });
  
  const duration = Date.now() - start;
  
  // Log slow queries - following our debugging patterns
  if (duration > 1000) {
    console.warn(`🐌 Slow tRPC ${type}:${path} took ${duration}ms [${ctx.requestId}]`);
  }
  
  // Log all operations in development
  if (ctx.env?.NODE_ENV === 'development') {
    console.log(`📊 tRPC ${type}:${path} - ${duration}ms [${ctx.requestId}]`);
  }
  
  return result;
});

// Enhanced error logging middleware
const errorLoggingMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  try {
    return await next();
  } catch (error) {
    // Comprehensive error logging from our debugging docs
    console.error('🚨 tRPC Error:', {
      path,
      type,
      requestId: ctx.requestId,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      timestamp: new Date().toISOString(),
    });
    
    throw error;
  }
});

/**
 * 3. ROUTER & PROCEDURE HELPERS
 * These are the pieces you use to build your tRPC API
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure with monitoring
 */
export const publicProcedure = t.procedure
  .use(errorLoggingMiddleware)
  .use(performanceMiddleware);

/**
 * Database-required procedure with enhanced error handling
 */
export const dbProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.db) {
    console.error(`❌ Database not available for request [${ctx.requestId}]`);
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
 * R2-required procedure with enhanced error handling
 */
export const r2Procedure = publicProcedure.use(async ({ ctx, next }) => {
  try {
    // Test if R2 service is properly configured
    if (!ctx.r2) {
      console.error(`❌ R2 service not available for request [${ctx.requestId}]`);
      throw new Error('R2 service not available');
    }
    return next({
      ctx: {
        ...ctx,
        r2: ctx.r2,
      },
    });
  } catch (_error) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'R2 storage not configured',
    });
  }
});
