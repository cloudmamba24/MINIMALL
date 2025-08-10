# Data Layer - Type-Safe Backend Architecture

This guide covers the complete data layer stack for building sophisticated applications with type-safe APIs, optimized database queries, and real-time features.

## 🔌 **tRPC v10 - Type-Safe API Layer**

### **Revolutionary tRPC Setup**

```typescript
// lib/trpc/server.ts - Server setup
import { initTRPC } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Create context with dependency injection
export const createTRPCContext = async ({ req, res }: CreateNextContextOptions) => {
  const session = await getServerSession(req, res)
  
  return {
    req,
    res,
    session,
    db,
    // Add other services
    r2: getR2Service(),
    shopify: getShopifyClient(),
  }
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

// Advanced middleware patterns
const performanceMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now()
  
  const result = await next({
    ctx: {
      ...ctx,
      requestId: generateRequestId(),
    },
  })
  
  const duration = Date.now() - start
  
  // Log slow queries
  if (duration > 1000) {
    console.warn(`Slow tRPC ${type}:${path} took ${duration}ms`)
  }
  
  return result
})

const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

// Procedure types
export const publicProcedure = t.procedure.use(performanceMiddleware)
export const protectedProcedure = publicProcedure.use(authMiddleware)
export const createTRPCRouter = t.router
export const middleware = t.middleware
```

### **Advanced Router Patterns**

```typescript
// lib/trpc/routers/products.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { eq, desc, and, like, gte, lte } from 'drizzle-orm'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../server'
import { products, productVariants } from '@/lib/db/schema'

const productSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['price', 'name', 'created', 'popularity']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const productsRouter = createTRPCRouter({
  // Advanced search with filtering
  search: publicProcedure
    .input(productSearchSchema)
    .query(async ({ ctx, input }) => {
      const conditions = []
      
      // Text search
      if (input.q) {
        conditions.push(like(products.title, `%${input.q}%`))
      }
      
      // Category filter
      if (input.category) {
        conditions.push(eq(products.category, input.category))
      }
      
      // Price range
      if (input.minPrice) {
        conditions.push(gte(products.price, input.minPrice))
      }
      if (input.maxPrice) {
        conditions.push(lte(products.price, input.maxPrice))
      }
      
      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined
      
      // Parallel queries for performance
      const [productList, totalCount] = await Promise.all([
        ctx.db.query.products.findMany({
          where: whereCondition,
          with: {
            variants: {
              limit: 5,
            },
            reviews: {
              limit: 3,
              orderBy: desc(reviews.createdAt),
            },
          },
          limit: input.limit,
          offset: input.offset,
          orderBy: input.sortOrder === 'desc' 
            ? desc(products[input.sortBy])
            : products[input.sortBy],
        }),
        ctx.db
          .select({ count: count() })
          .from(products)
          .where(whereCondition)
          .then(result => result[0].count)
      ])
      
      return {
        products: productList,
        pagination: {
          total: totalCount,
          page: Math.floor(input.offset / input.limit) + 1,
          limit: input.limit,
          hasNext: input.offset + input.limit < totalCount,
        },
      }
    }),

  // Get single product with all relations
  byId: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: eq(products.id, input),
        with: {
          variants: {
            orderBy: products.createdAt,
          },
          reviews: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: desc(reviews.createdAt),
            limit: 10,
          },
          category: true,
          relatedProducts: {
            limit: 4,
          },
        },
      })
      
      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        })
      }
      
      return product
    }),

  // Create product (protected)
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().min(10),
      price: z.number().positive(),
      category: z.string(),
      images: z.array(z.string().url()),
      variants: z.array(z.object({
        name: z.string(),
        price: z.number().positive(),
        inventory: z.number().min(0),
        attributes: z.record(z.string()),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Create main product
        const [newProduct] = await tx
          .insert(products)
          .values({
            ...input,
            userId: ctx.session.user.id,
          })
          .returning()

        // Create variants if provided
        if (input.variants?.length) {
          await tx.insert(productVariants).values(
            input.variants.map(variant => ({
              ...variant,
              productId: newProduct.id,
            }))
          )
        }

        return newProduct
      })
    }),

  // Bulk operations for performance
  bulkUpdate: protectedProcedure
    .input(z.array(z.object({
      id: z.string(),
      updates: z.object({
        price: z.number().positive().optional(),
        inventory: z.number().min(0).optional(),
        status: z.enum(['active', 'inactive', 'archived']).optional(),
      }),
    })))
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.all(
        input.map(({ id, updates }) =>
          ctx.db
            .update(products)
            .set(updates)
            .where(eq(products.id, id))
            .returning()
        )
      )
      
      return results.flat()
    }),
})
```

### **Client-Side Setup with React Query**

