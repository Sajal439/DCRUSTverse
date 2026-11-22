import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import type { Logger } from '../src/types/logger.ts';
import { loadConfig } from '../src/config/env.ts';

const silent: Logger = { info() {}, error() {} };
const app = createApp(loadConfig({ NODE_ENV: 'test' }), silent);

test('health returns service status, request ID and security headers', async () => {
  const response = await request(app).get('/api/v1/health').expect(200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.service, 'dcrustverse-api');
  assert.ok(!Number.isNaN(Date.parse(response.body.timestamp)));
  assert.match(response.headers['x-request-id'], /^[0-9a-f-]{36}$/);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-powered-by'], undefined);
});

test('unknown routes use the common error envelope', async () => {
  const response = await request(app).get('/missing').expect(404);
  assert.equal(response.body.error.code, 'NOT_FOUND');
  assert.equal(response.body.error.requestId, response.headers['x-request-id']);
});

test('malformed JSON returns a safe 400 without echoing submitted data', async () => {
  const response = await request(app).post('/missing').set('Content-Type', 'application/json').send('{"secret":').expect(400);
  assert.equal(response.body.error.code, 'INVALID_JSON');
  assert.ok(!JSON.stringify(response.body).includes('secret'));
});

test('oversized JSON is rejected', async () => {
  const response = await request(app).post('/missing').send({ value: 'x'.repeat(110_000) }).expect(413);
  assert.equal(response.body.error.code, 'PAYLOAD_TOO_LARGE');
});

test('unsupported charset uses a safe error response', async () => {
  const response = await request(app).post('/missing').set('Content-Type', 'application/json; charset=iso-8859-1').send('{}').expect(415);
  assert.equal(response.body.error.code, 'UNSUPPORTED_ENCODING');
});

test('CORS allows only the configured browser origin', async () => {
  const allowed = await request(app).options('/api/v1/health').set('Origin', 'http://localhost:3000').set('Access-Control-Request-Method', 'GET').expect(204);
  assert.equal(allowed.headers['access-control-allow-origin'], 'http://localhost:3000');
  const other = await request(app).get('/api/v1/health').set('Origin', 'https://other.example');
  assert.notEqual(other.headers['access-control-allow-origin'], 'https://other.example');
});

test('request logs omit query strings and credentials', async () => {
  const records: Record<string, unknown>[] = [];
  const logged = createApp(loadConfig({}), { info: r => records.push(r), error: r => records.push(r) });
  await request(logged).get('/api/v1/health?token=private-value').set('Authorization', 'Bearer private-value');
  assert.equal(records.length, 1);
  assert.ok(!JSON.stringify(records).includes('private-value'));
});

test('configuration accepts defaults and rejects invalid settings', () => {
  assert.equal(loadConfig({}).PORT, 4000);
  for (const PORT of ['0', '-1', '65536', 'abc', '2.5', '']) assert.throws(() => loadConfig({ PORT }), /PORT/);
  assert.throws(() => loadConfig({ NODE_ENV: 'invalid' }), /NODE_ENV/);
  assert.throws(() => loadConfig({ CORS_ORIGIN: 'https://example.com/path' }), /CORS_ORIGIN/);
  assert.throws(() => loadConfig({ CORS_ORIGIN: 'file:///tmp' }), /CORS_ORIGIN/);
});
