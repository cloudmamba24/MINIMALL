import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { createTRPCRouter, publicProcedure, dbProcedure, r2Procedure } from '../trpc';
import { configs, configVersions } from '@minimall/db/schema';
import type { SiteConfig } from '@minimall/core/types';

export const configsRouter = createTRPCRouter({
  // Get config with fallback chain: DB → R2 → Demo
  get: publicProcedure
    .input(z.object({
      configId: z.string(),
      version: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { configId, version } = input;

      // Try database first
      if (ctx.db) {
        try {
          const config = await ctx.db.query.configs.findFirst({
            where: eq(configs.id, configId),
            with: {
              currentVersion: true,
              versions: version ? {
                where: eq(configVersions.version, version),
                limit: 1,
              } : undefined,
            },
          });

          if (config?.currentVersion || config?.versions?.[0]) {
            const versionData = version ? config.versions?.[0] : config.currentVersion;
            return versionData?.data as SiteConfig;
          }
        } catch (error) {
          console.warn('Database config fetch failed:', error);
        }
      }

      // Try R2 storage as fallback
      try {
        const r2Config = await ctx.r2.getConfig(configId, version);
        return r2Config;
      } catch (error) {
        console.warn('R2 config fetch failed:', error);
      }

      // Final fallback to demo data
      const demoConfig = await import('@minimall/core/demo-data').then(m => m.demoSiteConfig);
      return demoConfig;
    }),

  // Save config to both DB and R2
  save: dbProcedure
    .input(z.object({
      configId: z.string(),
      config: z.any(), // SiteConfig schema would be defined in types
      shop: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { configId, config, shop = 'demo' } = input;

      // Create or update config in database
      const existingConfig = await ctx.db.query.configs.findFirst({
        where: eq(configs.id, configId),
      });

      if (!existingConfig) {
        await ctx.db.insert(configs).values({
          id: configId,
          shop,
          slug: configId,
        });
      }

      // Create new version
      const newVersion = await ctx.db.insert(configVersions).values({
        configId,
        version: `v${Date.now()}`,
        data: config,
        isPublished: true,
        createdBy: 'admin',
        publishedAt: new Date(),
      }).returning();

      // Update current version reference
      await ctx.db.update(configs)
        .set({ currentVersionId: newVersion[0].id })
        .where(eq(configs.id, configId));

      // Also save to R2 as backup
      try {
        await ctx.r2.saveConfig(configId, config);
      } catch (r2Error) {
        console.warn('R2 backup failed:', r2Error);
        // Continue without R2 - database is primary
      }

      return { success: true, version: newVersion[0] };
    }),

  // List all configs for a shop
  list: dbProcedure
    .input(z.object({
      shop: z.string(),
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const { shop, limit, offset } = input;

      const configList = await ctx.db.query.configs.findMany({
        where: eq(configs.shop, shop),
        with: {
          currentVersion: {
            columns: {
              version: true,
              isPublished: true,
              publishedAt: true,
            },
          },
        },
        limit,
        offset,
        orderBy: desc(configs.updatedAt),
      });

      return configList;
    }),

  // Get config versions
  versions: dbProcedure
    .input(z.object({
      configId: z.string(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const { configId, limit } = input;

      const versions = await ctx.db.query.configVersions.findMany({
        where: eq(configVersions.configId, configId),
        columns: {
          id: true,
          version: true,
          isPublished: true,
          createdBy: true,
          createdAt: true,
          publishedAt: true,
        },
        limit,
        orderBy: desc(configVersions.createdAt),
      });

      return versions;
    }),

  // Publish a specific version
  publish: dbProcedure
    .input(z.object({
      configId: z.string(),
      versionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { configId, versionId } = input;

      // Unpublish all other versions
      await ctx.db.update(configVersions)
        .set({ isPublished: false })
        .where(eq(configVersions.configId, configId));

      // Publish the selected version
      const publishedVersion = await ctx.db.update(configVersions)
        .set({ 
          isPublished: true,
          publishedAt: new Date(),
        })
        .where(and(
          eq(configVersions.id, versionId),
          eq(configVersions.configId, configId)
        ))
        .returning();

      if (publishedVersion[0]) {
        // Update current version reference
        await ctx.db.update(configs)
          .set({ currentVersionId: versionId })
          .where(eq(configs.id, configId));

        // Update R2 backup
        try {
          await ctx.r2.saveConfig(configId, publishedVersion[0].data as SiteConfig);
        } catch (r2Error) {
          console.warn('R2 backup update failed:', r2Error);
        }
      }

      return { success: true, version: publishedVersion[0] };
    }),
});