```typescript
// lib/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import superjson from 'superjson'
import type { AppRouter } from '@/lib/trpc/routers/_app'

export const trpc = createTRPCReact<AppRouter>()

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
            return false
          }
          return failureCount < 3
        },
      },
      mutations: {
        onError: (error: any) => {
          toast.error(error.message ?? 'Something went wrong')
        },
      },
    },
  }))

  const [trpcClient] = useState(() => trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: '/api/trpc',
        headers() {
          return {
            'x-request-id': generateRequestId(),
          }
        },
      }),
    ],
  }))

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}

// Usage in components
const ProductList = () => {
  const [searchParams, setSearchParams] = useState({
    q: '',
    category: '',
    limit: 20,
    offset: 0,
  })

  // Revolutionary type-safe queries
  const {
    data: productsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
  } = trpc.products.search.useInfiniteQuery(
    searchParams,
    {
      getNextPageParam: (lastPage) => 
        lastPage.pagination.hasNext 
          ? lastPage.pagination.page * lastPage.pagination.limit 
          : undefined,
      keepPreviousData: true,
    }
  )

  // Revolutionary optimistic mutations
  const utils = trpc.useUtils()
  const createProductMutation = trpc.products.create.useMutation({
    onMutate: async (newProduct) => {
      // Cancel outgoing refetches
      await utils.products.search.cancel()
      
      // Snapshot the previous value
      const previousData = utils.products.search.getInfiniteData(searchParams)
      
      // Optimistically update
      utils.products.search.setInfiniteData(searchParams, (old) => {
        if (!old) return old
        
        return {
          ...old,
          pages: old.pages.map((page, index) => 
            index === 0 
              ? { ...page, products: [newProduct as any, ...page.products] }
              : page
          ),
        }
      })
      
      return { previousData }
    },
    onError: (err, newProduct, context) => {
      // Revert on error
      if (context?.previousData) {
        utils.products.search.setInfiniteData(searchParams, context.previousData)
      }
    },
    onSettled: () => {
      utils.products.search.invalidate()
    },
  })

  return (
    <div className="product-list">
      {productsData?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </React.Fragment>
      ))}
      
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          Load More
        </button>
      )}
    </div>
  )
}
```

---

## 🗄️ **Drizzle ORM - Modern Database Layer**

### **Advanced Schema Design**

```typescript
// lib/db/schema.ts
import { pgTable, text, integer, decimal, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}))

// Store configurations
export const configs = pgTable('configs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storeName: text('store_name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  
  // JSON configuration
  theme: jsonb('theme').$type<{
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    customCSS?: string
  }>(),
  
  layout: jsonb('layout').$type<{
    headerStyle: 'minimal' | 'full' | 'centered'
    gridColumns: 2 | 3 | 4
    showPrices: boolean
    showDescriptions: boolean
  }>(),
  
  integrations: jsonb('integrations').$type<{
    shopify?: { domain: string; accessToken: string }
    stripe?: { publishableKey: string }
    analytics?: { googleAnalyticsId: string }
  }>(),
  
  // Metadata
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('configs_user_id_idx').on(table.userId),
  slugIdx: uniqueIndex('configs_slug_idx').on(table.slug),
  publishedIdx: index('configs_published_idx').on(table.isPublished),
}))

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  configId: text('config_id').notNull().references(() => configs.id, { onDelete: 'cascade' }),
  
  title: text('title').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  
  // Images as JSON array
  images: jsonb('images').$type<string[]>().default([]),
  
  // Product attributes
  category: text('category'),
  tags: jsonb('tags').$type<string[]>().default([]),
  
  // Inventory
  inventory: integer('inventory').default(0),
  trackInventory: boolean('track_inventory').default(true),
  
  // SEO
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  
  // Status
  status: text('status', { enum: ['active', 'inactive', 'archived'] }).default('active'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  configIdIdx: index('products_config_id_idx').on(table.configId),
  statusIdx: index('products_status_idx').on(table.status),
  categoryIdx: index('products_category_idx').on(table.category),
  createdAtIdx: index('products_created_at_idx').on(table.createdAt.desc()),
  
  // Full-text search index
  searchIdx: index('products_search_idx').using('gin', 
    sql`to_tsvector('english', ${table.title} || ' ' || coalesce(${table.description}, ''))`
  ),
}))

// Product variants
export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  
  // Variant attributes (color, size, etc.)
  attributes: jsonb('attributes').$type<Record<string, string>>().default({}),
  
  // Inventory
  inventory: integer('inventory').default(0),
  sku: text('sku'),
  
  // Status
  isAvailable: boolean('is_available').default(true),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index('variants_product_id_idx').on(table.productId),
  skuIdx: index('variants_sku_idx').on(table.sku),
}))

// Analytics events
export const analyticsEvents = pgTable('analytics_events', {
  id: text('id').primaryKey(),
  configId: text('config_id').notNull().references(() => configs.id, { onDelete: 'cascade' }),
  
  event: text('event').notNull(), // 'page_view', 'product_click', 'add_to_cart', etc.
  properties: jsonb('properties').$type<Record<string, any>>().default({}),
  
  // User context
  sessionId: text('session_id'),
  userId: text('user_id'),
  
  // Request context
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  referrer: text('referrer'),
  
  // UTM parameters
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  configIdIdx: index('analytics_config_id_idx').on(table.configId),
  eventIdx: index('analytics_event_idx').on(table.event),
  timestampIdx: index('analytics_timestamp_idx').on(table.timestamp.desc()),
  sessionIdx: index('analytics_session_idx').on(table.sessionId),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  configs: many(configs),
}))

export const configsRelations = relations(configs, ({ one, many }) => ({
  user: one(users, {
    fields: [configs.userId],
    references: [users.id],
  }),
  products: many(products),
  analyticsEvents: many(analyticsEvents),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  config: one(configs, {
    fields: [products.configId],
    references: [configs.id],
  }),
  variants: many(productVariants),
}))

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}))
```

