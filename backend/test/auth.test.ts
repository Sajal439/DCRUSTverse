import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config/env.ts';
import { HttpError } from '../src/lib/http-error.ts';
import { createVerifyIdentity } from '../src/modules/auth/services/auth.service.ts';
import type { Logger } from '../src/types/logger.ts';

const silent: Logger = { info() {}, error() {} };
const identity = { id: '6f9274d6-9b8b-4bc0-9b77-cf4d7004f9ab', email: 'student@example.test' };

test('missing or malformed authorization is rejected before verification', async () => {
  let calls = 0;
  const app = createApp(loadConfig({}), silent, undefined, async () => {
    calls++;
    return identity;
  });
  await request(app).get('/api/v1/auth/me').expect(401);
  await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer a!b!c').expect(401);
  assert.equal(calls, 0);
});

test('identity endpoint returns only the verified identity', async () => {
  const app = createApp(loadConfig({}), silent, undefined, async token => {
    assert.equal(token, 'header.payload.signature');
    return identity;
  });
  const response = await request(app).get('/api/v1/auth/me')
    .set('Authorization', 'Bearer header.payload.signature').expect(200);
  assert.deepEqual(response.body, { data: identity });
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('invalid tokens produce a safe 401 response', async () => {
  const app = createApp(loadConfig({}), silent, undefined, async () => {
    throw new HttpError(401, 'INVALID_TOKEN', 'A valid access token is required');
  });
  const response = await request(app).get('/api/v1/auth/me')
    .set('Authorization', 'Bearer header.payload.signature').expect(401);
  assert.equal(response.body.error.code, 'INVALID_TOKEN');
  assert.ok(response.body.error.requestId);
});

test('unconfigured authentication fails closed', async () => {
  const app = createApp(loadConfig({}), silent);
  await request(app).get('/api/v1/auth/me')
    .set('Authorization', 'Bearer header.payload.signature').expect(503);
});

test('Supabase verification requires a confirmed non-anonymous email identity', async () => {
  for (const user of [
    { ...identity, email_confirmed_at: null, is_anonymous: false },
    { ...identity, email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: true },
  ]) {
    const client = createClient('https://example.supabase.co', 'publishable-test-key', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: async () => Response.json(user) },
    });
    await assert.rejects(createVerifyIdentity(client)('header.payload.signature'), { status: 403 });
  }
});

test('Supabase outage produces a service error without upstream details', async () => {
  const client = createClient('https://example.supabase.co', 'publishable-test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async () => { throw new Error('private upstream details'); } },
  });
  await assert.rejects(createVerifyIdentity(client)('header.payload.signature'), {
    status: 503, message: 'Authentication is unavailable',
  });
});
