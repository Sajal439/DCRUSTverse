import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config/env.ts';
import type { Logger } from '../src/types/logger.ts';
import type { CampusUser } from '../src/types/auth.ts';
import type { CampusUserRepository } from '../src/modules/auth/repositories/user.repository.ts';
import type { AcademicsRepository } from '../src/modules/academics/repositories/academics.repository.ts';
import type { TimetableRepository, RoomItem, ClassSessionItem } from '../src/modules/timetable/repositories/timetable.repository.ts';
import type { AttendanceRepository, AttendanceRecordItem, AttendanceCorrectionItem } from '../src/modules/attendance/repositories/attendance.repository.ts';
import type { AssignmentsRepository, AssignmentItem, SubmissionItem, GradeItem } from '../src/modules/assignments/repositories/assignments.repository.ts';
import type { AppointmentsRepository, FacultyAvailabilityItem, AppointmentItem } from '../src/modules/appointments/repositories/appointments.repository.ts';

const silent: Logger = { info() {}, error() {} };

function authVerifier(currentUser?: CampusUser) {
  return async () => {
    if (!currentUser) throw new Error('Unauthenticated');
    return { id: currentUser.authUserId, email: currentUser.email };
  };
}

function createMockTimetableRepo(): TimetableRepository {
  const rms: RoomItem[] = [];
  const sss: ClassSessionItem[] = [];

  return {
    async listRooms() { return [...rms]; },
    async createRoom(data) {
      const item: RoomItem = { id: randomUUID(), ...data, type: data.type ?? 'classroom', createdAt: new Date().toISOString() };
      rms.push(item);
      return item;
    },
    async getRoomById(id) { return rms.find(r => r.id === id) ?? null; },
    async listSessions(filters = {}) {
      return sss.filter(s => {
        if (filters.sectionId && s.sectionId !== filters.sectionId) return false;
        if (filters.roomId && s.roomId !== filters.roomId) return false;
        if (filters.facultyId && s.facultyId !== filters.facultyId) return false;
        if (filters.dayOfWeek && s.dayOfWeek !== filters.dayOfWeek) return false;
        return true;
      });
    },
    async checkRoomConflict(roomId, dayOfWeek, startTime, endTime) {
      return sss.some(s => s.roomId === roomId && s.dayOfWeek === dayOfWeek && s.status === 'scheduled' && s.startTime < endTime && s.endTime > startTime);
    },
    async checkFacultyConflict(facultyId, dayOfWeek, startTime, endTime) {
      return sss.some(s => s.facultyId === facultyId && s.dayOfWeek === dayOfWeek && s.status === 'scheduled' && s.startTime < endTime && s.endTime > startTime);
    },
    async createSession(data) {
      const item: ClassSessionItem = { id: randomUUID(), ...data, status: 'scheduled', createdAt: new Date().toISOString() };
      sss.push(item);
      return item;
    },
    async updateSessionStatus(id, status) {
      const s = sss.find(item => item.id === id);
      if (!s) return null;
      s.status = status;
      return s;
    },
  };
}

