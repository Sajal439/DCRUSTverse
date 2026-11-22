import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config/env.ts';
import type { Logger } from '../src/types/logger.ts';
import type {
  CampusUser,
  RoleAssignment,
  UserProfile,
  UserStatus,
  RoleName,
  ScopeType,
} from '../src/types/auth.ts';
import type {
  CampusUserRepository,
  CreateUserData,
  AssignRoleData,
  CreateAuditData,
} from '../src/modules/auth/repositories/user.repository.ts';
import type {
  AcademicsRepository,
  DepartmentItem,
  ProgramItem,
  AcademicTermItem,
  CourseItem,
  SectionItem,
  EnrollmentItem,
  TeachingAssignmentItem,
} from '../src/modules/academics/repositories/academics.repository.ts';

const silent: Logger = { info() {}, error() {} };

function createMockUserRepo(initialUsers: CampusUser[] = []): CampusUserRepository {
  const users = new Map<string, CampusUser>(initialUsers.map(u => [u.id, { ...u, roles: [...u.roles] }]));
  const profiles = new Map<string, UserProfile>();
  const audits: CreateAuditData[] = [];

  return {
    async findByAuthId(authUserId: string) {
      for (const u of users.values()) {
        if (u.authUserId === authUserId) return { ...u, roles: [...u.roles] };
      }
      return null;
    },
    async findById(id: string) {
      const u = users.get(id);
      return u ? { ...u, roles: [...u.roles] } : null;
    },
    async findByEmail(email: string) {
      for (const u of users.values()) {
        if (u.email === email.toLowerCase().trim()) return { ...u, roles: [...u.roles] };
      }
      return null;
    },
    async create(data: CreateUserData) {
      const id = randomUUID();
      const newUser: CampusUser = {
        id,
        authUserId: data.authUserId,
        email: data.email,
        displayName: data.displayName,
        departmentId: data.departmentId ?? null,
        status: data.status ?? 'pending',
        roles: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.set(id, newUser);
      return { ...newUser };
    },
    async updateStatus(id: string, status: UserStatus) {
      const u = users.get(id);
      if (!u) return null;
      u.status = status;
      u.updatedAt = new Date().toISOString();
      return { ...u, roles: [...u.roles] };
    },
    async listUsers(options = {}) {
      let list = Array.from(users.values());
      if (options.departmentId) list = list.filter(u => u.departmentId === options.departmentId);
      if (options.status) list = list.filter(u => u.status === options.status);
      if (options.role) list = list.filter(u => u.roles.some(r => r.role === options.role));
      const total = list.length;
      const offset = options.offset ?? 0;
      const limit = options.limit ?? 20;
      return { users: list.slice(offset, offset + limit).map(u => ({ ...u, roles: [...u.roles] })), total };
    },
    async assignRole(data: AssignRoleData) {
      const u = users.get(data.userId);
      if (!u) throw new Error('User not found');
      const assignment: RoleAssignment = {
        id: randomUUID(),
        userId: data.userId,
        role: data.role,
        scopeType: data.scopeType,
        scopeId: data.scopeId ?? null,
        assignedBy: data.assignedBy ?? null,
        createdAt: new Date().toISOString(),
      };
      u.roles.push(assignment);
      return assignment;
    },
    async revokeRole(assignmentId: string) {
      for (const u of users.values()) {
        const idx = u.roles.findIndex(r => r.id === assignmentId);
        if (idx >= 0) {
          u.roles.splice(idx, 1);
          return true;
        }
      }
      return false;
    },
    async getProfile(userId: string) {
      return profiles.get(userId) ?? null;
    },
    async updateProfile(userId: string, data) {
      const existing = profiles.get(userId);
      if (!existing) return null;
      const updated: UserProfile = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      profiles.set(userId, updated);
      return updated;
    },
    async createProfile(userId: string, data = {}) {
      const profile: UserProfile = {
        id: randomUUID(),
        userId,
        rollNumber: data.rollNumber ?? null,
        employeeId: data.employeeId ?? null,
        designation: data.designation ?? null,
        phone: data.phone ?? null,
        avatarUrl: data.avatarUrl ?? null,
        bio: data.bio ?? null,
        metadata: data.metadata ?? {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      profiles.set(userId, profile);
      return profile;
    },
    async logAudit(data: CreateAuditData) {
      audits.push(data);
    },
  };
}

function createMockAcademicsRepo(): AcademicsRepository {
  const depts: DepartmentItem[] = [];
  const progs: ProgramItem[] = [];
  const terms: AcademicTermItem[] = [];
  const crss: CourseItem[] = [];
  const scts: SectionItem[] = [];
  const enrolls: EnrollmentItem[] = [];
  const teaches: TeachingAssignmentItem[] = [];

  return {
    async listDepartments() { return [...depts]; },
    async createDepartment(data) {
      const item: DepartmentItem = { id: randomUUID(), code: data.code, name: data.name, createdAt: new Date().toISOString() };
      depts.push(item);
      return item;
    },
    async getDepartmentById(id) { return depts.find(d => d.id === id) ?? null; },

    async listPrograms(departmentId) {
      return departmentId ? progs.filter(p => p.departmentId === departmentId) : [...progs];
    },
    async createProgram(data) {
      const item: ProgramItem = { id: randomUUID(), ...data, createdAt: new Date().toISOString() };
      progs.push(item);
      return item;
    },

    async listTerms() { return [...terms]; },
    async createTerm(data) {
      const item: AcademicTermItem = {
        id: randomUUID(),
        code: data.code,
        name: data.name,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        status: data.status ?? 'upcoming',
        createdAt: new Date().toISOString(),
      };
      terms.push(item);
      return item;
    },

    async listCourses(departmentId) {
      return departmentId ? crss.filter(c => c.departmentId === departmentId) : [...crss];
    },
    async createCourse(data) {
      const item: CourseItem = {
        id: randomUUID(),
        departmentId: data.departmentId,
        code: data.code,
        name: data.name,
        credits: data.credits,
        type: data.type ?? 'core',
        description: data.description ?? null,
        createdAt: new Date().toISOString(),
      };
      crss.push(item);
      return item;
    },

    async listSections(filters = {}) {
      return scts.filter(s => {
        if (filters.courseId && s.courseId !== filters.courseId) return false;
        if (filters.academicTermId && s.academicTermId !== filters.academicTermId) return false;
        return true;
      });
    },
    async createSection(data) {
      const item: SectionItem = {
        id: randomUUID(),
        courseId: data.courseId,
        academicTermId: data.academicTermId,
        name: data.name,
        capacity: data.capacity ?? 60,
        createdAt: new Date().toISOString(),
      };
      scts.push(item);
      return item;
    },
    async getSectionById(id) { return scts.find(s => s.id === id) ?? null; },

    async enrollStudent(data) {
      const section = scts.find(s => s.id === data.sectionId);
      if (!section) throw new Error('Section not found');
      const count = enrolls.filter(e => e.sectionId === data.sectionId && e.status === 'enrolled').length;
      if (count >= section.capacity) throw new Error('Section is already at full capacity');
      const item: EnrollmentItem = {
        id: randomUUID(),
        studentId: data.studentId,
        sectionId: data.sectionId,
        status: 'enrolled',
        enrolledAt: new Date().toISOString(),
      };
      enrolls.push(item);
      return item;
    },
    async dropStudent(studentId, sectionId) {
      const item = enrolls.find(e => e.studentId === studentId && e.sectionId === sectionId);
      if (!item) return false;
      item.status = 'dropped';
      return true;
    },
    async listEnrollments(filters) {
      return enrolls.filter(e => {
        if (filters.sectionId && e.sectionId !== filters.sectionId) return false;
        if (filters.studentId && e.studentId !== filters.studentId) return false;
        return true;
      });
    },

    async assignFaculty(data) {
      const item: TeachingAssignmentItem = {
        id: randomUUID(),
        facultyId: data.facultyId,
        sectionId: data.sectionId,
        role: data.role ?? 'primary',
        assignedAt: new Date().toISOString(),
      };
      teaches.push(item);
      return item;
    },
    async removeFaculty(assignmentId) {
      const idx = teaches.findIndex(t => t.id === assignmentId);
      if (idx >= 0) {
        teaches.splice(idx, 1);
        return true;
      }
      return false;
    },
    async listTeachingAssignments(filters) {
      return teaches.filter(t => {
        if (filters.sectionId && t.sectionId !== filters.sectionId) return false;
        if (filters.facultyId && t.facultyId !== filters.facultyId) return false;
        return true;
      });
    },
  };
}

const adminId = randomUUID();
const studentId = randomUUID();
const disabledId = randomUUID();
const facultyId = randomUUID();
const deptId = randomUUID();

const adminUser: CampusUser = {
  id: adminId,
  authUserId: 'auth-admin-1',
  email: 'admin@dcrust.ac.in',
  displayName: 'Admin User',
  departmentId: null,
  status: 'active',
  roles: [
    {
      id: randomUUID(),
      userId: adminId,
      role: 'administrator',
      scopeType: 'global',
      scopeId: null,
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const studentUser: CampusUser = {
  id: studentId,
  authUserId: 'auth-student-1',
  email: 'student@dcrust.ac.in',
  displayName: 'Student One',
  departmentId: deptId,
  status: 'active',
  roles: [
    {
      id: randomUUID(),
      userId: studentId,
      role: 'student',
      scopeType: 'department',
      scopeId: deptId,
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const disabledUser: CampusUser = {
  id: disabledId,
  authUserId: 'auth-disabled-1',
  email: 'disabled@dcrust.ac.in',
  displayName: 'Disabled User',
  departmentId: null,
  status: 'disabled',
  roles: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const facultyUser: CampusUser = {
  id: facultyId,
  authUserId: 'auth-faculty-1',
  email: 'faculty@dcrust.ac.in',
  displayName: 'Prof. Sharma',
  departmentId: deptId,
  status: 'active',
  roles: [
    {
      id: randomUUID(),
      userId: facultyId,
      role: 'faculty',
      scopeType: 'department',
      scopeId: deptId,
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function authVerifier(currentUser?: CampusUser) {
  return async () => {
    if (!currentUser) throw new Error('Unauthenticated');
    return { id: currentUser.authUserId, email: currentUser.email };
  };
}

test('onboarding registers a new campus user and profile in pending state', async () => {
  const userRepo = createMockUserRepo();
  const app = createApp(
    loadConfig({}),
    silent,
    undefined,
    async () => ({ id: 'new-auth-id', email: 'newuser@dcrust.ac.in' }),
    userRepo,
  );

  const res = await request(app)
    .post('/api/v1/auth/onboard')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      displayName: 'New Student',
      phone: '+919876543210',
      rollNumber: '21001001099',
    })
    .expect(201);

  assert.equal(res.body.data.user.email, 'newuser@dcrust.ac.in');
  assert.equal(res.body.data.user.status, 'pending');
  assert.equal(res.body.data.profile.rollNumber, '21001001099');
});

test('deactivated user is denied access with ACCOUNT_DISABLED (F01)', async () => {
  const userRepo = createMockUserRepo([disabledUser]);
  const app = createApp(loadConfig({}), silent, undefined, authVerifier(disabledUser), userRepo);

  const res = await request(app)
    .get('/api/v1/profile/me')
    .set('Authorization', 'Bearer token.1.2')
    .expect(403);

  assert.equal(res.body.error.code, 'ACCOUNT_DISABLED');
});

test('student cannot access user administration routes (F01)', async () => {
  const userRepo = createMockUserRepo([adminUser, studentUser]);
  const app = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo);

  const res = await request(app)
    .get('/api/v1/users')
    .set('Authorization', 'Bearer token.1.2')
    .expect(403);

  assert.equal(res.body.error.code, 'FORBIDDEN');
});

test('administrator can list users and update user status (F01)', async () => {
  const userRepo = createMockUserRepo([adminUser, studentUser]);
  const app = createApp(loadConfig({}), silent, undefined, authVerifier(adminUser), userRepo);

  const listRes = await request(app)
    .get('/api/v1/users')
    .set('Authorization', 'Bearer token.1.2')
    .expect(200);

  assert.equal(listRes.body.data.length, 2);

  const patchRes = await request(app)
    .patch(`/api/v1/users/${studentUser.id}/status`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ status: 'disabled' })
    .expect(200);

  assert.equal(patchRes.body.data.status, 'disabled');
});

test('administrator cannot deactivate own account', async () => {
  const userRepo = createMockUserRepo([adminUser]);
  const app = createApp(loadConfig({}), silent, undefined, authVerifier(adminUser), userRepo);

  const res = await request(app)
    .patch(`/api/v1/users/${adminUser.id}/status`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ status: 'disabled' })
    .expect(400);

  assert.equal(res.body.error.code, 'SELF_MODIFICATION_DISALLOWED');
});

test('unauthorized users cannot grant roles; admins cannot assign roles to themselves (F01)', async () => {
  const userRepo = createMockUserRepo([adminUser, studentUser]);

  // 1. Student attempts to assign a role -> 403 Forbidden
  const appStudent = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo);
  const studentRes = await request(appStudent)
    .post(`/api/v1/users/${studentUser.id}/roles`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ role: 'administrator', scopeType: 'global' })
    .expect(403);
  assert.equal(studentRes.body.error.code, 'FORBIDDEN');

  // 2. Admin attempts to assign a role to themselves -> 400 Self Modification Disallowed
  const appAdmin = createApp(loadConfig({}), silent, undefined, authVerifier(adminUser), userRepo);
  const adminRes = await request(appAdmin)
    .post(`/api/v1/users/${adminUser.id}/roles`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ role: 'faculty', scopeType: 'global' })
    .expect(400);
  assert.equal(adminRes.body.error.code, 'SELF_MODIFICATION_DISALLOWED');
});

test('students cannot see other students private profile details (F02)', async () => {
  const otherStudent: CampusUser = {
    ...studentUser,
    id: randomUUID(),
    authUserId: 'auth-student-99',
    email: 'other@dcrust.ac.in',
  };
  const userRepo = createMockUserRepo([studentUser, otherStudent]);
  const app = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo);

  const res = await request(app)
    .get(`/api/v1/users/${otherStudent.id}`)
    .set('Authorization', 'Bearer token.1.2')
    .expect(403);

  assert.equal(res.body.error.code, 'FORBIDDEN');
});

test('users can update their own profile fields (F02)', async () => {
  const userRepo = createMockUserRepo([studentUser]);
  await userRepo.createProfile(studentUser.id, { phone: '+919999999999', bio: 'Initial bio' });
  const app = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo);

  const res = await request(app)
    .patch('/api/v1/profile/me')
    .set('Authorization', 'Bearer token.1.2')
    .send({ bio: 'Updated bio text', phone: '+918888888888' })
    .expect(200);

  assert.equal(res.body.data.profile.bio, 'Updated bio text');
  assert.equal(res.body.data.profile.phone, '+918888888888');
});

test('academic setup: admin creates department, course, section; student enrolls; faculty is assigned (F03)', async () => {
  const userRepo = createMockUserRepo([adminUser, studentUser, facultyUser]);
  const academicsRepo = createMockAcademicsRepo();
  const appAdmin = createApp(loadConfig({}), silent, undefined, authVerifier(adminUser), userRepo, academicsRepo);

  // 1. Admin creates Department
  const deptRes = await request(appAdmin)
    .post('/api/v1/academics/departments')
    .set('Authorization', 'Bearer token.1.2')
    .send({ code: 'CSE', name: 'Computer Science and Engineering' })
    .expect(201);
  const deptId = deptRes.body.data.id;

  // 2. Admin creates Term
  const termRes = await request(appAdmin)
    .post('/api/v1/academics/terms')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      code: '2026-ODD',
      name: 'Autumn 2026',
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-12-15T00:00:00.000Z',
      status: 'active',
    })
    .expect(201);
  const termId = termRes.body.data.id;

  // 3. Admin creates Course
  const courseRes = await request(appAdmin)
    .post('/api/v1/academics/courses')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      departmentId: deptId,
      code: 'CSE301',
      name: 'Database Management Systems',
      credits: 4,
      type: 'core',
    })
    .expect(201);
  const courseId = courseRes.body.data.id;

  // 4. Admin creates Section
  const secRes = await request(appAdmin)
    .post('/api/v1/academics/sections')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      courseId,
      academicTermId: termId,
      name: 'Section A',
      capacity: 50,
    })
    .expect(201);
  const secId = secRes.body.data.id;

  // 5. Admin enrolls Student
  const enrollRes = await request(appAdmin)
    .post('/api/v1/academics/enrollments')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      studentId: studentUser.id,
      sectionId: secId,
    })
    .expect(201);
  assert.equal(enrollRes.body.data.status, 'enrolled');

  // 6. Admin assigns Faculty
  const teachRes = await request(appAdmin)
    .post('/api/v1/academics/teaching-assignments')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      facultyId: facultyUser.id,
      sectionId: secId,
      role: 'primary',
    })
    .expect(201);
  assert.equal(teachRes.body.data.role, 'primary');

  // 7. Student checks their own enrollments
  const appStudent = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo, academicsRepo);
  const studentEnrollments = await request(appStudent)
    .get('/api/v1/academics/enrollments')
    .set('Authorization', 'Bearer token.1.2')
    .expect(200);

  assert.equal(studentEnrollments.body.data.length, 1);
  assert.equal(studentEnrollments.body.data[0].studentId, studentUser.id);
});