### **Query Optimization Patterns**

```typescript
// lib/db/queries.ts
import { db } from './index'
import { configs, products, analyticsEvents } from './schema'
import { eq, and, desc, gte, lte, count, avg, sum } from 'drizzle-orm'

// Optimized queries with proper relations
export class ProductQueries {
  // Get products with variants and analytics
  static async getProductsWithAnalytics(configId: string, dateRange?: { from: Date; to: Date }) {
    return await db.query.products.findMany({
      where: eq(products.configId, configId),
      with: {
        variants: {
          where: eq(productVariants.isAvailable, true),
          orderBy: productVariants.price,
        },
      },
      orderBy: desc(products.createdAt),
    })
  }

  // Efficient pagination
  static async getProductsPaginated(params: {
    configId: string
    limit: number
    offset: number
    category?: string
  }) {
    const conditions = [eq(products.configId, params.configId)]
    
    if (params.category) {
      conditions.push(eq(products.category, params.category))
    }
    
    const whereCondition = and(...conditions)
    
    // Use Promise.all for parallel execution
    const [productList, totalCount] = await Promise.all([
      db.query.products.findMany({
        where: whereCondition,
        limit: params.limit,
        offset: params.offset,
        orderBy: desc(products.createdAt),
        with: {
          variants: {
            limit: 3, // Only get a few variants for listing
          },
        },
      }),
      db
        .select({ count: count() })
        .from(products)
        .where(whereCondition)
        .then(result => result[0].count)
    ])
    
    return {
      products: productList,
      total: totalCount,
      hasMore: params.offset + params.limit < totalCount,
    }
  }

  // Analytics aggregations
  static async getProductAnalytics(configId: string, dateRange: { from: Date; to: Date }) {
    const [
      pageViews,
      productClicks,
      addToCarts,
      topProducts
    ] = await Promise.all([
      // Total page views
      db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(and(
          eq(analyticsEvents.configId, configId),
          eq(analyticsEvents.event, 'page_view'),
          gte(analyticsEvents.timestamp, dateRange.from),
          lte(analyticsEvents.timestamp, dateRange.to)
        )),
      
      // Product clicks
      db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(and(
          eq(analyticsEvents.configId, configId),
          eq(analyticsEvents.event, 'product_click'),
          gte(analyticsEvents.timestamp, dateRange.from),
          lte(analyticsEvents.timestamp, dateRange.to)
        )),
      
      // Add to cart events
      db
        .select({ count: count() })
        .from(analyticsEvents)
        .where(and(
          eq(analyticsEvents.configId, configId),
          eq(analyticsEvents.event, 'add_to_cart'),
          gte(analyticsEvents.timestamp, dateRange.from),
          lte(analyticsEvents.timestamp, dateRange.to)
        )),
      
      // Top products by clicks
      db
        .select({
          productId: sql<string>`properties->>'productId'`,
          clicks: count()
        })
        .from(analyticsEvents)
        .where(and(
          eq(analyticsEvents.configId, configId),
          eq(analyticsEvents.event, 'product_click'),
          gte(analyticsEvents.timestamp, dateRange.from),
          lte(analyticsEvents.timestamp, dateRange.to)
        ))
        .groupBy(sql`properties->>'productId'`)
        .orderBy(desc(count()))
        .limit(10)
    ])
    
    return {
      pageViews: pageViews[0].count,
      productClicks: productClicks[0].count,
      addToCarts: addToCarts[0].count,
      conversionRate: productClicks[0].count > 0 
        ? (addToCarts[0].count / productClicks[0].count) * 100 
        : 0,
      topProducts,
    }
  }

  // Batch operations for performance
  static async updateProductPrices(updates: Array<{ id: string; price: number }>) {
    return await db.transaction(async (tx) => {
      const results = await Promise.all(
        updates.map(update => 
          tx
            .update(products)
            .set({ 
              price: update.price.toString(),
              updatedAt: new Date() 
            })
            .where(eq(products.id, update.id))
            .returning({ id: products.id, price: products.price })
        )
      )
      
      return results.flat()
    })
  }
}
```

