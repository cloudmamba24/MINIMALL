import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { connect } from '@planetscale/database';
import { Pool, neon } from '@neondatabase/serverless';
import postgres from 'postgres';

import * as schema from './schema';

// Database connection based on environment
export function createDatabase(databaseUrl: string) {
  const url = new URL(databaseUrl);
  
  // PlanetScale connection
  if (url.hostname.includes('planetscale') || url.hostname.includes('pscale')) {
    const connection = connect({
      url: databaseUrl,
    });
    
    return drizzle(connection, { schema });
  }
  
  // Neon connection
  if (url.hostname.includes('neon')) {
    const sql = neon(databaseUrl);
    return drizzleNeon(sql, { schema });
  }
  
  // Standard PostgreSQL connection
  const client = postgres(databaseUrl);
  return drizzlePostgres(client, { schema });
}

// Export the database instance
export const db = createDatabase(process.env.DATABASE_URL || '');

// Export all schema
export * from './schema';
export { schema };

// Export types
export type Database = ReturnType<typeof createDatabase>;