function createMockAttendanceRepo(): AttendanceRepository {
  const records: AttendanceRecordItem[] = [];
  const corrections: AttendanceCorrectionItem[] = [];

  return {
    async hasRecordedAttendance(sessionId) {
      return records.some(r => r.sessionId === sessionId);
    },
    async recordSessionAttendance(sessionId, list, recordedBy) {
      const newItems = list.map(item => ({
        id: randomUUID(),
        sessionId,
        studentId: item.studentId,
        status: item.status,
        recordedBy,
        recordedAt: new Date().toISOString(),
      }));
      records.push(...newItems);
      return newItems;
    },
    async listSessionAttendance(sessionId) {
      return records.filter(r => r.sessionId === sessionId);
    },
    async getStudentAttendanceSummary(studentId) {
      const studentRecords = records.filter(r => r.studentId === studentId);
      const total = studentRecords.length;
      const present = studentRecords.filter(r => r.status === 'present').length;
      const absent = studentRecords.filter(r => r.status === 'absent').length;
      const late = studentRecords.filter(r => r.status === 'late').length;
      const excused = studentRecords.filter(r => r.status === 'excused').length;
      const percentage = total > 0 ? Math.round(((present + late + excused) / total) * 1000) / 10 : 0;
      return { studentId, totalSessions: total, present, absent, late, excused, attendancePercentage: percentage };
    },
    async requestCorrection(data) {
      const item: AttendanceCorrectionItem = {
        id: randomUUID(),
        attendanceRecordId: data.attendanceRecordId,
        studentId: data.studentId,
        requestedStatus: data.requestedStatus,
        reason: data.reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      corrections.push(item);
      return item;
    },
    async listCorrections(filters = {}) {
      return corrections.filter(c => {
        if (filters.studentId && c.studentId !== filters.studentId) return false;
        if (filters.status && c.status !== filters.status) return false;
        return true;
      });
    },
    async reviewCorrection(correctionId, action, reviewedBy) {
      const c = corrections.find(item => item.id === correctionId);
      if (!c) return null;
      c.status = action;
      c.reviewedBy = reviewedBy;
      c.reviewedAt = new Date().toISOString();
      if (action === 'approved') {
        const rec = records.find(r => r.id === c.attendanceRecordId);
        if (rec) rec.status = c.requestedStatus;
      }
      return c;
    },
  };
}

function createMockAssignmentsRepo(): AssignmentsRepository {
  const assigns: AssignmentItem[] = [];
  const subs: SubmissionItem[] = [];
  const gradesList: GradeItem[] = [];
  const publishedSections = new Set<string>();

  return {
    async createAssignment(data) {
      const item: AssignmentItem = {
        id: randomUUID(),
        sectionId: data.sectionId,
        createdBy: data.createdBy,
        title: data.title,
        description: data.description ?? null,
        dueDate: data.dueDate.toISOString(),
        maxMarks: data.maxMarks ?? 100,
        allowLate: data.allowLate ?? true,
        createdAt: new Date().toISOString(),
      };
      assigns.push(item);
      return item;
    },
    async getAssignmentById(id) {
      return assigns.find(a => a.id === id) ?? null;
    },
    async listAssignments(sectionId) {
      return assigns.filter(a => a.sectionId === sectionId);
    },
    async submitAssignment(data) {
      const item: SubmissionItem = {
        id: randomUUID(),
        assignmentId: data.assignmentId,
        studentId: data.studentId,
        content: data.content ?? null,
        fileUrl: data.fileUrl ?? null,
        isLate: data.isLate,
        submittedAt: new Date().toISOString(),
        grade: null,
      };
      subs.push(item);
      return item;
    },
    async getSubmission(assignmentId, studentId) {
      const s = subs.find(item => item.assignmentId === assignmentId && item.studentId === studentId);
      if (!s) return null;
      const g = gradesList.find(item => item.submissionId === s.id);
      return { ...s, grade: g ?? null };
    },
    async listSubmissions(assignmentId) {
      return subs
        .filter(item => item.assignmentId === assignmentId)
        .map(s => {
          const g = gradesList.find(item => item.submissionId === s.id);
          return { ...s, grade: g ?? null };
        });
    },
    async gradeSubmission(data) {
      const item: GradeItem = {
        id: randomUUID(),
        submissionId: data.submissionId,
        marksObtained: data.marksObtained,
        feedback: data.feedback ?? null,
        gradedBy: data.gradedBy,
        gradedAt: new Date().toISOString(),
      };
      gradesList.push(item);
      return item;
    },
    async publishResults(sectionId) {
      publishedSections.add(sectionId);
      return true;
    },
    async isResultsPublished(sectionId) {
      return publishedSections.has(sectionId);
    },
    async getStudentResults(studentId, sectionId) {
      const isPublished = publishedSections.has(sectionId);
      const sectionAssignments = assigns.filter(a => a.sectionId === sectionId);
      const results = sectionAssignments.map(a => {
        const sub = subs.find(s => s.assignmentId === a.id && s.studentId === studentId);
        const g = sub ? gradesList.find(item => item.submissionId === sub.id) : null;
        return {
          assignmentTitle: a.title,
          maxMarks: a.maxMarks,
          marksObtained: isPublished ? (g?.marksObtained ?? null) : null,
          feedback: isPublished ? (g?.feedback ?? null) : null,
        };
      });
      return { isPublished, results };
    },
  };
}

function createMockAppointmentsRepo(): AppointmentsRepository {
  const availabilities: FacultyAvailabilityItem[] = [];
  const appts: AppointmentItem[] = [];

  return {
    async setAvailability(data) {
      const item: FacultyAvailabilityItem = { id: randomUUID(), ...data, createdAt: new Date().toISOString() };
      availabilities.push(item);
      return item;
    },
    async getFacultyAvailabilities(facultyId) {
      return availabilities.filter(a => a.facultyId === facultyId);
    },
    async hasOverlappingConfirmedAppointment(facultyId, startTime, endTime) {
      return appts.some(a => a.facultyId === facultyId && a.status === 'confirmed' && new Date(a.startTime) < endTime && new Date(a.endTime) > startTime);
    },
    async requestAppointment(data) {
      const item: AppointmentItem = {
        id: randomUUID(),
        facultyId: data.facultyId,
        studentId: data.studentId,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        status: 'pending',
        reason: data.reason,
        createdAt: new Date().toISOString(),
      };
      appts.push(item);
      return item;
    },
    async listAppointments(filters = {}) {
      return appts.filter(a => {
        if (filters.facultyId && a.facultyId !== filters.facultyId) return false;
        if (filters.studentId && a.studentId !== filters.studentId) return false;
        if (filters.status && a.status !== filters.status) return false;
        return true;
      });
    },
    async updateAppointmentStatus(id, status, notes) {
      const a = appts.find(item => item.id === id);
      if (!a) return null;
      a.status = status;
      if (notes) a.notes = notes;
      return a;
    },
  };
}

const facultyId = randomUUID();
const studentId = randomUUID();
const adminId = randomUUID();
const sectionId = randomUUID();

const facultyUser: CampusUser = {
  id: facultyId,
  authUserId: 'auth-fac-1',
  email: 'prof@dcrust.ac.in',
  displayName: 'Prof. Verma',
  departmentId: null,
  status: 'active',
  roles: [{ id: randomUUID(), userId: facultyId, role: 'faculty', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const studentUser: CampusUser = {
  id: studentId,
  authUserId: 'auth-stu-1',
  email: 'stud@dcrust.ac.in',
  displayName: 'Rahul Verma',
  departmentId: null,
  status: 'active',
  roles: [{ id: randomUUID(), userId: studentId, role: 'student', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const adminUser: CampusUser = {
  id: adminId,
  authUserId: 'auth-adm-1',
  email: 'admin@dcrust.ac.in',
  displayName: 'Admin Staff',
  departmentId: null,
  status: 'active',
  roles: [{ id: randomUUID(), userId: adminId, role: 'administrator', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function createMockUserRepo(): CampusUserRepository {
  const users = [facultyUser, studentUser, adminUser];
  return {
    async findByAuthId(id) { return users.find(u => u.authUserId === id) ?? null; },
    async findById(id) { return users.find(u => u.id === id) ?? null; },
    async findByEmail(email) { return users.find(u => u.email === email) ?? null; },
    async create() { throw new Error('not implemented'); },
    async updateStatus() { throw new Error('not implemented'); },
    async listUsers() { return { users, total: users.length }; },
    async assignRole() { throw new Error('not implemented'); },
    async revokeRole() { return true; },
    async getProfile() { return null; },
    async updateProfile() { return null; },
    async createProfile() { throw new Error('not implemented'); },
    async logAudit() {},
  };
}

function createMockAcademicsRepo(): AcademicsRepository {
  return {
    async listDepartments() { return []; },
    async createDepartment() { throw new Error('not implemented'); },
    async getDepartmentById() { return null; },
    async listPrograms() { return []; },
    async createProgram() { throw new Error('not implemented'); },
    async listTerms() { return []; },
    async createTerm() { throw new Error('not implemented'); },
    async listCourses() { return []; },
    async createCourse() { throw new Error('not implemented'); },
    async listSections() { return []; },
    async createSection() { throw new Error('not implemented'); },
    async getSectionById() { return null; },
    async enrollStudent() { throw new Error('not implemented'); },
    async dropStudent() { return true; },
    async listEnrollments() { return [{ id: randomUUID(), studentId, sectionId, status: 'enrolled', enrolledAt: new Date().toISOString() }]; },
    async assignFaculty() { throw new Error('not implemented'); },
    async removeFaculty() { return true; },
    async listTeachingAssignments() { return [{ id: randomUUID(), facultyId, sectionId, role: 'primary', assignedAt: new Date().toISOString() }]; },
  };
}

test('F04 Timetable: rejects overlapping room and faculty bookings', async () => {
  const userRepo = createMockUserRepo();
  const timetableRepo = createMockTimetableRepo();
  const appAdmin = createApp(loadConfig({}), silent, undefined, authVerifier(adminUser), userRepo, undefined, { timetableRepo });

  // 1. Create a room
  const roomRes = await request(appAdmin)
    .post('/api/v1/timetable/rooms')
    .set('Authorization', 'Bearer token.1.2')
    .send({ code: 'LT-101', name: 'Lecture Theater 101', building: 'Academic Block A', capacity: 120, type: 'lecture_hall' })
    .expect(201);
  const roomId = roomRes.body.data.id;

  // 2. Schedule session Monday 09:00 - 10:00
  await request(appAdmin)
    .post('/api/v1/timetable/sessions')
    .set('Authorization', 'Bearer token.1.2')
    .send({ sectionId, roomId, facultyId, dayOfWeek: 1, startTime: '09:00', endTime: '10:00' })
    .expect(201);

  // 3. Attempt same room overlap: Monday 09:30 - 10:30 with different faculty -> 409 ROOM_CONFLICT
  const otherFacultyId = randomUUID();
  const roomConflictRes = await request(appAdmin)
    .post('/api/v1/timetable/sessions')
    .set('Authorization', 'Bearer token.1.2')
    .send({ sectionId, roomId, facultyId: otherFacultyId, dayOfWeek: 1, startTime: '09:30', endTime: '10:30' })
    .expect(409);
  assert.equal(roomConflictRes.body.error.code, 'ROOM_CONFLICT');

  // 4. Attempt same faculty overlap in another room: Monday 09:30 - 10:30 -> 409 FACULTY_CONFLICT
  const otherRoomRes = await request(appAdmin)
    .post('/api/v1/timetable/rooms')
    .set('Authorization', 'Bearer token.1.2')
    .send({ code: 'LT-102', name: 'Lecture Theater 102', building: 'Academic Block A', capacity: 60 })
    .expect(201);
  const otherRoomId = otherRoomRes.body.data.id;

  const facultyConflictRes = await request(appAdmin)
    .post('/api/v1/timetable/sessions')
    .set('Authorization', 'Bearer token.1.2')
    .send({ sectionId, roomId: otherRoomId, facultyId, dayOfWeek: 1, startTime: '09:30', endTime: '10:30' })
    .expect(409);
  assert.equal(facultyConflictRes.body.error.code, 'FACULTY_CONFLICT');
});

test('F05 Attendance: prevents duplicate session records and handles correction workflow', async () => {
  const userRepo = createMockUserRepo();
  const attendanceRepo = createMockAttendanceRepo();
  const appFaculty = createApp(loadConfig({}), silent, undefined, authVerifier(facultyUser), userRepo, undefined, { attendanceRepo });
  const appStudent = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo, undefined, { attendanceRepo });

  const sessionId = randomUUID();

  // 1. Faculty records attendance (student is absent)
  const recordRes = await request(appFaculty)
    .post('/api/v1/attendance/record')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      sessionId,
      records: [{ studentId, status: 'absent' }],
    })
    .expect(201);
  const recordId = recordRes.body.data[0].id;

  // 2. Prevent duplicate recording for same session
  const dupRes = await request(appFaculty)
    .post('/api/v1/attendance/record')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      sessionId,
      records: [{ studentId, status: 'present' }],
    })
    .expect(409);
  assert.equal(dupRes.body.error.code, 'DUPLICATE_SESSION_RECORD');

  // 3. Student views summary (0% attendance)
  const sumRes1 = await request(appStudent)
    .get('/api/v1/attendance/summary')
    .set('Authorization', 'Bearer token.1.2')
    .expect(200);
  assert.equal(sumRes1.body.data.attendancePercentage, 0);

  // 4. Student submits correction request
  const corrRes = await request(appStudent)
    .post('/api/v1/attendance/corrections')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      attendanceRecordId: recordId,
      requestedStatus: 'present',
      reason: 'Was present in class, biometric scanner malfunctioned',
    })
    .expect(201);
  const corrId = corrRes.body.data.id;

  // 5. Faculty approves correction
  await request(appFaculty)
    .patch(`/api/v1/attendance/corrections/${corrId}/review`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ action: 'approved' })
    .expect(200);

  // 6. Student re-checks summary -> 100% attendance!
  const sumRes2 = await request(appStudent)
    .get('/api/v1/attendance/summary')
    .set('Authorization', 'Bearer token.1.2')
    .expect(200);
  assert.equal(sumRes2.body.data.attendancePercentage, 100);
});

test('F06 & F07 Assignments: submission deadlines, unpublished results isolation and publishing', async () => {
  const userRepo = createMockUserRepo();
  const assignmentsRepo = createMockAssignmentsRepo();
  const appFaculty = createApp(loadConfig({}), silent, undefined, authVerifier(facultyUser), userRepo, undefined, { assignmentsRepo });
  const appStudent = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo, undefined, { assignmentsRepo });

  // 1. Faculty creates assignment with past deadline and allowLate: false
  const pastDate = new Date(Date.now() - 3600000).toISOString();
  const strictAssignRes = await request(appFaculty)
    .post('/api/v1/assignments')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      sectionId,
      title: 'Strict Homework',
      dueDate: pastDate,
      allowLate: false,
    })
    .expect(201);
  const strictId = strictAssignRes.body.data.id;

  // 2. Student attempts late submission -> rejected 400
  const lateAttemptRes = await request(appStudent)
    .post(`/api/v1/assignments/${strictId}/submit`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ content: 'My homework answers' })
    .expect(400);
  assert.equal(lateAttemptRes.body.error.code, 'SUBMISSION_DEADLINE_PASSED');

  // 3. Faculty creates active assignment
  const futureDate = new Date(Date.now() + 86400000).toISOString();
  const openAssignRes = await request(appFaculty)
    .post('/api/v1/assignments')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      sectionId,
      title: 'Project Milestone 1',
      dueDate: futureDate,
      maxMarks: 100,
    })
    .expect(201);
  const openId = openAssignRes.body.data.id;

  // 4. Student submits
  const subRes = await request(appStudent)
    .post(`/api/v1/assignments/${openId}/submit`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ content: 'Project GitHub repository link' })
    .expect(201);
  const subId = subRes.body.data.id;

  // 5. Faculty grades submission
  await request(appFaculty)
    .post(`/api/v1/assignments/submissions/${subId}/grade`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ marksObtained: 95, feedback: 'Excellent architectural design!' })
    .expect(201);

  // 6. Student requests results before publishing -> 403 RESULTS_NOT_PUBLISHED
  const earlyResultRes = await request(appStudent)
    .get(`/api/v1/assignments/sections/${sectionId}/results`)
    .set('Authorization', 'Bearer token.1.2')
    .expect(403);
  assert.equal(earlyResultRes.body.error.code, 'RESULTS_NOT_PUBLISHED');

  // 7. Faculty publishes results
  await request(appFaculty)
    .post(`/api/v1/assignments/sections/${sectionId}/publish`)
    .set('Authorization', 'Bearer token.1.2')
    .expect(200);

  // 8. Student requests results after publishing -> sees marks 95 and feedback
  const publishedResultRes = await request(appStudent)
    .get(`/api/v1/assignments/sections/${sectionId}/results`)
    .set('Authorization', 'Bearer token.1.2')
    .expect(200);

  const projectResult = publishedResultRes.body.data.results.find(
    (r: any) => r.assignmentTitle === 'Project Milestone 1',
  );
  assert.ok(projectResult);
  assert.equal(projectResult.marksObtained, 95);
  assert.equal(projectResult.feedback, 'Excellent architectural design!');
});

