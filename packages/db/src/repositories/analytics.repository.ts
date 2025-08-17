import type { AnalyticsEvent } from "@minimall/types";
import { and, between, eq, sql } from "drizzle-orm";
import { analyticsEvents } from "../schema";
import { BaseRepository } from "./base.repository";

/**
 * Analytics repository
 */
export class AnalyticsRepository extends BaseRepository<AnalyticsEvent> {
  constructor() {
    super(analyticsEvents);
  }

  /**
   * Get events by config
   */
  async getEventsByConfig(
    configId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsEvent[]> {
    let where: any = eq(analyticsEvents.configId, configId);

    if (startDate && endDate) {
      where = and(where, between(analyticsEvents.timestamp, startDate, endDate));
    }

    return this.findAll({ where });
  }

  /**
   * Get event statistics
   */
  async getStatistics(configId: string): Promise<any> {
    return this.db
      .select({
        event: analyticsEvents.event,
        count: sql`count(*)`,
      })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.configId, configId))
      .groupBy(analyticsEvents.event);
  }
}
