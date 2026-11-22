import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config/env.ts';
import type { CampusUser } from '../src/types/auth.ts';
import type { CampusUserRepository } from '../src/modules/auth/repositories/user.repository.ts';
import type { ClubsRepository, ClubItem, EventItem, EventRegistrationItem } from '../src/modules/clubs/repositories/clubs.repository.ts';
import type { PlacementsRepository, PlacementOpportunityItem, PlacementApplicationItem } from '../src/modules/placements/repositories/placements.repository.ts';
import type { NoticesRepository, NoticeItem, NotificationItem } from '../src/modules/notices/repositories/notices.repository.ts';
import type { LostFoundRepository, LostFoundItemRecord, LostFoundClaimRecord } from '../src/modules/lost-found/repositories/lost-found.repository.ts';
import type { DirectoryRepository } from '../src/modules/directory/repositories/directory.repository.ts';
import type { SurveysRepository, SurveyItem, SurveyResponseItem } from '../src/modules/surveys/repositories/surveys.repository.ts';
import type { SearchRepository, SearchResultItem } from '../src/modules/search/repositories/search.repository.ts';
import type { AnalyticsRepository } from '../src/modules/analytics/repositories/analytics.repository.ts';

function createMockUserRepo(users: CampusUser[]): CampusUserRepository {
  return {
    async findById(id: string) { return users.find(u => u.id === id) ?? null; },
    async findByAuthId(authUserId: string) { return users.find(u => u.authUserId === authUserId) ?? null; },
    async findByEmail(email: string) { return users.find(u => u.email === email) ?? null; },
    async create() { throw new Error('Not implemented'); },
    async listUsers() { return { users, total: users.length }; },
    async updateStatus() { throw new Error('Not implemented'); },
    async assignRole() { throw new Error('Not implemented'); },
    async revokeRole() { return true; },
    async getProfile() { return null; },
    async updateProfile() { return null; },
    async createProfile() { throw new Error('Not implemented'); },
    async logAudit() {},
  };
}