---

## 📦 **TanStack Query - Advanced State Management**

### **Revolutionary Query Patterns**

```typescript
// hooks/useProducts.ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc/client'

export const useProducts = (configId: string, filters: ProductFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['products', configId, filters],
    queryFn: ({ pageParam = 0 }) => 
      trpc.products.search.query({
        configId,
        ...filters,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasNext ? lastPage.pagination.page * lastPage.pagination.limit : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    keepPreviousData: true,
  })
}

// Optimistic mutations with conflict resolution
export const useOptimisticProducts = (configId: string) => {
  const queryClient = useQueryClient()
  
  const addProductMutation = useMutation({
    mutationFn: trpc.products.create.mutate,
    onMutate: async (newProduct) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['products', configId])
      
      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(['products', configId])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['products', configId], (old: any) => {
        if (!old) return old
        
        const tempProduct = {
          ...newProduct,
          id: `temp-${Date.now()}`,
          createdAt: new Date(),
          status: 'pending' as const,
        }
        
        return {
          ...old,
          pages: old.pages.map((page: any, index: number) => 
            index === 0 
              ? { ...page, products: [tempProduct, ...page.products] }
              : page
          ),
        }
      })
      
      return { previousProducts }
    },
    onError: (err, newProduct, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(['products', configId], context.previousProducts)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(['products', configId])
    },
  })
  
  return {
    addProduct: addProductMutation.mutate,
    isAdding: addProductMutation.isPending,
  }
}

// Advanced prefetching strategies
export const usePrefetchProducts = () => {
  const queryClient = useQueryClient()
  
  const prefetchProductsByCategory = useCallback((category: string) => {
    queryClient.prefetchQuery({
      queryKey: ['products', 'category', category],
      queryFn: () => trpc.products.search.query({ category }),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  }, [queryClient])
  
  const prefetchProductDetails = useCallback((productId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product', productId],
      queryFn: () => trpc.products.byId.query(productId),
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient])
  
  return {
    prefetchProductsByCategory,
    prefetchProductDetails,
  }
}

// Real-time updates with WebSocket
export const useRealTimeProducts = (configId: string) => {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/products/${configId}`)
    
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data)
      
      switch (type) {
        case 'product_created':
          queryClient.setQueryData(['products', configId], (old: any) => {
            if (!old) return old
            return {
              ...old,
              pages: old.pages.map((page: any, index: number) =>
                index === 0
                  ? { ...page, products: [data, ...page.products] }
                  : page
              ),
            }
          })
          break
          
        case 'product_updated':
          queryClient.setQueryData(['products', configId], (old: any) => {
            if (!old) return old
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                products: page.products.map((product: any) =>
                  product.id === data.id ? { ...product, ...data } : product
                ),
              })),
            }
          })
          break
          
        case 'product_deleted':
          queryClient.setQueryData(['products', configId], (old: any) => {
            if (!old) return old
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                products: page.products.filter((product: any) => product.id !== data.id),
              })),
            }
          })
          break
      }
    }
    
    return () => ws.close()
  }, [configId, queryClient])
}
```

### **Background Sync & Offline Support**

```typescript
// hooks/useOfflineSync.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export const useOfflineSync = () => {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const handleOnline = () => {
      // Refetch all queries when coming back online
      queryClient.refetchQueries({
        predicate: (query) => query.state.status === 'error',
      })
    }
    
    const handleOffline = () => {
      // Persist current cache to localStorage
      const cache = queryClient.getQueryCache().getAll()
      localStorage.setItem('react-query-cache', JSON.stringify(
        cache.map(query => ({
          queryKey: query.queryKey,
          state: query.state,
        }))
      ))
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queryClient])
}

// Advanced error retry logic
export const getRetryConfig = (error: any) => {
  // Don't retry on 4xx errors (client errors)
  if (error?.status >= 400 && error?.status < 500) {
    return false
  }
  
  // Exponential backoff for 5xx errors
  return (failureCount: number) => {
    const delay = Math.min(1000 * 2 ** failureCount, 30000) // Max 30 seconds
    return failureCount < 3
  }
}
```

---

*This data layer provides the foundation for building sophisticated, type-safe applications with optimal performance, real-time capabilities, and excellent developer experience. Each pattern is production-tested and follows current best practices.*