test('F18 & F25 Appointments & Unified Calendar: conflict check and aggregation', async () => {
  const userRepo = createMockUserRepo();
  const appointmentsRepo = createMockAppointmentsRepo();
  const timetableRepo = createMockTimetableRepo();
  const assignmentsRepo = createMockAssignmentsRepo();
  const academicsRepo = createMockAcademicsRepo();

  const appFaculty = createApp(loadConfig({}), silent, undefined, authVerifier(facultyUser), userRepo, academicsRepo, {
    appointmentsRepo,
    timetableRepo,
    assignmentsRepo,
  });
  const appStudent = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo, academicsRepo, {
    appointmentsRepo,
    timetableRepo,
    assignmentsRepo,
  });

  // 1. Student requests appointment
  const start = new Date(Date.now() + 10000000);
  const end = new Date(Date.now() + 13600000);
  const apptReq = await request(appStudent)
    .post('/api/v1/appointments/requests')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      facultyId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      reason: 'Discuss thesis proposal',
    })
    .expect(201);
  const apptId = apptReq.body.data.id;

  // 2. Faculty confirms appointment
  await request(appFaculty)
    .patch(`/api/v1/appointments/${apptId}/review`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ status: 'confirmed' })
    .expect(200);

  // 3. Attempting overlapping appointment with same faculty -> 409 APPOINTMENT_CONFLICT
  const overlapRes = await request(appStudent)
    .post('/api/v1/appointments/requests')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      facultyId,
      startTime: new Date(Date.now() + 11000000).toISOString(),
      endTime: new Date(Date.now() + 14600000).toISOString(),
      reason: 'Another consultation',
    })
    .expect(409);
  assert.equal(overlapRes.body.error.code, 'APPOINTMENT_CONFLICT');

  // 4. Student checks unified calendar -> contains confirmed appointment!
  const calendarRes = await request(appStudent)
    .get('/api/v1/calendar/me')
    .set('Authorization', 'Bearer token.1.2')
    .expect(200);

  assert.ok(calendarRes.body.data.some((entry: any) => entry.type === 'appointment' && entry.title.includes('Discuss thesis proposal')));
});
