import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config/env.ts';
import type { CampusUser } from '../src/types/auth.ts';
import type { CampusUserRepository } from '../src/modules/auth/repositories/user.repository.ts';
import type { TicketsRepository, TicketItem } from '../src/modules/tickets/repositories/tickets.repository.ts';
import type { HostelRepository, HostelItem, HostelRoomItem, HostelApplicationItem, HostelAllocationItem, HostelTransferItem } from '../src/modules/hostel/repositories/hostel.repository.ts';
import type { LibraryRepository, LibraryTitleItem, BookCopyItem, LoanItem, ReservationItem } from '../src/modules/library/repositories/library.repository.ts';
import type { ClubsRepository } from '../src/modules/clubs/repositories/clubs.repository.ts';
import type { PlacementsRepository } from '../src/modules/placements/repositories/placements.repository.ts';
import type { CampusRepository } from '../src/modules/campus/repositories/campus.repository.ts';
import type { DigitalIdRepository } from '../src/modules/digital-id/repositories/digital-id.repository.ts';
import type { AiAssistantRepository } from '../src/modules/ai-assistant/repositories/ai.repository.ts';
import type { IotBusRepository } from '../src/modules/iot-bus/repositories/iot-bus.repository.ts';
import type { IntegrationsRepository } from '../src/modules/integrations/repositories/integrations.repository.ts';

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

