import { eq, and, between, sql } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { analyticsEvents } from '../schema';
import type { AnalyticsEvent } from '@minimall/types';

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
      where = and(
        where,
        between(analyticsEvents.timestamp, startDate, endDate)
      );
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