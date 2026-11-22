import type { Pool } from 'pg';

export interface Database {
  pool: Pool;
  close(): Promise<void>;
}
export type ReadinessCheck = () => Promise<void>;
export interface MigrationRecord {
  name: string;
  checksum: string;
}
