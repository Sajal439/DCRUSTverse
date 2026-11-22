// Written only. Requires a TS-capable test loader; do not run without authorization.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../src/services/csv.ts';
import { recoveryTokens, newPasswordSchema } from '../src/schemas/recovery.ts';

test('CSV preserves commas and newlines inside quoted fields', () => {
  const rows = parseCsv('email,displayName\r\na@example.org,"Doe, Jane"\r\nb@example.org,"Line one\nLine two"');
  assert.equal(rows[0].displayName, 'Doe, Jane'); assert.equal(rows[1].displayName, 'Line one\nLine two');
});
test('CSV rejects missing headers, duplicate headers and unmatched quotes', () => {
  assert.throws(() => parseCsv('email,name\na@example.org,A'));
  assert.throws(() => parseCsv('email,displayName,email\na@example.org,A,a@example.org'));
  assert.throws(() => parseCsv('email,displayName\na@example.org,"A'));
});
test('recovery only accepts the configured app callback and recovery token type', () => {
  assert.throws(() => recoveryTokens('https://example.org/#access_token=a&refresh_token=b&type=recovery'));
  assert.throws(() => recoveryTokens('dcrustverse://auth/recovery#access_token=a&refresh_token=b&type=signup'));
  assert.deepEqual(recoveryTokens('dcrustverse://auth/recovery#access_token=a&refresh_token=b&type=recovery'), { access_token: 'a', refresh_token: 'b' });
});
test('password recovery requires matching strong passwords', () => {
  assert.equal(newPasswordSchema.safeParse({ password: 'short', confirmation: 'short' }).success, false);
  assert.equal(newPasswordSchema.safeParse({ password: 'long-password-123', confirmation: 'different' }).success, false);
});
