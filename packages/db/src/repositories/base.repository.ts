import { eq, and, or, desc, asc, sql } from 'drizzle-orm';
import type { Table } from 'drizzle-orm';
import { getDatabaseConnection } from '../connection-pool';

/**
 * Base repository with common CRUD operations
 */
export abstract class BaseRepository<T extends Record<string, any>> {
  protected db = getDatabaseConnection();
  
  constructor(protected table: Table) {}

  /**
   * Find by ID
   */
  async findById(id: string): Promise<T | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return result[0] as T || null;
  }

  /**
   * Find all with optional filters
   */
  async findAll(options?: {
    where?: any;
    orderBy?: { column: string; direction: 'asc' | 'desc' }[];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    let query = this.db.select().from(this.table);
    
    if (options?.where) {
      query = query.where(options.where);
    }
    
    if (options?.orderBy) {
      for (const order of options.orderBy) {
        const column = this.table[order.column];
        query = query.orderBy(
          order.direction === 'desc' ? desc(column) : asc(column)
        );
      }
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query as T[];
  }

  /**
   * Find one with conditions
   */
  async findOne(where: any): Promise<T | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(where)
      .limit(1);
    
    return result[0] as T || null;
  }

  /**
   * Create new record
   */
  async create(data: Partial<T>): Promise<T> {
    const result = await this.db
      .insert(this.table)
      .values({
        ...data,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0] as T;
  }

  /**
   * Create many records
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    const values = data.map(item => ({
      ...item,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    const result = await this.db
      .insert(this.table)
      .values(values)
      .returning();
    
    return result as T[];
  }

  /**
   * Update by ID
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    const result = await this.db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(this.table.id, id))
      .returning();
    
    return result[0] as T || null;
  }

  /**
   * Update many with conditions
   */
  async updateMany(where: any, data: Partial<T>): Promise<number> {
    const result = await this.db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(where);
    
    return result.rowCount || 0;
  }

  /**
   * Delete by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id, id));
    
    return (result.rowCount || 0) > 0;
  }

  /**
   * Delete many with conditions
   */
  async deleteMany(where: any): Promise<number> {
    const result = await this.db
      .delete(this.table)
      .where(where);
    
    return result.rowCount || 0;
  }

  /**
   * Count records
   */
  async count(where?: any): Promise<number> {
    let query = this.db
      .select({ count: sql`count(*)` })
      .from(this.table);
    
    if (where) {
      query = query.where(where);
    }
    
    const result = await query;
    return Number(result[0]?.count || 0);
  }

  /**
   * Check if exists
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Transaction wrapper
   */
  async transaction<R>(
    callback: (tx: typeof this.db) => Promise<R>
  ): Promise<R> {
    return await this.db.transaction(callback);
  }

  /**
   * Generate unique ID (override for custom ID generation)
   */
  protected generateId(): string {
    return crypto.randomUUID();
  }
}