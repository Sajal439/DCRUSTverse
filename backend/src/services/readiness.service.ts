import type { Database, ReadinessCheck } from '../types/database.ts';
import { readAppliedMigrations, verifyMigrationHistory } from '../database/migrations.ts';

export function createReadinessCheck(database: Database | undefined): ReadinessCheck {
  return async () => {
    if (!database) throw new Error('Database is not configured');
    const applied = await readAppliedMigrations(database.pool);
    if (!verifyMigrationHistory(applied)) throw new Error('Database migrations are not current');
  };
}
