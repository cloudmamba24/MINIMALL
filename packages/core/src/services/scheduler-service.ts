import { db, configVersions } from "@minimall/db";
import { and, eq, lte, isNull, or } from "drizzle-orm";
import type { Tile } from "../types/tiles";

export interface ScheduledContent {
  id: string;
  tileId: string;
  action: "publish" | "unpublish" | "update";
  scheduledFor: Date;
  payload?: Partial<Tile>;
  status: "pending" | "processing" | "completed" | "failed";
  retryCount: number;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
}

export class SchedulerService {
  private static instance: SchedulerService;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Start the scheduler (should be called on app startup)
   */
  startScheduler(intervalMs: number = 60000) {
    // Process every minute by default
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processScheduledContent();
    }, intervalMs);

    // Process immediately on start
    this.processScheduledContent();
  }

  /**
   * Stop the scheduler
   */
  stopScheduler() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Schedule content for publishing
   */
  async schedulePublish(tileId: string, scheduledFor: Date, configId: string) {
    try {
      // Create a scheduled version
      if (!db) throw new Error("Database not available");
      const result = await db.insert(configVersions).values({
        configId,
        version: `scheduled-${Date.now()}`,
        data: {
          action: "publish",
          tileId,
          scheduledFor: scheduledFor.toISOString(),
        },
        isPublished: false,
        createdBy: "scheduler",
        scheduledAt: scheduledFor,
      }).returning();

      return {
        success: true,
        scheduledVersion: result[0],
      };
    } catch (error) {
      console.error("Failed to schedule publish:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Schedule content for unpublishing
   */
  async scheduleUnpublish(tileId: string, scheduledFor: Date, configId: string) {
    try {
      if (!db) throw new Error("Database not available");
      const result = await db.insert(configVersions).values({
        configId,
        version: `scheduled-unpublish-${Date.now()}`,
        data: {
          action: "unpublish",
          tileId,
          scheduledFor: scheduledFor.toISOString(),
        },
        isPublished: false,
        createdBy: "scheduler",
        scheduledAt: scheduledFor,
      }).returning();

      return {
        success: true,
        scheduledVersion: result[0],
      };
    } catch (error) {
      console.error("Failed to schedule unpublish:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Cancel a scheduled action
   */
  async cancelScheduled(scheduledVersionId: string) {
    try {
      if (!db) throw new Error("Database not available");
      await db.delete(configVersions).where(
        and(
          eq(configVersions.id, scheduledVersionId),
          eq(configVersions.isPublished, false)
        )
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to cancel scheduled action:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all scheduled content for a config
   */
  async getScheduledContent(configId: string) {
    try {
      if (!db) throw new Error("Database not available");
      const scheduled = await db
        .select()
        .from(configVersions)
        .where(
          and(
            eq(configVersions.configId, configId),
            eq(configVersions.isPublished, false),
            isNull(configVersions.publishedAt)
          )
        )
        .orderBy(configVersions.scheduledAt);

      return scheduled.filter(v => v.scheduledAt);
    } catch (error) {
      console.error("Failed to get scheduled content:", error);
      return [];
    }
  }

  /**
   * Process scheduled content (called by interval)
   */
  private async processScheduledContent() {
    const now = new Date();

    try {
      // Find all scheduled content that should be processed
      if (!db) throw new Error("Database not available");
      const due = await db
        .select()
        .from(configVersions)
        .where(
          and(
            eq(configVersions.isPublished, false),
            lte(configVersions.scheduledAt, now),
            isNull(configVersions.publishedAt)
          )
        );

      for (const version of due) {
        await this.processScheduledVersion(version);
      }
    } catch (error) {
      console.error("Failed to process scheduled content:", error);
    }
  }

  /**
   * Process a single scheduled version
   */
  private async processScheduledVersion(version: any) {
    try {
      const data = version.data as any;
      
      if (!data.action || !data.tileId) {
        throw new Error("Invalid scheduled data");
      }

      // Here you would implement the actual publish/unpublish logic
      // For now, we'll just mark it as published
      
      switch (data.action) {
        case "publish":
          // TODO: Actually publish the tile
          console.log(`Publishing tile ${data.tileId}`);
          break;
          
        case "unpublish":
          // TODO: Actually unpublish the tile
          console.log(`Unpublishing tile ${data.tileId}`);
          break;
          
        case "update":
          // TODO: Update the tile with new data
          console.log(`Updating tile ${data.tileId}`);
          break;
      }

      // Mark as published
      if (!db) throw new Error("Database not available");
      await db
        .update(configVersions)
        .set({
          isPublished: true,
          publishedAt: new Date(),
        })
        .where(eq(configVersions.id, version.id));

    } catch (error) {
      console.error(`Failed to process scheduled version ${version.id}:`, error);
      
      // You might want to implement retry logic here
      // For now, we'll just log the error
    }
  }

  /**
   * Get upcoming scheduled content (next 7 days)
   */
  async getUpcomingScheduled(configId: string, days: number = 7) {
    const future = new Date();
    future.setDate(future.getDate() + days);

    try {
      if (!db) throw new Error("Database not available");
      const upcoming = await db
        .select()
        .from(configVersions)
        .where(
          and(
            eq(configVersions.configId, configId),
            eq(configVersions.isPublished, false),
            lte(configVersions.scheduledAt, future)
          )
        )
        .orderBy(configVersions.scheduledAt);

      return upcoming;
    } catch (error) {
      console.error("Failed to get upcoming scheduled content:", error);
      return [];
    }
  }
}

export const schedulerService = SchedulerService.getInstance();