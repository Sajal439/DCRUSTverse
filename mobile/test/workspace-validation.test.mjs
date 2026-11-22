// Written for Node's test runner. Not executed as part of this implementation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formSchema } from '../src/schemas/workspace.ts';
import { registrationSchema } from '../src/schemas/auth.ts';
import { qrLookupPath } from '../src/schemas/qr.ts';

test('required numeric form input cannot silently become zero', () => {
  const schema = formSchema([{ key: 'marks', label: 'Marks', kind: 'number', required: true, min: 0 }]);
  assert.equal(schema.safeParse({ marks: '' }).success, false);
  assert.deepEqual(schema.parse({ marks: '0' }), { marks: 0 });
});
test('CGPA is validated on the user scale and converted to the server scale', () => {
  const schema = formSchema([{ key: 'cgpa', label: 'CGPA', kind: 'number', min: 0, max: 10, scale: 100, required: true }]);
  assert.deepEqual(schema.parse({ cgpa: '7.85' }), { cgpa: 785 });
  assert.equal(schema.safeParse({ cgpa: '785' }).success, false);
});
test('reversed booking dates fail before a request is sent', () => {
  const schema = formSchema(['startTime', 'endTime'].map(key => ({ key, label: key, kind: 'datetime', required: true })));
  assert.equal(schema.safeParse({ startTime: '2026-11-23T12:00+05:30', endTime: '2026-11-23T11:00+05:30' }).success, false);
  assert.equal(schema.parse({ startTime: '2026-11-23T10:00+05:30', endTime: '2026-11-23T11:00+05:30' }).startTime, '2026-11-23T04:30:00.000Z');
});
test('reference fields require an actual record ID, not a visible label', () => {
  const schema = formSchema([{ key: 'sectionId', label: 'Section', kind: 'reference', required: true }]);
  assert.equal(schema.safeParse({ sectionId: 'DEMO-A' }).success, false);
});
test('optional blank fields are omitted while required lists cannot be empty', () => {
  const schema = formSchema([{ key: 'phone', label: 'Phone', min: 7 }, { key: 'branches', label: 'Branches', kind: 'list', required: true }]);
  assert.equal(schema.parse({ phone: '', branches: 'CSE, ECE' }).phone, undefined);
  assert.equal(schema.safeParse({ branches: ', ,' }).success, false);
});
test('registration rejects invalid addresses and weak short passwords', () => {
  assert.equal(registrationSchema.safeParse({ email: 'not-an-email', password: 'long-password' }).success, false);
  assert.equal(registrationSchema.safeParse({ email: 'student@example.org', password: 'short' }).success, false);
});
test('QR scans only address known campus lookup paths, never arbitrary URLs', () => {
  assert.throws(() => qrLookupPath('https://example.org/collect?token=secret'));
  assert.equal(qrLookupPath('a'.repeat(48)), `/digital-id/verify/${'a'.repeat(48)}`);
  assert.equal(qrLookupPath(`dcrust_loc_${'b'.repeat(24)}`), `/campus/qr/scan/dcrust_loc_${'b'.repeat(24)}`);
});