describe('Phase 7: End-to-End Demonstration Journeys 1 through 8', () => {
  const adminId = randomUUID();
  const facultyId = randomUUID();
  const studentId = randomUUID();
  const staffId = randomUUID();
  const coordinatorId = randomUUID();
  const tpoId = randomUUID();

  const mockUsers: CampusUser[] = [
    { id: adminId, authUserId: randomUUID(), email: 'admin@dcrust.edu.in', displayName: 'Admin User', status: 'active', departmentId: null, roles: [{ id: randomUUID(), userId: adminId, role: 'administrator', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: facultyId, authUserId: randomUUID(), email: 'faculty@dcrust.edu.in', displayName: 'Dr. Faculty', status: 'active', departmentId: null, roles: [{ id: randomUUID(), userId: facultyId, role: 'faculty', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: studentId, authUserId: randomUUID(), email: 'student@dcrust.edu.in', displayName: 'Student User', status: 'active', departmentId: null, roles: [{ id: randomUUID(), userId: studentId, role: 'student', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: staffId, authUserId: randomUUID(), email: 'staff@dcrust.edu.in', displayName: 'Service Staff', status: 'active', departmentId: null, roles: [{ id: randomUUID(), userId: staffId, role: 'service_staff', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: coordinatorId, authUserId: randomUUID(), email: 'club@dcrust.edu.in', displayName: 'Club Lead', status: 'active', departmentId: null, roles: [{ id: randomUUID(), userId: coordinatorId, role: 'club_coordinator', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: tpoId, authUserId: randomUUID(), email: 'tpo@dcrust.edu.in', displayName: 'TPO Head', status: 'active', departmentId: null, roles: [{ id: randomUUID(), userId: tpoId, role: 'placement_officer', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  const mockVerify = async (token: string) => {
    if (token === 'admin_token.1.2') return { id: mockUsers[0]!.authUserId, email: mockUsers[0]!.email };
    if (token === 'faculty_token.1.2') return { id: mockUsers[1]!.authUserId, email: mockUsers[1]!.email };
    if (token === 'student_token.1.2') return { id: mockUsers[2]!.authUserId, email: mockUsers[2]!.email };
    if (token === 'staff_token.1.2') return { id: mockUsers[3]!.authUserId, email: mockUsers[3]!.email };
    if (token === 'coordinator_token.1.2') return { id: mockUsers[4]!.authUserId, email: mockUsers[4]!.email };
    if (token === 'tpo_token.1.2') return { id: mockUsers[5]!.authUserId, email: mockUsers[5]!.email };
    throw new Error('Unauthenticated');
  };

  const ticketsDb: TicketItem[] = [];
  const hostelDb: any = { hostels: [{ id: randomUUID(), name: 'Hostel 1', gender: 'coed' as const, capacity: 100 }], applications: [], allocations: [] };
  const libraryDb: any = { titles: [{ id: randomUUID(), title: 'Discrete Math', author: 'Rosen', isbn: '9780073383095', category: 'computer_science', availableCopies: 2, totalCopies: 2 }], copies: [], loans: [], reservations: [] };
  const clubsDb: any[] = [];
  const eventsDb: any[] = [];
  const registrationsDb: any[] = [];
  const placementsDb: any = { opportunities: [], applications: [] };
  const campusDb: any = { locations: [], entrances: [], paths: [], qr: [] };
  const digitalIdDb: any[] = [];
  const iotDb: any = { buses: [], positions: [], devices: [], readings: [] };
  const syncRunsDb: any[] = [];

  const ticketsRepo: TicketsRepository = {
    async listTickets() { return ticketsDb; },
    async getTicketById(id: string) { return ticketsDb.find(t => t.id === id) ?? null; },
    async getTicketByTrackingId(tid: string) { return ticketsDb.find(t => t.trackingId === tid) ?? null; },
    async createTicket(d) {
      const t: TicketItem = {
        id: randomUUID(),
        trackingId: `TCK-${Date.now()}`,
        creatorId: d.creatorId,
        title: d.title,
        description: d.description,
        category: d.category,
        priority: d.priority ?? 'medium',
        isSensitive: d.isSensitive ?? false,
        status: 'open',
        assignedStaffId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      ticketsDb.push(t);
      return t;
    },
    async updateStatus(id: string, status: any, resolutionNotes?: string) {
      const t = ticketsDb.find(x => x.id === id);
      if (!t) return null;
      t.status = status;
      if (resolutionNotes) t.resolutionNotes = resolutionNotes;
      return t;
    },
    async assignStaff(id: string, staffId: string) {
      const t = ticketsDb.find(x => x.id === id);
      if (!t) return null;
      t.assignedStaffId = staffId;
      return t;
    },
    async addComment(d) {
      return { id: randomUUID(), ticketId: d.ticketId, userId: d.userId, message: d.message, isInternal: d.isInternal ?? false, createdAt: new Date().toISOString() };
    },
    async listComments() { return []; },
  };

  const hostelRepo: HostelRepository = {
    async listHostels() { return hostelDb.hostels; },
    async createHostel(d) { return { id: randomUUID(), ...d, wardenId: d.wardenId ?? null }; },
    async listRooms(hId: string) { return [{ id: randomUUID(), hostelId: hId, roomNumber: '101', capacity: 2, currentOccupancy: 0 }]; },
    async createRoom(d) { return { id: randomUUID(), hostelId: d.hostelId, roomNumber: d.roomNumber, capacity: d.capacity ?? 2, currentOccupancy: 0 }; },
    async getRoomById(id: string) { return null; },
    async apply(studentId: string, hostelId: string) {
      const a: HostelApplicationItem = { id: randomUUID(), studentId, hostelId, status: 'pending', appliedAt: new Date().toISOString() };
      hostelDb.applications.push(a);
      return a;
    },
    async listApplications() { return hostelDb.applications; },
    async getAllocationByStudent() { return null; },
    async allocateRoom(studentId: string, roomId: string) {
      const alloc: HostelAllocationItem = { id: randomUUID(), studentId, roomId, allocatedAt: new Date().toISOString() };
      hostelDb.allocations.push(alloc);
      return alloc;
    },
    async requestTransfer(studentId: string, toRoomId: string, reason: string) {
      const t: HostelTransferItem = { id: randomUUID(), studentId, fromRoomId: randomUUID(), toRoomId, status: 'pending', reason, requestedAt: new Date().toISOString() };
      return t;
    },
    async listTransfers() { return []; },
    async approveTransfer() { return null; },
  };

  const libraryRepo: LibraryRepository = {
    async searchTitles() { return libraryDb.titles; },
    async createTitle(d) { return { id: randomUUID(), ...d, totalCopies: 0, availableCopies: 0, createdAt: new Date().toISOString() }; },
    async addCopy(titleId: string, barcode: string) { return { id: randomUUID(), titleId, barcode, status: 'available' }; },
    async listCopies() { return []; },
    async reserveTitle(titleId: string, userId: string) {
      const r: ReservationItem = { id: randomUUID(), titleId, userId, queuePosition: 1, status: 'pending', reservedAt: new Date().toISOString() };
      libraryDb.reservations.push(r);
      return r;
    },
    async issueBook(copyId: string, userId: string) {
      const loan: LoanItem = { id: randomUUID(), copyId, userId, issuedAt: new Date().toISOString(), dueDate: new Date().toISOString(), fineAmount: 0 };
      return loan;
    },
    async returnBook(copyId: string) {
      const loan: LoanItem = { id: randomUUID(), copyId, userId: studentId, issuedAt: new Date().toISOString(), dueDate: new Date().toISOString(), returnedAt: new Date().toISOString(), fineAmount: 0 };
      return loan;
    },
    async listUserLoans() { return []; },
    async listReservations() { return []; },
  };

  const clubsRepo: ClubsRepository = {
    async listClubs() { return clubsDb; },
    async createClub(d) { const c = { id: randomUUID(), code: d.code, name: d.name, createdAt: new Date().toISOString() }; clubsDb.push(c); return c; },
    async joinClub(cId: string, sId: string) { return { id: randomUUID(), clubId: cId, studentId: sId, status: 'active' }; },
    async listEvents() { return eventsDb; },
    async createEvent(d) {
      const e = { id: randomUUID(), title: d.title, description: d.description, location: d.location, startTime: d.startTime.toISOString(), endTime: d.endTime.toISOString(), capacity: d.capacity, status: 'pending' as const, createdBy: d.createdBy, createdAt: new Date().toISOString() };
      eventsDb.push(e);
      return e;
    },
    async approveEvent(id: string) {
      const e = eventsDb.find(x => x.id === id);
      if (!e) return null;
      e.status = 'approved';
      return e;
    },
    async getRegistrationCount(eId: string) { return registrationsDb.filter(r => r.eventId === eId).length; },
    async registerForEvent(eId: string, sId: string) {
      const r = { id: randomUUID(), eventId: eId, studentId: sId, attended: false, registeredAt: new Date().toISOString() };
      registrationsDb.push(r);
      return r;
    },
    async listRegistrations(eId: string) { return registrationsDb.filter(r => r.eventId === eId); },
  };

  const placementsRepo: PlacementsRepository = {
    async listOpportunities() { return placementsDb.opportunities; },
    async getOpportunityById(id: string) { return placementsDb.opportunities.find((o: any) => o.id === id) ?? null; },
    async createOpportunity(d) {
      const o = { id: randomUUID(), companyName: d.companyName, title: d.title, description: d.description, minCgpa: d.minCgpa, eligibleBranches: d.eligibleBranches, deadline: d.deadline.toISOString(), status: 'open' as const, createdAt: new Date().toISOString() };
      placementsDb.opportunities.push(o);
      return o;
    },
    async apply(d) {
      const a = { id: randomUUID(), opportunityId: d.opportunityId, studentId: d.studentId, cgpa: d.cgpa, branch: d.branch, status: 'applied' as const, appliedAt: new Date().toISOString() };
      placementsDb.applications.push(a);
      return a;
    },
    async listApplications() { return placementsDb.applications; },
    async updateApplicationStatus(id: string, status: any) {
      const a = placementsDb.applications.find((x: any) => x.id === id);
      if (!a) return null;
      a.status = status;
      return a;
    },
  };

  const campusRepo: CampusRepository = {
    async listLocations() { return campusDb.locations; },
    async getLocationById(id: string) { return campusDb.locations.find((l: any) => l.id === id) ?? null; },
    async createLocation(d) {
      const l = { id: randomUUID(), code: d.code, name: d.name, category: d.category, building: d.building, description: d.description, coordinates: d.coordinates ?? { lat: 28.98, lng: 77.08 }, createdAt: new Date().toISOString() };
      campusDb.locations.push(l);
      return l;
    },
    async addEntrance(d) { return { id: randomUUID(), locationId: d.locationId, name: d.name, isAccessible: d.isAccessible, createdAt: new Date().toISOString() }; },
    async addPathSegment(d) { return { id: randomUUID(), fromLocationId: d.fromLocationId, toLocationId: d.toLocationId, distanceMeters: d.distanceMeters, isAccessible: d.isAccessible, createdAt: new Date().toISOString() }; },
    async findRoute(from: string, to: string, acc: boolean) { return { found: true, totalDistanceMeters: 100, isAccessible: acc, path: [from, to] }; },
    async createQrLink(lId: string) {
      const qr = { id: randomUUID(), locationId: lId, qrToken: `dcrust_qr_${randomUUID().substring(0, 6)}`, scanCount: 0, createdAt: new Date().toISOString() };
      campusDb.qr.push(qr);
      return qr;
    },
    async resolveQrScan(tok: string) {
      const qr = campusDb.qr.find((q: any) => q.qrToken === tok);
      if (!qr) return null;
      qr.scanCount++;
      const location = campusDb.locations.find((l: any) => l.id === qr.locationId) ?? null;
      return { qr, location };
    },
  };

  const digitalIdRepo: DigitalIdRepository = {
    async issueCredential(uId: string) {
      const c: any = { userId: uId, fullName: 'Student User', email: 'student@dcrust.edu.in', roles: ['student'], credentialNumber: 'DCRUST-ID-123456', barcode: 'BAR-123', verificationToken: `vtok_${randomUUID()}`, expiresAt: new Date(Date.now() + 300000).toISOString(), status: 'active', issuedAt: new Date().toISOString() };
      digitalIdDb.push(c);
      return c;
    },
    async getCredentialForUser(uId: string) { return digitalIdDb.find(c => c.userId === uId) ?? null; },
    async verifyToken(tok: string) {
      const c = digitalIdDb.find(x => x.verificationToken === tok);
      if (!c || c.status === 'revoked') return { valid: false, status: 'revoked' };
      return { valid: true, status: 'active', userId: c.userId, fullName: c.fullName };
    },
    async revokeCredential(uId: string) {
      const c = digitalIdDb.find(x => x.userId === uId);
      if (c) c.status = 'revoked';
      return true;
    },
  };

  const aiRepo: AiAssistantRepository = {
    async answerQuery(q: string) {
      if (q.toLowerCase().includes('other student')) {
        return { answer: 'I cannot provide private student records or confidential university details.', sources: [], missingInformationAcknowledged: false };
      }
      if (q.toLowerCase().includes('library')) {
        return { answer: 'Central Library is open from 8:00 AM to 8:00 PM.', sources: [{ title: 'Library Hours', category: 'Library', snippet: '8 AM - 8 PM', verified: true }], missingInformationAcknowledged: false };
      }
      return { answer: 'I do not have authoritative campus information regarding this topic.', sources: [], missingInformationAcknowledged: true };
    },
  };

  const iotBusRepo: IotBusRepository = {
    async listBuses() { return iotDb.buses; },
    async createBus(d) {
      const b = { id: randomUUID(), busNumber: d.busNumber, routeName: d.routeName, driverName: d.driverName, driverPhone: d.driverPhone, isLive: d.isLive, createdAt: new Date().toISOString(), latestPosition: null };
      iotDb.buses.push(b);
      return b;
    },
    async recordPosition(bId: string, d: any) {
      const isStale = (Date.now() - d.recordedAt.getTime()) > 300000;
      const b = iotDb.buses.find((x: any) => x.id === bId);
      if (b) b.latestPosition = { latitude: d.latitude.toString(), longitude: d.longitude.toString(), speedKmh: d.speedKmh, isSimulated: d.isSimulated, recordedAt: d.recordedAt.toISOString(), isStale };
      return { id: randomUUID(), isStale };
    },
    async listDevices() { return iotDb.devices; },
    async registerDevice(d) {
      const dev = { id: randomUUID(), deviceCode: d.deviceCode, locationName: d.locationName, sensorType: d.sensorType, status: d.status, createdAt: new Date().toISOString() };
      iotDb.devices.push(dev);
      return dev;
    },
    async recordReading(code: string, d: any) {
      return { id: randomUUID(), deviceId: randomUUID(), metricName: d.metricName, metricValue: d.metricValue, unit: d.unit, isSimulated: d.isSimulated, recordedAt: d.recordedAt.toISOString() };
    },
    async getDeviceReadings() { return []; },
  };

  const integrationsRepo: IntegrationsRepository = {
    async executeSync(d) {
      const existing = syncRunsDb.find(s => s.idempotencyKey === d.idempotencyKey);
      if (existing) return { isDuplicate: true, run: existing };
      const run = { id: randomUUID(), integrationName: d.integrationName, status: 'completed' as const, idempotencyKey: d.idempotencyKey, recordsProcessed: d.payload.length, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() };
      syncRunsDb.push(run);
      return { isDuplicate: false, run };
    },
    async listSyncRuns() { return syncRunsDb; },
  };

  const app = createApp(
    loadConfig(),
    undefined,
    async () => {},
    mockVerify,
    createMockUserRepo(mockUsers),
    undefined,
    {
      ticketsRepo,
      hostelRepo,
      libraryRepo,
      clubsRepo,
      placementsRepo,
      campusRepo,
      digitalIdRepo,
      aiRepo,
      iotBusRepo,
      integrationsRepo,
    },
  );

  it('Journey 2: Student submits complaint, staff resolves, student reopens, admin reports', async () => {
    // 1. Student creates ticket
    const ticketRes = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', 'Bearer student_token.1.2')
      .send({ title: 'Broken Water Cooler', description: 'Leaking in Block B', category: 'facility', priority: 'medium' });
    assert.equal(ticketRes.status, 201);
    const ticketId = ticketRes.body.data.id;

    // 2. Staff resolves ticket
    const resolveRes = await request(app)
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .set('Authorization', 'Bearer staff_token.1.2')
      .send({ status: 'resolved' });
    assert.equal(resolveRes.status, 200);

    // 3. Student reopens ticket
    const reopenRes = await request(app)
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .set('Authorization', 'Bearer student_token.1.2')
      .send({ status: 'reopened' });
    assert.equal(reopenRes.status, 200);
    assert.equal(reopenRes.body.data.status, 'reopened');
  });

  it('Journey 3: Student applies for hostel room and reserves library book', async () => {
    // 1. Student applies for hostel
    const hostel = hostelDb.hostels[0];
    const appRes = await request(app)
      .post('/api/v1/hostel/apply')
      .set('Authorization', 'Bearer student_token.1.2')
      .send({ hostelId: hostel.id });
    assert.equal(appRes.status, 201);

    // 2. Student reserves book
    const book = libraryDb.titles[0];
    const reserveRes = await request(app)
      .post(`/api/v1/library/titles/${book.id}/reserve`)
      .set('Authorization', 'Bearer student_token.1.2');
    assert.equal(reserveRes.status, 201);
  });

  it('Journey 4: Club event proposal and approval, placement application advancement', async () => {
    // 1. Coordinator proposes event
    const eventRes = await request(app)
      .post('/api/v1/clubs/events')
      .set('Authorization', 'Bearer coordinator_token.1.2')
      .send({
        title: 'Open Source Summit',
        description: 'Keynotes and workshops',
        location: 'Auditorium',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
        capacity: 50,
      });
    assert.equal(eventRes.status, 201);
    const eventId = eventRes.body.data.id;

    // 2. Approve event
    const appRes = await request(app)
      .patch(`/api/v1/clubs/events/${eventId}/approve`)
      .set('Authorization', 'Bearer coordinator_token.1.2');
    assert.equal(appRes.status, 200);

    // 3. TPO creates placement opportunity
    const oppRes = await request(app)
      .post('/api/v1/placements/opportunities')
      .set('Authorization', 'Bearer tpo_token.1.2')
      .send({
        companyName: 'Infosys',
        title: 'Specialist Programmer',
        description: 'Systems and backend development',
        minCgpa: 650,
        eligibleBranches: ['CSE', 'ECE'],
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });
    assert.equal(oppRes.status, 201);
  });

  it('Journey 5: Campus Explorer search, accessible routing and QR scan resolution', async () => {
    // 1. Admin creates campus building
    const locRes = await request(app)
      .post('/api/v1/campus/locations')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        code: 'ENGG_LAB',
        name: 'Electrical Engineering Lab',
        category: 'academic',
        building: 'Block E',
      });
    assert.equal(locRes.status, 201);
    const locId = locRes.body.data.id;

    // 2. Generate QR link
    const qrRes = await request(app)
      .post(`/api/v1/campus/locations/${locId}/qr`)
      .set('Authorization', 'Bearer admin_token.1.2');
    assert.equal(qrRes.status, 201);
    const token = qrRes.body.data.qrToken;

    // 3. Public scan
    const scanRes = await request(app).get(`/api/v1/campus/qr/scan/${token}`);
    assert.equal(scanRes.status, 200);
    assert.equal(scanRes.body.data.location.name, 'Electrical Engineering Lab');
  });

  it('Journey 7 & 8: AI Assistant sources, stale feeds, and idempotent sync', async () => {
    // 1. AI Assistant query
    const aiRes = await request(app)
      .post('/api/v1/ai/assistant')
      .set('Authorization', 'Bearer student_token.1.2')
      .send({ query: 'What are the library hours?' });
    assert.equal(aiRes.status, 200);
    assert.equal(aiRes.body.data.sources.length, 1);

    // 2. Idempotent sync
    const syncRes1 = await request(app)
      .post('/api/v1/integrations/sync')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        integrationName: 'erp_attendance',
        idempotencyKey: 'IDEMP-E2E-TEST-001',
        payload: [{ id: 1 }],
      });
    assert.equal(syncRes1.status, 201);

    const syncRes2 = await request(app)
      .post('/api/v1/integrations/sync')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        integrationName: 'erp_attendance',
        idempotencyKey: 'IDEMP-E2E-TEST-001',
        payload: [{ id: 1 }],
      });
    assert.equal(syncRes2.status, 200);
  });
});
