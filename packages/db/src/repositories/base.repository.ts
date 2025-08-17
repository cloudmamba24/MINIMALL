import { eq, and, or, desc, asc, sql } from 'drizzle-orm';
import { getDatabaseConnection } from '../connection-pool';

/**
 * Base repository with common CRUD operations
 */
export abstract class BaseRepository<T extends Record<string, any>> {
  protected db = getDatabaseConnection();
  
  constructor(protected table: any) {}

  /**
   * Find by ID (if table has an id field)
   */
  async findById(id: string): Promise<T | null> {
    if (!this.table.id) {
      // For tables without id field, use primary key
      const results = await this.db
        .select()
        .from(this.table)
        .limit(1);
      return results[0] as T || null;
    }
    
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
      query = query.where(options.where) as any;
    }
    
    if (options?.orderBy) {
      for (const order of options.orderBy) {
        const column = this.table[order.column];
        if (column) {
          query = (query as any).orderBy(
            order.direction === 'desc' ? desc(column) : asc(column)
          );
        }
      }
    }
    
    if (options?.limit !== undefined) {
      query = (query as any).limit(options.limit);
    }
    
    if (options?.offset !== undefined) {
      query = (query as any).offset(options.offset);
    }
    
    const results = await query;
    return results as T[];
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
      .values(data)
      .returning();
    
    return (result as any)[0] as T;
  }

  /**
   * Create many records
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    const result = await this.db
      .insert(this.table)
      .values(data)
      .returning();
    
    return result as T[];
  }

  /**
   * Update record
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    if (!this.table.id) {
      // For tables without id, update by primary key
      const result = await this.db
        .update(this.table)
        .set(data)
        .returning();
      return result[0] as T || null;
    }
    
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
   * Update many records
   */
  async updateMany(where: any, data: Partial<T>): Promise<number> {
    const result = await this.db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(where);
    
    return (result as any).count || 0;
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<boolean> {
    if (!this.table.id) {
      // For tables without id field
      return false;
    }
    
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id, id));
    
    return ((result as any).count || 0) > 0;
  }

  /**
   * Delete many records
   */
  async deleteMany(where: any): Promise<number> {
    const result = await this.db
      .delete(this.table)
      .where(where);
    
    return (result as any).count || 0;
  }

  /**
   * Count records
   */
  async count(where?: any): Promise<number> {
    let query = this.db
      .select({ count: sql`count(*)` })
      .from(this.table);
    
    if (where) {
      query = query.where(where) as any;
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
   * Run in transaction
   */
  async transaction<R>(
    callback: (tx: typeof this.db) => Promise<R>
  ): Promise<R> {
    return this.db.transaction(async (tx) => {
      const originalDb = this.db;
      this.db = tx as any;
      try {
        return await callback(tx as any);
      } finally {
        this.db = originalDb;
      }
    });
  }

  /**
   * Generate unique ID (override in subclasses if needed)
   */
  protected generateId(): string {
    return crypto.randomUUID();
  }
}