// Regression coverage written for the submission pass. Do not execute without user authorization.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response, RequestHandler } from 'express';
import { getTicket, updateTicketStatus, addComment } from '../src/modules/tickets/controllers/tickets.controller.ts';
import { markNotificationRead } from '../src/modules/notices/controllers/notices.controller.ts';
import { issueDigitalId } from '../src/modules/digital-id/controllers/digital-id.controller.ts';
import { listSectionRoster } from '../src/modules/academics/controllers/roster.controller.ts';
import type { TicketsRepository } from '../src/types/tickets.ts';
import type { NoticesRepository } from '../src/types/notices.ts';
import type { DigitalIdRepository } from '../src/types/digital-id.ts';
import type { AcademicsRepository } from '../src/types/academics.ts';
import type { CampusUserRepository } from '../src/types/user-repository.ts';

const student = { id: 'student-a', departmentId: null, roles: [{ role: 'student', scopeType: 'global' }] };
async function invoke(handler: RequestHandler, body = {}, params = {}, actor: unknown = student) {
  let output: unknown;
  const response = { locals: { campusUser: actor }, json(value: unknown) { output = value; return response; }, status() { return response; } };
  await handler({ body, params } as unknown as Request, response as unknown as Response, () => {});
  return output;
}
const rejectsWith = (code: string) => (error: unknown) => error instanceof Error && 'code' in error && error.code === code;

test('a student cannot change or read another student ticket', async () => {
  let writes = 0;
  const repo = { getTicketById: async () => ({ id: 'ticket', creatorId: 'student-b', status: 'resolved', isSensitive: false }), updateStatus: async () => { writes++; } } as unknown as TicketsRepository;
  await assert.rejects(invoke(getTicket(repo), {}, { id: 'ticket' }), rejectsWith('FORBIDDEN'));
  await assert.rejects(invoke(updateTicketStatus(repo), { status: 'reopened' }, { id: 'ticket' }), rejectsWith('FORBIDDEN'));
  assert.equal(writes, 0);
});
test('ticket creators cannot reopen an already-open ticket', async () => {
  const repo = { getTicketById: async () => ({ id: 'ticket', creatorId: 'student-a', status: 'open', isSensitive: false }) } as unknown as TicketsRepository;
  await assert.rejects(invoke(updateTicketStatus(repo), { status: 'reopened' }, { id: 'ticket' }), rejectsWith('INVALID_TRANSITION'));
});
test('comments cannot be appended to a different student ticket', async () => {
  const repo = { getTicketById: async () => ({ id: 'ticket', creatorId: 'student-b', isSensitive: false }) } as unknown as TicketsRepository;
  await assert.rejects(invoke(addComment(repo), { message: 'Unauthorized comment' }, { id: 'ticket' }), rejectsWith('FORBIDDEN'));
});
test('notification read state is limited to the current recipient', async () => {
  let writes = 0;
  const repo = { listNotifications: async () => [{ id: 'owned-notification' }], markNotificationRead: async () => { writes++; return true; } } as unknown as NoticesRepository;
  await assert.rejects(invoke(markNotificationRead(repo), {}, { id: 'someone-elses-notification' }), rejectsWith('NOT_FOUND'));
  assert.equal(writes, 0);
  await invoke(markNotificationRead(repo), {}, { id: 'owned-notification' });
  assert.equal(writes, 1);
});
test('a revoked digital ID cannot be restored through self renewal', async () => {
  let issued = false;
  const repo = { getCredentialForUser: async () => ({ status: 'revoked' }), issueCredential: async () => { issued = true; } } as unknown as DigitalIdRepository;
  await assert.rejects(invoke(issueDigitalId(repo)), rejectsWith('CREDENTIAL_REVOKED'));
  assert.equal(issued, false);
});
test('unassigned faculty cannot retrieve a class roster', async () => {
  const repo = { getSectionById: async () => ({ id: 'section', courseId: 'course' }), listTeachingAssignments: async () => [] } as unknown as AcademicsRepository;
  await assert.rejects(invoke(listSectionRoster(repo, {} as CampusUserRepository), {}, { sectionId: 'section' }, { id: 'faculty', departmentId: null, roles: [{ role: 'faculty', scopeType: 'global' }] }), rejectsWith('FORBIDDEN'));
});
