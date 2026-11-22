import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import * as tables from '../database/schema.ts';

// Links existing, verified Supabase identities. Never creates passwords or confirms email.
const { values } = parseArgs({ options: {
  'admin-email': { type: 'string' }, 'faculty-email': { type: 'string' },
  'student-email': { type: 'string' }, apply: { type: 'boolean', default: false },
} });
const input = z.object({
  'admin-email': z.email().optional(), 'faculty-email': z.email(), 'student-email': z.email(),
}).parse(values);
const accounts = ([['admin-email', 'administrator'], ['faculty-email', 'faculty'], ['student-email', 'student']] as const).flatMap(([key, role]) => input[key] ? [{ email: input[key]!.trim().toLowerCase(), role }] : []);
const emails = accounts.map(account => account.email);
if (new Set(emails).size !== emails.length) throw new Error('Use different verified accounts for each demonstration role.');
if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL in the backend environment.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
const db = drizzle(pool, { schema: tables });
const fixtureId = (name: string) => {
  const hex = createHash('sha256').update(`dcrustverse-submission-demo-v1:${name}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};
try {
  const identities = await pool.query<{ id: string; email: string; email_confirmed_at: Date | null; raw_user_meta_data: Record<string, unknown> }>(
    'select id, email, email_confirmed_at, raw_user_meta_data from auth.users where lower(email) = any($1::text[])', [emails],
  );
  for (const email of emails) {
    const account = identities.rows.find(row => row.email.toLowerCase() === email);
    if (!account?.email_confirmed_at) throw new Error(`A verified Supabase identity is required for ${email}. Create/verify it in your own Supabase project first.`);
  }
  console.log('Verified identities found for: ' + accounts.map(account => account.role).join(', '));
  if (!values.apply) {
    console.log('Preview only. --apply will link these identities, activate their campus accounts, assign the requested roles, and insert clearly labelled DEMO fixtures in one transaction. Existing fixtures are preserved.');
  } else {
    await db.transaction(async tx => {
      const departmentId = fixtureId('department');
      await tx.insert(tables.departments).values({ id: departmentId, code: 'DEMO-CSE', name: '[DEMO] Computer Engineering' }).onConflictDoNothing();
      const ids: Record<string, string> = {};
      for (const { email, role } of accounts) {
        const identity = identities.rows.find(row => row.email.toLowerCase() === email)!;
        const existing = await tx.query.users.findFirst({ where: eq(tables.users.authUserId, identity.id) });
        if (existing?.status === 'disabled') throw new Error('A selected account is disabled. Review it explicitly before demonstration setup.');
        const userId = existing?.id ?? fixtureId(`user:${identity.id}`);
        ids[role] = userId;
        if (!existing) {
          await tx.insert(tables.users).values({ id: userId, authUserId: identity.id, email: identity.email.toLowerCase(), displayName: String(identity.raw_user_meta_data?.display_name ?? identity.raw_user_meta_data?.full_name ?? `Demo ${role}`), departmentId, status: 'active' });
        } else {
          await tx.update(tables.users).set({ status: 'active', updatedAt: new Date() }).where(eq(tables.users.id, userId));
        }
        await tx.insert(tables.profiles).values({ userId, ...(role === 'student' ? { rollNumber: 'DEMO-STUDENT-01' } : { employeeId: `DEMO-${role.toUpperCase()}` }), bio: 'Submission demonstration account' }).onConflictDoNothing();
        const existingRoles = await tx.select().from(tables.roleAssignments).where(eq(tables.roleAssignments.userId, userId));
        const scopeType = role === 'faculty' ? 'department' : 'global';
        if (!existingRoles.some(assignment => assignment.role === role && assignment.scopeType === scopeType && (scopeType === 'global' || assignment.scopeId === departmentId))) {
          await tx.insert(tables.roleAssignments).values({ userId, role, scopeType, scopeId: scopeType === 'global' ? null : departmentId });
        }
        await tx.insert(tables.auditEvents).values({ actorId: userId, action: 'demonstration.account_linked', targetType: 'user', targetId: userId, details: { role, source: 'setup-demonstration' } });
      }
      const operatorId = ids.administrator ?? ids.faculty!;
      const now = new Date();
      const after = (days: number) => new Date(now.getTime() + days * 86400000);
      const termId = fixtureId('term'), courseId = fixtureId('course'), sectionId = fixtureId('section'), roomId = fixtureId('room');
      await tx.insert(tables.programs).values({ id: fixtureId('program'), departmentId, code: 'DEMO-BTECH', name: '[DEMO] B.Tech Computer Engineering', type: 'undergraduate', totalSemesters: 8 }).onConflictDoNothing();
      await tx.insert(tables.academicTerms).values({ id: termId, code: 'DEMO-TERM', name: '[DEMO] Submission term', startDate: after(-30), endDate: after(60), status: 'active' }).onConflictDoNothing();
      await tx.insert(tables.courses).values({ id: courseId, departmentId, code: 'DEMO-DBMS', name: '[DEMO] Database Management Systems', credits: 4, type: 'core' }).onConflictDoNothing();
      await tx.insert(tables.sections).values({ id: sectionId, courseId, academicTermId: termId, name: 'DEMO-A', capacity: 30 }).onConflictDoNothing();
      await tx.insert(tables.enrollments).values({ id: fixtureId('enrollment'), studentId: ids.student!, sectionId, status: 'enrolled' }).onConflictDoNothing();
      await tx.insert(tables.teachingAssignments).values({ id: fixtureId('teaching'), facultyId: ids.faculty!, sectionId, role: 'primary' }).onConflictDoNothing();
      await tx.insert(tables.rooms).values({ id: roomId, code: 'DEMO-ROOM', name: '[DEMO] Seminar room', building: 'Demonstration block', capacity: 30, type: 'classroom' }).onConflictDoNothing();
      await tx.insert(tables.classSessions).values({ id: fixtureId('session'), sectionId, roomId, facultyId: ids.faculty!, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', status: 'scheduled' }).onConflictDoNothing();
      await tx.insert(tables.assignments).values({ id: fixtureId('assignment'), sectionId, createdBy: ids.faculty!, title: '[DEMO] Explain database normalization', description: 'Submit a short explanation of first, second and third normal forms.', dueDate: after(7), maxMarks: 20, allowLate: true }).onConflictDoNothing();
      await tx.insert(tables.hostels).values({ id: fixtureId('hostel'), name: '[DEMO] Student residence', gender: 'coed', capacity: 4, wardenId: ids.administrator ?? null }).onConflictDoNothing();
      await tx.insert(tables.hostelRooms).values([{ id: fixtureId('hostel-room-1'), hostelId: fixtureId('hostel'), roomNumber: 'D-101', capacity: 2 }, { id: fixtureId('hostel-room-2'), hostelId: fixtureId('hostel'), roomNumber: 'D-102', capacity: 2 }]).onConflictDoNothing();
      await tx.insert(tables.libraryTitles).values({ id: fixtureId('book'), isbn: 'DEMO-DBMS-001', title: '[DEMO] Database Systems', author: 'Demonstration author', category: 'Computer Engineering', totalCopies: 1, availableCopies: 1 }).onConflictDoNothing();
      await tx.insert(tables.bookCopies).values({ id: fixtureId('copy'), titleId: fixtureId('book'), barcode: 'DEMO-BOOK-001', status: 'available' }).onConflictDoNothing();
      await tx.insert(tables.facilities).values({ id: fixtureId('facility'), code: 'DEMO-HALL', name: '[DEMO] Seminar hall', type: 'hall', capacity: 30 }).onConflictDoNothing();
      await tx.insert(tables.clubs).values({ id: fixtureId('club'), code: 'DEMO-CODE', name: '[DEMO] Coding club', description: 'A sample club for the project demonstration.', coordinatorId: operatorId }).onConflictDoNothing();
      await tx.insert(tables.events).values({ id: fixtureId('event'), clubId: fixtureId('club'), title: '[DEMO] Project showcase', description: 'Demonstration event registration workflow.', location: 'Demonstration seminar hall', startTime: after(2), endTime: new Date(after(2).getTime() + 3600000), capacity: 30, status: 'approved', createdBy: operatorId }).onConflictDoNothing();
      await tx.insert(tables.placementOpportunities).values({ id: fixtureId('opportunity'), companyName: '[DEMO] Example employer', title: '[DEMO] Software intern', description: 'Sample opportunity for demonstrating the application workflow; not a real job advertisement.', minCgpa: 600, eligibleBranches: ['CSE'], deadline: after(7), createdBy: operatorId }).onConflictDoNothing();
      await tx.insert(tables.notices).values({ id: fixtureId('notice'), title: '[DEMO] Welcome to the campus demonstration', content: 'Records labelled DEMO are demonstration fixtures. Requests and changes made while signed in are saved to the project database.', publishedBy: operatorId, targetRoles: [] }).onConflictDoNothing();
      await tx.insert(tables.surveys).values({ id: fixtureId('survey'), title: '[DEMO] Campus app feedback', description: 'A sample survey for the submission walkthrough.', startsAt: after(-1), endsAt: after(7), isAnonymous: false, createdBy: operatorId }).onConflictDoNothing();
      await tx.insert(tables.surveyQuestions).values({ id: fixtureId('question'), surveyId: fixtureId('survey'), questionText: 'Which campus service was most useful?', questionType: 'text', options: [] }).onConflictDoNothing();
    });
    console.log('Demonstration accounts and fixtures are ready. No passwords were created or changed.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Demonstration setup failed');
  process.exitCode = 1;
} finally { await pool.end(); }
