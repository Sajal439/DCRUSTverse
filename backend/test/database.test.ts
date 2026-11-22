import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config/env.ts';
import { migrate } from '../src/database/migrations.ts';
import { createReadinessCheck } from '../src/services/readiness.service.ts';
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

test('PostgreSQL migrations are repeatable, enforce constraints and detect history changes', {
  skip: !process.env.TEST_DATABASE_URL,
}, async () => {
  // Use a dedicated test database. Only this randomly named schema is created and removed.
  const schema = 'test_' + randomUUID().replaceAll('-', '');
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
    options: `-c search_path=${schema}`,
  });
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const client = await pool.connect();
    try {
      assert.deepEqual(await migrate(client), ['001_identity.sql']);
      assert.deepEqual(await migrate(client), []);
      const check = createReadinessCheck({ pool, close: () => pool.end() });
      await check();
      const insert = "INSERT INTO users (email, display_name, password_hash) VALUES ($1, 'Demo', 'test-hash')";
      await client.query(insert, ['student@example.test']);
      await assert.rejects(client.query(insert, ['student@example.test']), { code: '23505' });
      await assert.rejects(client.query(insert, ['Student@example.test']), { code: '23514' });
      await assert.rejects(client.query(
        "UPDATE users SET department_id = $1 WHERE email = 'student@example.test'", [randomUUID()],
      ), { code: '23503' });
      await client.query("UPDATE schema_migrations SET checksum = 'changed'");
      await assert.rejects(migrate(client), /history differs/);
      await assert.rejects(check(), /not current/);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
    try {
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await admin.end();
    }
  }
});
