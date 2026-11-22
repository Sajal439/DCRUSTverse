// Written only. Do not execute without the user's authorization.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateUserImportCsv, sanitizeCsvFormula } from '../src/modules/bulk/services/bulk.service.ts';
import { bulkRowsSchema, executeImportSchema } from '../src/modules/bulk/schemas/bulk.schema.ts';
import { assignRoleSchema } from '../src/modules/auth/schemas/auth.schema.ts';
import { addPathSegmentSchema, routeQuerySchema } from '../src/modules/campus/schemas/campus.schema.ts';
import { triggerSyncSchema } from '../src/modules/integrations/schemas/integrations.schema.ts';
import { validateFileContent } from '../src/modules/files/services/file-validation.ts';
import { reviewDocumentRequestSchema } from '../src/modules/documents/schemas/documents.schema.ts';
import { registerPushTokenSchema } from '../src/modules/client-services/schemas/push.schema.ts';
import { requireDepartmentManager } from '../src/modules/users/services/role-policy.ts';
import { revokeUserRole } from '../src/modules/users/controllers/users.controller.ts';
import type { CampusUserRepository } from '../src/types/user-repository.ts';
import type { CampusUser } from '../src/types/auth.ts';
import type { Request, Response } from 'express';

const id = '11111111-1111-4111-a111-111111111111';
test('bulk import rejects duplicate emails and elevated roles', () => {
  const result = validateUserImportCsv([{ email: 'Student@example.org', displayName: 'A', role: 'student' }, { email: 'student@example.org', displayName: 'B' }, { email: 'admin@example.org', displayName: 'C', role: 'administrator' }]);
  assert.equal(result.validCount, 1); assert.equal(result.errorCount, 2);
});
test('bulk operations reject malformed rows and require explicit confirmation', () => {
  assert.equal(bulkRowsSchema.safeParse({ rows: [null] }).success, false);
  assert.equal(bulkRowsSchema.safeParse({ rows: [{ email: 123 }] }).success, false);
  assert.equal(executeImportSchema.safeParse({ rows: [{ email: 'a@example.org', displayName: 'A' }] }).success, false);
});
test('export neutralizes formulas hidden behind whitespace without changing stored names', () => {
  assert.equal(sanitizeCsvFormula('  =SUM(A1)'), "'  =SUM(A1)");
  assert.equal(sanitizeCsvFormula('Student'), 'Student');
});
test('administrator grants cannot have a misleading department scope', () => {
  assert.equal(assignRoleSchema.safeParse({ role: 'administrator', scopeType: 'department', scopeId: id }).success, false);
  assert.equal(assignRoleSchema.safeParse({ role: 'faculty', scopeType: 'department' }).success, false);
});
test('department management uses assigned scope, not profile department', () => {
  const actor = { departmentId: id, roles: [{ role: 'department_head', scopeType: 'department', scopeId: 'other' }] } as CampusUser;
  assert.throws(() => requireDepartmentManager(actor, id));
  assert.doesNotThrow(() => requireDepartmentManager(actor, 'other'));
});
test('self role removal fails before repository mutation', async () => {
  let writes = 0;
  const repo = { revokeRole: async () => { writes++; } } as unknown as CampusUserRepository;
  const handler = revokeUserRole(repo);
  await assert.rejects(async () => handler({ params: { id, assignmentId: id } } as unknown as Request, { locals: { campusUser: { id, roles: [{ role: 'administrator', scopeType: 'global' }] } } } as unknown as Response, () => {}));
  assert.equal(writes, 0);
});
test('accessibleOnly=false remains false and same-point paths are rejected', () => {
  assert.equal(routeQuerySchema.parse({ from: id, to: id, accessibleOnly: 'false' }).accessibleOnly, false);
  assert.equal(addPathSegmentSchema.safeParse({ fromLocationId: id, toLocationId: id, distanceMeters: 1 }).success, false);
});
test('synchronization rejects empty batches and invalid grade fields', () => {
  assert.equal(triggerSyncSchema.safeParse({ integrationName: 'exam_portal', idempotencyKey: 'example-key', payload: [] }).success, false);
  assert.equal(triggerSyncSchema.safeParse({ integrationName: 'exam_portal', idempotencyKey: 'example-key', payload: [{ submissionId: id, marksObtained: -1 }] }).success, false);
});
test('file validation rejects forged PDF headers and oversized data', () => {
  assert.throws(() => validateFileContent({ name: 'fake.pdf', mimeType: 'application/pdf', contentBase64: Buffer.from('<html>not PDF</html>').toString('base64') }));
  assert.throws(() => validateFileContent({ name: 'large.txt', mimeType: 'text/plain', contentBase64: Buffer.alloc(2 * 1024 * 1024 + 1, 65).toString('base64') }));
  assert.equal(validateFileContent({ name: 'answer.txt', mimeType: 'text/plain', contentBase64: Buffer.from('Answer').toString('base64') }).length, 6);
});
test('issuing a document requires a private uploaded attachment', () => {
  assert.equal(reviewDocumentRequestSchema.safeParse({ status: 'issued' }).success, false);
  assert.equal(reviewDocumentRequestSchema.safeParse({ status: 'issued', issuedFileUrl: 'https://example.org/fake.pdf' }).success, false);
  assert.equal(reviewDocumentRequestSchema.safeParse({ status: 'issued', issuedFileUrl: `campus-file:${id}` }).success, true);
});
test('push registry accepts Expo tokens and rejects arbitrary device strings', () => {
  assert.equal(registerPushTokenSchema.safeParse({ deviceToken: 'some-random-token', platform: 'android' }).success, false);
  assert.equal(registerPushTokenSchema.safeParse({ deviceToken: 'ExpoPushToken[abc123_456]', platform: 'android' }).success, true);
});
