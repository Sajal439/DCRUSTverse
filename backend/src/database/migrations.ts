import { fileURLToPath } from 'node:url';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { migrate as applyDrizzleMigrations } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { PoolClient } from 'pg';
import type { MigrationRecord } from '../types/database.ts';

export const migrationConfig = {
  migrationsFolder: fileURLToPath(new URL('../../drizzle/', import.meta.url)),
};

export function loadMigrations() {
  return readMigrationFiles(migrationConfig);
}

export async function readAppliedMigrations(client: Pick<PoolClient, 'query'>) {
  const table = await client.query("SELECT to_regclass('drizzle.__drizzle_migrations') AS relation");
  if (!table.rows[0]?.relation) return [];
  const result = await client.query<MigrationRecord>(
    'SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id',
  );
  return result.rows;
}

export function verifyMigrationHistory(applied: MigrationRecord[]) {
  const expected = loadMigrations();
  for (const [index, record] of applied.entries()) {
    const migration = expected[index];
    if (!migration || migration.hash !== record.hash || migration.folderMillis !== Number(record.created_at)) {
      throw new Error('Applied migration history differs from checked-in migrations');
    }
  }
  return expected.length === applied.length;
}

export async function migrate(client: PoolClient): Promise<void> {
  await client.query('SELECT pg_advisory_lock(742130, 1)');
  try {
    const legacy = await client.query("SELECT to_regclass('public.schema_migrations') AS relation");
    if (legacy.rows[0]?.relation) {
      throw new Error('Legacy schema detected. Map existing accounts to Supabase identities before baselining Drizzle.');
    }
    verifyMigrationHistory(await readAppliedMigrations(client));
    await applyDrizzleMigrations(drizzle(client), migrationConfig);
  } finally {
    await client.query('SELECT pg_advisory_unlock(742130, 1)');
  }
}
