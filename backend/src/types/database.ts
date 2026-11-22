import type { Pool } from 'pg';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../database/schema.ts';

export interface Database {
  pool: Pool;
  orm: NodePgDatabase<typeof schema>;
  close(): Promise<void>;
}
export type ReadinessCheck = () => Promise<void>;
export interface MigrationRecord {
  hash: string;
  created_at: string;
}