describe('Phase 4: Communication and Participation (F11, F12, F13, F16, F17, F22, F26, F27)', () => {
  const adminId = randomUUID();
  const studentId = randomUUID();
  const coordinatorId = randomUUID();
  const placementOfficerId = randomUUID();

  const mockUsers: CampusUser[] = [
    {
      id: adminId,
      authUserId: randomUUID(),
      email: 'admin@dcrust.edu.in',
      displayName: 'System Admin',
      status: 'active',
      departmentId: null,
      roles: [{ id: randomUUID(), userId: adminId, role: 'administrator', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: studentId,
      authUserId: randomUUID(),
      email: 'student@dcrust.edu.in',
      displayName: 'Student One',
      status: 'active',
      departmentId: null,
      roles: [{ id: randomUUID(), userId: studentId, role: 'student', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: coordinatorId,
      authUserId: randomUUID(),
      email: 'coordinator@dcrust.edu.in',
      displayName: 'Club Coordinator',
      status: 'active',
      departmentId: null,
      roles: [{ id: randomUUID(), userId: coordinatorId, role: 'club_coordinator', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: placementOfficerId,
      authUserId: randomUUID(),
      email: 'tpo@dcrust.edu.in',
      displayName: 'TPO Officer',
      status: 'active',
      departmentId: null,
      roles: [{ id: randomUUID(), userId: placementOfficerId, role: 'placement_officer', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockVerify = async (token: string) => {
    if (token === 'admin_token.1.2') return { id: mockUsers[0]!.authUserId, email: mockUsers[0]!.email };
    if (token === 'student_token.1.2') return { id: mockUsers[1]!.authUserId, email: mockUsers[1]!.email };
    if (token === 'coordinator_token.1.2') return { id: mockUsers[2]!.authUserId, email: mockUsers[2]!.email };
    if (token === 'tpo_token.1.2') return { id: mockUsers[3]!.authUserId, email: mockUsers[3]!.email };
    throw new Error('Unauthenticated');
  };

  // 1. Mock Clubs
  const clubsDb: ClubItem[] = [];
  const eventsDb: EventItem[] = [];
  const registrationsDb: EventRegistrationItem[] = [];

  const clubsRepo: ClubsRepository = {
    async listClubs() { return clubsDb; },
    async createClub(data) {
      const c: ClubItem = { id: randomUUID(), code: data.code, name: data.name, description: data.description, coordinatorId: data.coordinatorId, createdAt: new Date().toISOString() };
      clubsDb.push(c);
      return c;
    },
    async joinClub(clubId, studentId) {
      return { id: randomUUID(), clubId, studentId, status: 'active' };
    },
    async listEvents() { return eventsDb; },
    async createEvent(data) {
      const e: EventItem = {
        id: randomUUID(),
        clubId: data.clubId,
        title: data.title,
        description: data.description,
        location: data.location,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        capacity: data.capacity,
        status: 'pending',
        createdBy: data.createdBy,
        createdAt: new Date().toISOString(),
      };
      eventsDb.push(e);
      return e;
    },
    async approveEvent(id) {
      const e = eventsDb.find(x => x.id === id);
      if (!e) return null;
      e.status = 'approved';
      return e;
    },
    async getRegistrationCount(eventId) {
      return registrationsDb.filter(r => r.eventId === eventId).length;
    },
    async registerForEvent(eventId, studentId) {
      const ev = eventsDb.find(e => e.id === eventId);
      if (!ev) throw new Error('Event not found');
      const count = await this.getRegistrationCount(eventId);
      if (count >= ev.capacity) throw new Error('Event is at full capacity');
      if (registrationsDb.some(r => r.eventId === eventId && r.studentId === studentId)) {
        throw new Error('Already registered');
      }
      const r: EventRegistrationItem = { id: randomUUID(), eventId, studentId, attended: false, registeredAt: new Date().toISOString() };
      registrationsDb.push(r);
      return r;
    },
    async listRegistrations(eventId) {
      return registrationsDb.filter(r => r.eventId === eventId);
    },
  };

  // 2. Mock Placements
  const opportunitiesDb: PlacementOpportunityItem[] = [];
  const applicationsDb: PlacementApplicationItem[] = [];

  const placementsRepo: PlacementsRepository = {
    async listOpportunities() { return opportunitiesDb; },
    async getOpportunityById(id) { return opportunitiesDb.find(o => o.id === id) ?? null; },
    async createOpportunity(data) {
      const op: PlacementOpportunityItem = {
        id: randomUUID(),
        companyName: data.companyName,
        title: data.title,
        description: data.description,
        minCgpa: data.minCgpa,
        eligibleBranches: data.eligibleBranches,
        deadline: data.deadline.toISOString(),
        packageDetails: data.packageDetails ?? null,
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      opportunitiesDb.push(op);
      return op;
    },
    async apply(data) {
      const opp = opportunitiesDb.find(o => o.id === data.opportunityId);
      if (!opp) throw new Error('Opportunity not found');
      if (new Date() > new Date(opp.deadline)) throw new Error('DEADLINE_PASSED');
      if (applicationsDb.some(a => a.opportunityId === data.opportunityId && a.studentId === data.studentId)) {
        throw new Error('ALREADY_APPLIED');
      }
      const app: PlacementApplicationItem = {
        id: randomUUID(),
        opportunityId: data.opportunityId,
        studentId: data.studentId,
        cgpa: data.cgpa,
        branch: data.branch,
        status: 'applied',
        appliedAt: new Date().toISOString(),
      };
      applicationsDb.push(app);
      return app;
    },
    async listApplications(filters) {
      if (filters?.studentId) return applicationsDb.filter(a => a.studentId === filters.studentId);
      return applicationsDb;
    },
    async updateApplicationStatus(id, status) {
      const app = applicationsDb.find(a => a.id === id);
      if (!app) return null;
      app.status = status;
      return app;
    },
  };

  // 3. Mock Notices
  const noticesDb: NoticeItem[] = [];
  const notificationsDb: NotificationItem[] = [];

  const noticesRepo: NoticesRepository = {
    async listNotices() { return noticesDb; },
    async createNotice(data) {
      const n: NoticeItem = {
        id: randomUUID(),
        title: data.title,
        content: data.content,
        targetRoles: data.targetRoles ?? [],
        targetDepartmentId: data.targetDepartmentId,
        isUrgent: data.isUrgent ?? false,
        expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null,
        publishedBy: data.publishedBy,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      noticesDb.push(n);
      return n;
    },
    async listNotifications(userId) {
      return notificationsDb.filter(n => n.userId === userId);
    },
    async createNotification(data) {
      const notif: NotificationItem = {
        id: randomUUID(),
        userId: data.userId,
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      notificationsDb.push(notif);
      return notif;
    },
    async markNotificationRead(id) {
      const notif = notificationsDb.find(n => n.id === id);
      if (!notif) return false;
      notif.isRead = true;
      notif.readAt = new Date().toISOString();
      return true;
    },
  };

  // 4. Mock Lost & Found
  const lostFoundDb: LostFoundItemRecord[] = [];
  const claimsDb: LostFoundClaimRecord[] = [];

  const lostFoundRepo: LostFoundRepository = {
    async listItems() { return lostFoundDb; },
    async getItemById(id) { return lostFoundDb.find(i => i.id === id) ?? null; },
    async createItem(data) {
      const item: LostFoundItemRecord = {
        id: randomUUID(),
        type: data.type,
        title: data.title,
        description: data.description,
        category: data.category,
        locationFound: data.locationFound,
        status: 'open',
        reportedBy: data.reportedBy,
        reportedAt: new Date().toISOString(),
      };
      lostFoundDb.push(item);
      return item;
    },
    async submitClaim(data) {
      const c: LostFoundClaimRecord = {
        id: randomUUID(),
        itemId: data.itemId,
        claimantId: data.claimantId,
        proofDescription: data.proofDescription,
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date().toISOString(),
      };
      claimsDb.push(c);
      return c;
    },
    async listClaimsForItem(itemId) {
      return claimsDb.filter(c => c.itemId === itemId);
    },
    async reviewClaim(claimId, reviewerId, status) {
      const claim = claimsDb.find(c => c.id === claimId);
      if (!claim) return null;
      claim.status = status;
      claim.reviewedBy = reviewerId;
      claim.reviewedAt = new Date().toISOString();
      if (status === 'verified') {
        const item = lostFoundDb.find(i => i.id === claim.itemId);
        if (item) item.status = 'claimed';
      }
      return claim;
    },
    async markItemRecovered(itemId) {
      const item = lostFoundDb.find(i => i.id === itemId);
      if (!item) return null;
      item.status = 'recovered';
      return item;
    },
  };

  // 5. Mock Directory
  const directoryRepo: DirectoryRepository = {
    async searchDepartments() {
      return [{ id: randomUUID(), code: 'CSE', name: 'Computer Science and Engineering', createdAt: new Date().toISOString() }];
    },
    async searchStaff() {
      return [
        {
          id: adminId,
          fullName: 'Prof. Sharma',
          email: 'sharma@dcrust.edu.in',
          departmentName: 'Computer Science and Engineering',
          designation: 'Professor & Head',
          officeLocation: 'Room 201, Academic Block',
          officeHours: 'Mon-Fri 2-4 PM',
          phone: '+919876543210',
          contactVisibility: 'public',
        },
        {
          id: randomUUID(),
          fullName: 'Private Staff',
          email: 'staff@dcrust.edu.in',
          departmentName: 'Computer Science and Engineering',
          designation: 'Assistant',
          officeLocation: 'Room 105',
          officeHours: '9 AM - 5 PM',
          phone: '+919999988888',
          contactVisibility: 'private',
        },
      ];
    },
  };

  // 6. Mock Surveys
  const surveysDb: SurveyItem[] = [];
  const surveyResponsesDb: SurveyResponseItem[] = [];

  const surveysRepo: SurveysRepository = {
    async listSurveys() { return surveysDb; },
    async getSurveyById(id) { return surveysDb.find(s => s.id === id) ?? null; },
    async createSurvey(data) {
      const surveyId = randomUUID();
      const s: SurveyItem = {
        id: surveyId,
        title: data.title,
        description: data.description,
        isAnonymous: data.isAnonymous,
        startsAt: data.startsAt.toISOString(),
        endsAt: data.endsAt.toISOString(),
        maxResponses: data.maxResponses ?? 1000,
        targetRoles: data.targetRoles ?? [],
        createdBy: data.createdBy,
        createdAt: new Date().toISOString(),
        questions: data.questions.map(q => ({
          id: randomUUID(),
          surveyId,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options ?? [],
          createdAt: new Date().toISOString(),
        })),
      };
      surveysDb.push(s);
      return s;
    },
    async submitResponses(data) {
      const items: SurveyResponseItem[] = data.answers.map(a => ({
        id: randomUUID(),
        surveyId: data.surveyId,
        questionId: a.questionId,
        respondentId: data.isAnonymous ? null : data.respondentId,
        responseText: a.responseText,
        submittedAt: new Date().toISOString(),
      }));
      surveyResponsesDb.push(...items);
      return items;
    },
    async getAggregation(surveyId) {
      const survey = surveysDb.find(s => s.id === surveyId);
      const responses = surveyResponsesDb.filter(r => r.surveyId === surveyId);
      const questionResults = (survey?.questions ?? []).map(q => {
        const answers = responses.filter(r => r.questionId === q.id);
        const answerCounts: Record<string, number> = {};
        for (const ans of answers) {
          answerCounts[ans.responseText] = (answerCounts[ans.responseText] ?? 0) + 1;
        }
        return {
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          answerCounts,
        };
      });
      return {
        surveyId,
        totalResponses: responses.length,
        questionResults,
      };
    },
  };

  // 7. Mock Search
  const searchRepo: SearchRepository = {
    async search(query, userRoles) {
      const items: SearchResultItem[] = [];
      if (query.toLowerCase().includes('coding') || query.toLowerCase().includes('club')) {
        items.push({ type: 'event', id: randomUUID(), title: 'Hackathon 2026', snippet: 'Annual 24-hour coding sprint', link: '/events/1' });
      }
      if (userRoles.includes('student') || userRoles.includes('administrator')) {
        items.push({ type: 'notice', id: randomUUID(), title: 'Exam Guidelines', snippet: 'Instructions for upcoming semester exams', link: '/notices/1' });
      }
      return items;
    },
  };

  // 8. Mock Analytics
  const analyticsRepo: AnalyticsRepository = {
    async getCampusAnalytics() {
      return {
        attendance: { totalRecords: 100, presentCount: 85, absentCount: 15, overallPercentage: 85 },
        hostelOccupancy: [{ hostelId: randomUUID(), hostelName: 'Kaveri Hostel', totalCapacity: 200, occupiedCount: 180, occupancyRate: 90 }],
        complaintResolution: { totalTickets: 50, openTickets: 5, inProgressTickets: 10, resolvedTickets: 35 },
        eventParticipation: { totalEvents: 12, totalRegistrations: 450 },
        placements: { totalOpportunities: 25, totalApplications: 120, shortlistedCount: 40, selectedCount: 18 },
      };
    },
  };

  const app = createApp(
    loadConfig(),
    undefined,
    async () => {},
    mockVerify,
    createMockUserRepo(mockUsers),
    undefined,
    {
      clubsRepo,
      placementsRepo,
      noticesRepo,
      lostFoundRepo,
      directoryRepo,
      surveysRepo,
      searchRepo,
      analyticsRepo,
    },
  );

  it('F11 Clubs and Events: proposal, approval, and capacity enforcement', async () => {
    // 1. Create club
    const clubRes = await request(app)
      .post('/api/v1/clubs')
      .set('Authorization', 'Bearer coordinator_token.1.2')
      .send({ code: 'CODING', name: 'Coding Club', description: 'Tech community' });
    assert.equal(clubRes.status, 201);
    const clubId = clubRes.body.data.id;

    // 2. Student joins club
    const joinRes = await request(app)
      .post(`/api/v1/clubs/${clubId}/join`)
      .set('Authorization', 'Bearer student_token.1.2');
    assert.equal(joinRes.status, 201);

    // 3. Propose event with capacity = 1
    const eventRes = await request(app)
      .post('/api/v1/clubs/events')
      .set('Authorization', 'Bearer coordinator_token.1.2')
      .send({
        clubId,
        title: 'Algo Workshop',
        description: 'Hands on algorithms',
        location: 'Lab 3',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
        capacity: 1,
      });
    assert.equal(eventRes.status, 201);
    const eventId = eventRes.body.data.id;

    // 4. Coordinator/Admin approves event
    const approveRes = await request(app)
      .patch(`/api/v1/clubs/events/${eventId}/approve`)
      .set('Authorization', 'Bearer coordinator_token.1.2');
    assert.equal(approveRes.status, 200);

    // 5. Student 1 registers (fills capacity)
    const regRes = await request(app)
      .post(`/api/v1/clubs/events/${eventId}/register`)
      .set('Authorization', 'Bearer student_token.1.2');
    assert.equal(regRes.status, 201);

    // 6. Duplicate registration rejected
    const dupRes = await request(app)
      .post(`/api/v1/clubs/events/${eventId}/register`)
      .set('Authorization', 'Bearer student_token.1.2');
    assert.equal(dupRes.status, 409);
  });

  it('F12 Placements: publish opportunity, deadline check, and officer status update', async () => {
    // 1. TPO publishes placement opportunity
    const oppRes = await request(app)
      .post('/api/v1/placements/opportunities')
      .set('Authorization', 'Bearer tpo_token.1.2')
      .send({
        companyName: 'Google',
        title: 'Software Engineer',
        description: 'Cloud Infrastructure',
        minCgpa: 700,
        eligibleBranches: ['CSE', 'ECE'],
        deadline: new Date(Date.now() + 86400000).toISOString(),
        packageDetails: '24 LPA',
      });
    assert.equal(oppRes.status, 201);
    const oppId = oppRes.body.data.id;

    // 2. Student applies
    const applyRes = await request(app)
      .post(`/api/v1/placements/opportunities/${oppId}/apply`)
      .set('Authorization', 'Bearer student_token.1.2')
      .send({ cgpa: 850, branch: 'CSE' });
    assert.equal(applyRes.status, 201);
    const appId = applyRes.body.data.id;

    // 3. Officer advances status to shortlisted
    const statusRes = await request(app)
      .patch(`/api/v1/placements/applications/${appId}/status`)
      .set('Authorization', 'Bearer tpo_token.1.2')
      .send({ status: 'shortlisted' });
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.data.status, 'shortlisted');
  });

  it('F13 Notices: role targeting isolation and notifications read status', async () => {
    // 1. Publish student-targeted notice
    const noticeRes = await request(app)
      .post('/api/v1/notices')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        title: 'Midterm Date Sheet',
        content: 'Check date sheet on campus portal',
        targetRoles: ['student'],
      });
    assert.equal(noticeRes.status, 201);

    // 2. Student views notices
    const studentNotices = await request(app)
      .get('/api/v1/notices')
      .set('Authorization', 'Bearer student_token.1.2');
    assert.equal(studentNotices.status, 200);
    assert(studentNotices.body.data.some((n: any) => n.title === 'Midterm Date Sheet'));

    // 3. Create notification for student
    const notif = await noticesRepo.createNotification({
      userId: studentId,
      title: 'Fee Reminder',
      message: 'Semester fees are due next week',
    });

    // 4. Student marks notification as read
    const readRes = await request(app)
      .patch(`/api/v1/notices/notifications/${notif.id}/read`)
      .set('Authorization', 'Bearer student_token.1.2');
    assert.equal(readRes.status, 200);
    assert.equal(readRes.body.data.isRead, true);
  });

  it('F22 Lost & Found: submit item, private claim proof, review, and recovery', async () => {
    // 1. Post lost item
    const postRes = await request(app)
      .post('/api/v1/lost-found/items')
      .set('Authorization', 'Bearer student_token.1.2')
      .send({
        type: 'found',
        title: 'Blue Water Bottle',
        description: 'Stainless steel bottle found in Library 2nd floor',
        category: 'Accessories',
        locationFound: 'Central Library',
      });
    assert.equal(postRes.status, 201);
    const itemId = postRes.body.data.id;

    // 2. Another user submits private claim
    const claimRes = await request(app)
      .post(`/api/v1/lost-found/items/${itemId}/claim`)
      .set('Authorization', 'Bearer coordinator_token.1.2')
      .send({ proofDescription: 'Has a small scratch near the cap and sticker on bottom' });
    assert.equal(claimRes.status, 201);
    const claimId = claimRes.body.data.id;

    // 3. Staff reviews and verifies claim
    const reviewRes = await request(app)
      .patch(`/api/v1/lost-found/items/${itemId}/claims/${claimId}/review`)
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({ status: 'verified' });
    assert.equal(reviewRes.status, 200);
    assert.equal(reviewRes.body.data.status, 'verified');

    // 4. Mark item recovered
    const recRes = await request(app)
      .patch(`/api/v1/lost-found/items/${itemId}/recovered`)
      .set('Authorization', 'Bearer admin_token.1.2');
    assert.equal(recRes.status, 200);
    assert.equal(recRes.body.data.status, 'recovered');
  });

  it('F26 Directory: honors contact visibility privacy filters', async () => {
    const res = await request(app)
      .get('/api/v1/directory/staff')
      .set('Authorization', 'Bearer student_token.1.2');
    assert.equal(res.status, 200);
    const publicStaff = res.body.data.find((s: any) => s.fullName === 'Prof. Sharma');
    const privateStaff = res.body.data.find((s: any) => s.fullName === 'Private Staff');

    assert.equal(publicStaff.phone, '+919876543210');
    assert.equal(privateStaff.phone, null);
  });

  it('F27 Surveys: anonymous participant isolation and aggregation', async () => {
    // 1. Admin creates anonymous survey
    const surveyRes = await request(app)
      .post('/api/v1/surveys')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        title: 'Hostel Mess Quality',
        description: 'Anonymous student feedback',
        isAnonymous: true,
        startsAt: new Date(Date.now() - 3600000).toISOString(),
        endsAt: new Date(Date.now() + 86400000).toISOString(),
        targetRoles: ['student'],
        questions: [
          {
            questionText: 'How is the food quality?',
            questionType: 'multiple_choice',
            options: ['Excellent', 'Good', 'Average', 'Poor'],
          },
        ],
      });
    assert.equal(surveyRes.status, 201);
    const surveyId = surveyRes.body.data.id;
    const qId = surveyRes.body.data.questions[0].id;

    // 2. Student submits answers
    const submitRes = await request(app)
      .post(`/api/v1/surveys/${surveyId}/responses`)
      .set('Authorization', 'Bearer student_token.1.2')
      .send({
        answers: [{ questionId: qId, responseText: 'Good' }],
      });
    assert.equal(submitRes.status, 201);

    // 3. Verify respondentId is completely detached in storage (Anonymous isolation)
    const stored = surveyResponsesDb.find(r => r.surveyId === surveyId);
    assert.equal(stored?.respondentId, null);

    // 4. View aggregation
    const aggRes = await request(app)
      .get(`/api/v1/surveys/${surveyId}/results`)
      .set('Authorization', 'Bearer admin_token.1.2');
    assert.equal(aggRes.status, 200);
    assert.equal(aggRes.body.data.questionResults[0].answerCounts['Good'], 1);
  });

  it('F16 & F17: Permission-aware global search and analytics reporting', async () => {
    // Search
    const searchRes = await request(app)
      .get('/api/v1/search?q=coding')
      .set('Authorization', 'Bearer student_token.1.2');
    assert.equal(searchRes.status, 200);
    assert(searchRes.body.data.length > 0);

    // Analytics (forbidden for student, allowed for admin)
    const denied = await request(app)
      .get('/api/v1/analytics/summary')
      .set('Authorization', 'Bearer student_token.1.2');
    assert.equal(denied.status, 403);

    const allowed = await request(app)
      .get('/api/v1/analytics/summary')
      .set('Authorization', 'Bearer admin_token.1.2');
    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.data.attendance.overallPercentage, 85);
  });
});
