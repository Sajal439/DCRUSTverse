import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import type { PoolClient } from 'pg';
import type { MigrationRecord } from '../types/database.ts';

// Both src/database and dist/database resolve to the same checked-in SQL directory.
const migrationDirectory = new URL('../../migrations/', import.meta.url);

export async function loadMigrations() {
  const names = (await readdir(migrationDirectory)).filter(name => /^\d{3}_[a-z0-9_]+\.sql$/.test(name)).sort();
  if (!names.length) throw new Error('No database migrations found');
  return Promise.all(names.map(async name => {
    const sql = await readFile(new URL(name, migrationDirectory), 'utf8');
    // Normalize checkout line endings so Windows and Linux compute the same checksum.
    const checksum = createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex');
    return { name, sql, checksum };
  }));
}

export async function migrate(client: PoolClient): Promise<string[]> {
  const migrations = await loadMigrations();
  await client.query('BEGIN');
  try {
    // Transaction-scoped lock serializes concurrent migration processes.
    await client.query('SELECT pg_advisory_xact_lock(742130, 1)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const applied = await client.query<MigrationRecord>('SELECT name, checksum FROM schema_migrations ORDER BY name');
    for (const [index, record] of applied.rows.entries()) {
      const expected = migrations[index];
      if (!expected || expected.name !== record.name || expected.checksum !== record.checksum) {
        throw new Error('Applied migration history differs from checked-in migrations');
      }
    }
    const pending = migrations.slice(applied.rows.length);
    for (const migration of pending) {
      await client.query(migration.sql);
      await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [migration.name, migration.checksum]);
    }
    await client.query('COMMIT');
    return pending.map(migration => migration.name);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
