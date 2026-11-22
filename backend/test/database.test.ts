import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config/env.ts';
import { migrate, readAppliedMigrations, verifyMigrationHistory } from '../src/database/migrations.ts';

import type { Logger } from '../src/types/logger.ts';

const silent: Logger = { info() {}, error() {} };

test('readiness reports missing database while liveness remains available', async () => {
  const app = createApp(loadConfig({}), silent);
  await request(app).get('/api/v1/health').expect(200);
  const response = await request(app).get('/api/v1/ready').expect(503);
  assert.equal(response.body.error.code, 'NOT_READY');
  assert.equal(response.body.error.requestId, response.headers['x-request-id']);
});

test('readiness succeeds after a successful dependency check', async () => {
  const app = createApp(loadConfig({}), silent, async () => {});
  const response = await request(app).get('/api/v1/ready').expect(200);
  assert.equal(response.body.status, 'ready');
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('readiness never reveals database credentials or errors', async () => {
  const app = createApp(loadConfig({}), silent, async () => {
    throw new Error('postgresql://user:private-password@host/database');
  });
  const response = await request(app).get('/api/v1/ready').expect(503);
  assert.ok(!JSON.stringify(response.body).includes('private-password'));
});

test('database configuration rejects invalid URLs and pool limits', () => {
  assert.throws(() => loadConfig({ DATABASE_URL: 'https://example.com/db' }), /DATABASE_URL/);
  assert.throws(() => loadConfig({ DATABASE_POOL_SIZE: '0' }), /DATABASE_POOL_SIZE/);
  assert.throws(() => loadConfig({ DATABASE_POOL_SIZE: '1.5' }), /DATABASE_POOL_SIZE/);
  assert.equal(loadConfig({ DATABASE_URL: 'postgresql://localhost/campus' }).DATABASE_POOL_SIZE, 10);
});

test('PostgreSQL migrations are repeatable and enforce identity constraints', {
  skip: !process.env.TEST_DATABASE_URL,
}, async () => {
  // This manually run test applies migrations to a dedicated disposable database.
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const client = await pool.connect();
  try {
    await migrate(client);
    const before = await readAppliedMigrations(client);
    await migrate(client);
    assert.deepEqual(await readAppliedMigrations(client), before);
    assert.ok(verifyMigrationHistory(before));
    await client.query('BEGIN');
    try {
      const email = `${randomUUID()}@example.test`;
      const insert = "INSERT INTO users (auth_user_id, email, display_name) VALUES ($1, $2, 'Demo')";
      await client.query(insert, [randomUUID(), email]);
      await client.query('SAVEPOINT duplicate_email');
      await assert.rejects(client.query(insert, [randomUUID(), email]), { code: '23505' });
      await client.query('ROLLBACK TO SAVEPOINT duplicate_email');
      await client.query('SAVEPOINT invalid_email');
      await assert.rejects(client.query(insert, [randomUUID(), 'Student@example.test']), { code: '23514' });
      await client.query('ROLLBACK TO SAVEPOINT invalid_email');
      await client.query("UPDATE drizzle.__drizzle_migrations SET hash = 'changed'");
      const changed = await readAppliedMigrations(client);
      assert.throws(() => verifyMigrationHistory(changed), /history differs/);
    } finally {
      await client.query('ROLLBACK');
    }
  } finally {
    client.release();
    await pool.end();
  }
});
