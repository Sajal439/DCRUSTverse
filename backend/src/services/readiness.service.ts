import type { Database, MigrationRecord, ReadinessCheck } from '../types/database.ts';
import { loadMigrations } from '../database/migrations.ts';

export function createReadinessCheck(database: Database | undefined): ReadinessCheck {
  // Read checked-in migrations once, keeping request handling independent of filesystem I/O.
  let expected: Awaited<ReturnType<typeof loadMigrations>> | undefined;
  return async () => {
    if (!database) throw new Error('Database is not configured');
    expected ??= await loadMigrations();
    const applied = await database.pool.query<MigrationRecord>('SELECT name, checksum FROM schema_migrations ORDER BY name');
    if (applied.rows.length !== expected.length || applied.rows.some((row, index) =>
      row.name !== expected![index]!.name || row.checksum !== expected![index]!.checksum)) {
      throw new Error('Database migrations are not current');
    }
  };
}
