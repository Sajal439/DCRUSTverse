import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config/env.ts';
import type { Logger } from '../src/types/logger.ts';
import type { CampusUser } from '../src/types/auth.ts';
import type { CampusUserRepository } from '../src/modules/auth/repositories/user.repository.ts';
import type { HostelRepository, HostelItem, HostelRoomItem, HostelApplicationItem, HostelAllocationItem, HostelTransferItem } from '../src/modules/hostel/repositories/hostel.repository.ts';
import type { LibraryRepository, LibraryTitleItem, BookCopyItem, LoanItem, ReservationItem } from '../src/modules/library/repositories/library.repository.ts';
import type { TicketsRepository, TicketItem, TicketCommentItem } from '../src/modules/tickets/repositories/tickets.repository.ts';
import type { FacilitiesRepository, FacilityItem, FacilityBookingItem } from '../src/modules/facilities/repositories/facilities.repository.ts';
import type { DocumentsRepository, DocumentRequestItem } from '../src/modules/documents/repositories/documents.repository.ts';
import type { AuditRepository, AuditLogItem } from '../src/modules/audit/controllers/audit.controller.ts';

const silent: Logger = { info() {}, error() {} };

function authVerifier(currentUser?: CampusUser) {
  return async () => {
    if (!currentUser) throw new Error('Unauthenticated');
    return { id: currentUser.authUserId, email: currentUser.email };
  };
}

const adminId = randomUUID();
const studentId = randomUUID();
const otherStudentId = randomUUID();
const wardenId = randomUUID();
const librarianId = randomUUID();

const adminUser: CampusUser = {
  id: adminId,
  authUserId: 'auth-adm-p3',
  email: 'admin@dcrust.ac.in',
  displayName: 'Admin Staff',
  departmentId: null,
  status: 'active',
  roles: [{ id: randomUUID(), userId: adminId, role: 'administrator', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const studentUser: CampusUser = {
  id: studentId,
  authUserId: 'auth-stu-p3',
  email: 'student@dcrust.ac.in',
  displayName: 'Kavita Singh',
  departmentId: null,
  status: 'active',
  roles: [{ id: randomUUID(), userId: studentId, role: 'student', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const otherStudentUser: CampusUser = {
  id: otherStudentId,
  authUserId: 'auth-other-stu-p3',
  email: 'otherstudent@dcrust.ac.in',
  displayName: 'Vikas Kumar',
  departmentId: null,
  status: 'active',
  roles: [{ id: randomUUID(), userId: otherStudentId, role: 'student', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const wardenUser: CampusUser = {
  id: wardenId,
  authUserId: 'auth-warden-p3',
  email: 'warden@dcrust.ac.in',
  displayName: 'Hostel Warden',
  departmentId: null,
  status: 'active',
  roles: [{ id: randomUUID(), userId: wardenId, role: 'hostel_warden', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const librarianUser: CampusUser = {
  id: librarianId,
  authUserId: 'auth-lib-p3',
  email: 'librarian@dcrust.ac.in',
  displayName: 'Chief Librarian',
  departmentId: null,
  status: 'active',
  roles: [{ id: randomUUID(), userId: librarianId, role: 'librarian', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function createMockUserRepo(): CampusUserRepository {
  const users = [adminUser, studentUser, otherStudentUser, wardenUser, librarianUser];
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

function createMockHostelRepo(): HostelRepository {
  const hsts: HostelItem[] = [];
  const rms: HostelRoomItem[] = [];
  const apps: HostelApplicationItem[] = [];
  const allocs: HostelAllocationItem[] = [];
  const transfers: HostelTransferItem[] = [];

  return {
    async listHostels() { return [...hsts]; },
    async createHostel(data) {
      const item: HostelItem = { id: randomUUID(), ...data, wardenId: data.wardenId ?? null };
      hsts.push(item);
      return item;
    },
    async listRooms(hostelId) { return rms.filter(r => r.hostelId === hostelId); },
    async createRoom(data) {
      const item: HostelRoomItem = { id: randomUUID(), hostelId: data.hostelId, roomNumber: data.roomNumber, capacity: data.capacity ?? 2, currentOccupancy: 0 };
      rms.push(item);
      return item;
    },
    async getRoomById(id) { return rms.find(r => r.id === id) ?? null; },
    async apply(sId, hId) {
      const item: HostelApplicationItem = { id: randomUUID(), studentId: sId, hostelId: hId, status: 'pending', appliedAt: new Date().toISOString() };
      apps.push(item);
      return item;
    },
    async listApplications() { return [...apps]; },
    async getAllocationByStudent(sId) { return allocs.find(a => a.studentId === sId) ?? null; },
    async allocateRoom(sId, rId) {
      const room = rms.find(r => r.id === rId);
      if (!room) throw new Error('Room not found');
      if (room.currentOccupancy >= room.capacity) throw new Error('Room has reached full capacity');
      room.currentOccupancy++;
      const item: HostelAllocationItem = { id: randomUUID(), studentId: sId, roomId: rId, allocatedAt: new Date().toISOString() };
      allocs.push(item);
      return item;
    },
    async requestTransfer(sId, toRoomId, reason) {
      const cur = allocs.find(a => a.studentId === sId);
      if (!cur) throw new Error('No active allocation');
      const item: HostelTransferItem = {
        id: randomUUID(),
        studentId: sId,
        fromRoomId: cur.roomId,
        toRoomId,
        reason,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };
      transfers.push(item);
      return item;
    },
    async listTransfers() { return [...transfers]; },
    async approveTransfer(tId, rId) {
      const t = transfers.find(item => item.id === tId);
      if (!t || t.status !== 'pending') return null;
      const targetRoom = rms.find(r => r.id === t.toRoomId);
      if (!targetRoom || targetRoom.currentOccupancy >= targetRoom.capacity) throw new Error('Target room is at full capacity');
      const oldRoom = rms.find(r => r.id === t.fromRoomId);
      if (oldRoom) oldRoom.currentOccupancy = Math.max(0, oldRoom.currentOccupancy - 1);
      targetRoom.currentOccupancy++;
      const alloc = allocs.find(a => a.studentId === t.studentId);
      if (alloc) alloc.roomId = t.toRoomId;
      t.status = 'approved';
      t.reviewedBy = rId;
      t.reviewedAt = new Date().toISOString();
      return t;
    },
  };
}

function createMockLibraryRepo(): LibraryRepository {
  const titles: LibraryTitleItem[] = [];
  const copies: BookCopyItem[] = [];
  const loanList: LoanItem[] = [];
  const resList: ReservationItem[] = [];

  return {
    async searchTitles(q) {
      return titles.filter(t => !q || t.title.toLowerCase().includes(q.toLowerCase()) || t.author.toLowerCase().includes(q.toLowerCase()));
    },
    async createTitle(data) {
      const item: LibraryTitleItem = {
        id: randomUUID(),
        isbn: data.isbn,
        title: data.title,
        author: data.author,
        category: data.category,
        totalCopies: data.totalCopies ?? 1,
        availableCopies: data.totalCopies ?? 1,
      };
      titles.push(item);
      return item;
    },
    async addCopy(titleId, barcode) {
      const item: BookCopyItem = { id: randomUUID(), titleId, barcode, status: 'available' };
      copies.push(item);
      return item;
    },
    async listCopies(titleId) { return copies.filter(c => c.titleId === titleId); },
    async issueBook(copyId, userId, days = 14) {
      const copy = copies.find(c => c.id === copyId);
      if (!copy) throw new Error('Copy not found');
      if (copy.status !== 'available') throw new Error('Copy is not available');
      copy.status = 'issued';
      const title = titles.find(t => t.id === copy.titleId);
      if (title) title.availableCopies = Math.max(0, title.availableCopies - 1);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);
      const loan: LoanItem = {
        id: randomUUID(),
        copyId,
        userId,
        issuedAt: new Date().toISOString(),
        dueDate: dueDate.toISOString(),
        fineAmount: 0,
      };
      loanList.push(loan);
      return loan;
    },
    async returnBook(copyId) {
      const loan = loanList.find(l => l.copyId === copyId && !l.returnedAt);
      if (!loan) return null;
      loan.returnedAt = new Date().toISOString();
      const copy = copies.find(c => c.id === copyId);
      if (copy) {
        copy.status = 'available';
        const title = titles.find(t => t.id === copy.titleId);
        if (title) {
          title.availableCopies++;
          const res = resList.find(r => r.titleId === title.id && r.status === 'pending');
          if (res) res.status = 'fulfilled';
        }
      }
      return loan;
    },
    async listUserLoans(userId) { return loanList.filter(l => l.userId === userId); },
    async reserveTitle(titleId, userId) {
      const count = resList.filter(r => r.titleId === titleId && r.status === 'pending').length;
      const item: ReservationItem = {
        id: randomUUID(),
        titleId,
        userId,
        queuePosition: count + 1,
        status: 'pending',
        reservedAt: new Date().toISOString(),
      };
      resList.push(item);
      return item;
    },
    async listReservations(titleId) { return resList.filter(r => r.titleId === titleId); },
  };
}

function createMockTicketsRepo(): TicketsRepository {
  const ticketList: TicketItem[] = [];
  const commentList: TicketCommentItem[] = [];

  return {
    async createTicket(data) {
      const item: TicketItem = {
        id: randomUUID(),
        trackingId: `TKT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        creatorId: data.creatorId,
        category: data.category,
        priority: data.priority ?? 'medium',
        status: 'open',
        isSensitive: data.isSensitive ?? (data.category === 'harassment'),
        title: data.title,
        description: data.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      ticketList.push(item);
      return item;
    },
    async getTicketById(id) { return ticketList.find(t => t.id === id) ?? null; },
    async getTicketByTrackingId(tid) { return ticketList.find(t => t.trackingId === tid) ?? null; },
    async listTickets(filters = {}) {
      return ticketList.filter(t => {
        if (filters.creatorId && t.creatorId !== filters.creatorId) return false;
        if (filters.status && t.status !== filters.status) return false;
        return true;
      });
    },
    async updateStatus(id, status, notes) {
      const t = ticketList.find(item => item.id === id);
      if (!t) return null;
      t.status = status;
      if (notes) t.resolutionNotes = notes;
      t.updatedAt = new Date().toISOString();
      return t;
    },
    async assignStaff(id, sId) {
      const t = ticketList.find(item => item.id === id);
      if (!t) return null;
      t.assignedStaffId = sId;
      t.updatedAt = new Date().toISOString();
      return t;
    },
    async addComment(data) {
      const item: TicketCommentItem = {
        id: randomUUID(),
        ticketId: data.ticketId,
        userId: data.userId,
        message: data.message,
        isInternal: data.isInternal ?? false,
        createdAt: new Date().toISOString(),
      };
      commentList.push(item);
      return item;
    },
    async listComments(ticketId, incInternal = false) {
      return commentList.filter(c => c.ticketId === ticketId && (incInternal || !c.isInternal));
    },
  };
}

function createMockFacilitiesRepo(): FacilitiesRepository {
  const facs: FacilityItem[] = [];
  const bks: FacilityBookingItem[] = [];

  return {
    async listFacilities() { return [...facs]; },
    async createFacility(data) {
      const item: FacilityItem = { id: randomUUID(), ...data };
      facs.push(item);
      return item;
    },
    async getFacilityById(id) { return facs.find(f => f.id === id) ?? null; },
    async hasBookingConflict(facilityId, startTime, endTime) {
      return bks.some(b => b.facilityId === facilityId && b.status === 'approved' && new Date(b.startTime) < endTime && new Date(b.endTime) > startTime);
    },
    async requestBooking(data) {
      const item: FacilityBookingItem = {
        id: randomUUID(),
        facilityId: data.facilityId,
        userId: data.userId,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        purpose: data.purpose,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      bks.push(item);
      return item;
    },
    async listBookings(filters = {}) {
      return bks.filter(b => {
        if (filters.facilityId && b.facilityId !== filters.facilityId) return false;
        if (filters.userId && b.userId !== filters.userId) return false;
        if (filters.status && b.status !== filters.status) return false;
        return true;
      });
    },
    async updateBookingStatus(id, status, rId) {
      const b = bks.find(item => item.id === id);
      if (!b) return null;
      b.status = status;
      if (rId) {
        b.reviewedBy = rId;
        b.reviewedAt = new Date().toISOString();
      }
      return b;
    },
  };
}

function createMockDocumentsRepo(): DocumentsRepository {
  const docs: DocumentRequestItem[] = [];
  return {
    async createRequest(data) {
      const item: DocumentRequestItem = {
        id: randomUUID(),
        userId: data.userId,
        documentType: data.documentType,
        purpose: data.purpose,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      docs.push(item);
      return item;
    },
    async getRequestById(id) { return docs.find(d => d.id === id) ?? null; },
    async listRequests(filters = {}) {
      return docs.filter(d => {
        if (filters.userId && d.userId !== filters.userId) return false;
        if (filters.status && d.status !== filters.status) return false;
        return true;
      });
    },
    async reviewRequest(id, status, rId, fileUrl) {
      const d = docs.find(item => item.id === id);
      if (!d) return null;
      d.status = status;
      d.reviewedBy = rId;
      d.reviewedAt = new Date().toISOString();
      if (fileUrl) d.issuedFileUrl = fileUrl;
      return d;
    },
  };
}

function createMockAuditRepo(): AuditRepository {
  const logs: AuditLogItem[] = [
    {
      id: randomUUID(),
      actorId: adminId,
      action: 'hostel.allocated',
      targetType: 'hostel_allocation',
      targetId: 'alloc-1',
      details: { studentId },
      createdAt: new Date().toISOString(),
    },
  ];
  return {
    async listAuditEvents() {
      return { events: logs, total: logs.length };
    },
  };
}

test('F08 Hostel: capacity bounds, double-allocation denial, and atomic transfer', async () => {
  const userRepo = createMockUserRepo();
  const hostelRepo = createMockHostelRepo();
  const appWarden = createApp(loadConfig({}), silent, undefined, authVerifier(wardenUser), userRepo, undefined, { hostelRepo });
  const appStudent = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo, undefined, { hostelRepo });

  // 1. Warden creates hostel & 2 rooms (room 1 capacity 1; room 2 capacity 1)
  const hRes = await request(appWarden)
    .post('/api/v1/hostel')
    .set('Authorization', 'Bearer token.1.2')
    .send({ name: 'Sir CV Raman Hall', gender: 'male', capacity: 100 })
    .expect(201);
  const hostelId = hRes.body.data.id;

  const r1Res = await request(appWarden)
    .post(`/api/v1/hostel/${hostelId}/rooms`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ hostelId, roomNumber: '101', capacity: 1 })
    .expect(201);
  const room1Id = r1Res.body.data.id;

  const r2Res = await request(appWarden)
    .post(`/api/v1/hostel/${hostelId}/rooms`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ hostelId, roomNumber: '102', capacity: 1 })
    .expect(201);
  const room2Id = r2Res.body.data.id;

  // 2. Warden allocates student to room 1
  await request(appWarden)
    .post('/api/v1/hostel/allocate')
    .set('Authorization', 'Bearer token.1.2')
    .send({ studentId, roomId: room1Id })
    .expect(201);

  // 3. Double allocation check: student cannot be allocated a second room
  const doubleAllocRes = await request(appWarden)
    .post('/api/v1/hostel/allocate')
    .set('Authorization', 'Bearer token.1.2')
    .send({ studentId, roomId: room2Id })
    .expect(409);
  assert.equal(doubleAllocRes.body.error.code, 'ALREADY_ALLOCATED');

  // 4. Capacity limit: another student cannot take room 1 (capacity 1 reached)
  const appOtherStudent = createApp(loadConfig({}), silent, undefined, authVerifier(otherStudentUser), userRepo, undefined, { hostelRepo });
  const overCapRes = await request(appWarden)
    .post('/api/v1/hostel/allocate')
    .set('Authorization', 'Bearer token.1.2')
    .send({ studentId: otherStudentId, roomId: room1Id })
    .expect(400);
  assert.equal(overCapRes.body.error.code, 'ALLOCATION_FAILED');

  // 5. Student requests transfer to room 2
  const transReqRes = await request(appStudent)
    .post('/api/v1/hostel/transfers')
    .set('Authorization', 'Bearer token.1.2')
    .send({ toRoomId: room2Id, reason: 'Prefer floor 1 east facing room' })
    .expect(201);
  const transferId = transReqRes.body.data.id;

  // 6. Warden approves transfer -> room 1 becomes vacant, room 2 occupied
  await request(appWarden)
    .patch(`/api/v1/hostel/transfers/${transferId}/approve`)
    .set('Authorization', 'Bearer token.1.2')
    .expect(200);

  // Now other student can successfully take room 1!
  await request(appWarden)
    .post('/api/v1/hostel/allocate')
    .set('Authorization', 'Bearer token.1.2')
    .send({ studentId: otherStudentId, roomId: room1Id })
    .expect(201);
});

test('F09 Library: catalogue, copy issue, return and reservation queue progression', async () => {
  const userRepo = createMockUserRepo();
  const libraryRepo = createMockLibraryRepo();
  const appLib = createApp(loadConfig({}), silent, undefined, authVerifier(librarianUser), userRepo, undefined, { libraryRepo });
  const appStudent = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo, undefined, { libraryRepo });

  // 1. Librarian creates book title with 1 copy
  const titleRes = await request(appLib)
    .post('/api/v1/library/titles')
    .set('Authorization', 'Bearer token.1.2')
    .send({ isbn: '978-0131103627', title: 'The C Programming Language', author: 'Kernighan & Ritchie', category: 'CS' })
    .expect(201);
  const titleId = titleRes.body.data.id;

  const copyRes = await request(appLib)
    .post(`/api/v1/library/titles/${titleId}/copies`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ barcode: 'BC-001' })
    .expect(201);
  const copyId = copyRes.body.data.id;

  // 2. Student reserves title
  await request(appStudent)
    .post(`/api/v1/library/titles/${titleId}/reserve`)
    .set('Authorization', 'Bearer token.1.2')
    .expect(201);

  // 3. Librarian issues copy to student
  await request(appLib)
    .post('/api/v1/library/issue')
    .set('Authorization', 'Bearer token.1.2')
    .send({ copyId, userId: studentId, days: 14 })
    .expect(201);

  // 4. Prevent duplicate loan of same copy
  const dupLoanRes = await request(appLib)
    .post('/api/v1/library/issue')
    .set('Authorization', 'Bearer token.1.2')
    .send({ copyId, userId: otherStudentId, days: 14 })
    .expect(409);
  assert.equal(dupLoanRes.body.error.code, 'ISSUE_FAILED');

  // 5. Librarian returns copy -> advances reservation queue
  await request(appLib)
    .post('/api/v1/library/return')
    .set('Authorization', 'Bearer token.1.2')
    .send({ copyId })
    .expect(200);
});

test('F10 Complaints: sensitive ticket isolation, status workflow and internal notes', async () => {
  const userRepo = createMockUserRepo();
  const ticketsRepo = createMockTicketsRepo();
  const appStudent = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo, undefined, { ticketsRepo });
  const appOtherStudent = createApp(loadConfig({}), silent, undefined, authVerifier(otherStudentUser), userRepo, undefined, { ticketsRepo });
  const appAdmin = createApp(loadConfig({}), silent, undefined, authVerifier(adminUser), userRepo, undefined, { ticketsRepo });

  // 1. Student creates sensitive ticket
  const ticketRes = await request(appStudent)
    .post('/api/v1/tickets')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      category: 'harassment',
      title: 'Confidential reporting',
      description: 'Private report requiring sensitive handling',
      isSensitive: true,
    })
    .expect(201);
  const ticketId = ticketRes.body.data.id;
  assert.equal(ticketRes.body.data.isSensitive, true);

  // 2. Another student cannot access sensitive ticket -> 403 SENSITIVE_TICKET_FORBIDDEN
  const blockedRes = await request(appOtherStudent)
    .get(`/api/v1/tickets/${ticketId}`)
    .set('Authorization', 'Bearer token.1.2')
    .expect(403);
  assert.equal(blockedRes.body.error.code, 'SENSITIVE_TICKET_FORBIDDEN');

  // 3. Admin can access
  await request(appAdmin)
    .get(`/api/v1/tickets/${ticketId}`)
    .set('Authorization', 'Bearer token.1.2')
    .expect(200);

  // 4. Admin posts internal staff note
  await request(appAdmin)
    .post(`/api/v1/tickets/${ticketId}/comments`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ message: 'Internal investigation ongoing', isInternal: true })
    .expect(201);

  // 5. Student cannot post internal staff note -> 403 FORBIDDEN
  const studentNoteRes = await request(appStudent)
    .post(`/api/v1/tickets/${ticketId}/comments`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ message: 'Attempt internal note', isInternal: true })
    .expect(403);
  assert.equal(studentNoteRes.body.error.code, 'FORBIDDEN');

  // 6. Admin resolves ticket
  await request(appAdmin)
    .patch(`/api/v1/tickets/${ticketId}/status`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ status: 'resolved', resolutionNotes: 'Addressed and action taken' })
    .expect(200);

  // 7. Student reopens ticket
  const reopenRes = await request(appStudent)
    .patch(`/api/v1/tickets/${ticketId}/status`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ status: 'reopened' })
    .expect(200);
  assert.equal(reopenRes.body.data.status, 'reopened');
});

test('F23 Facilities: booking collision detection and approval', async () => {
  const userRepo = createMockUserRepo();
  const facilitiesRepo = createMockFacilitiesRepo();
  const appAdmin = createApp(loadConfig({}), silent, undefined, authVerifier(adminUser), userRepo, undefined, { facilitiesRepo });
  const appStudent = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo, undefined, { facilitiesRepo });

  // 1. Admin creates Auditorium
  const facRes = await request(appAdmin)
    .post('/api/v1/facilities')
    .set('Authorization', 'Bearer token.1.2')
    .send({ code: 'AUD-01', name: 'Main Auditorium', type: 'auditorium', capacity: 800 })
    .expect(201);
  const facilityId = facRes.body.data.id;

  // 2. Student requests booking for Friday 14:00 - 18:00
  const start = new Date(Date.now() + 50000000);
  const end = new Date(Date.now() + 64400000);

  const bookRes = await request(appStudent)
    .post('/api/v1/facilities/bookings')
    .set('Authorization', 'Bearer token.1.2')
    .send({ facilityId, startTime: start.toISOString(), endTime: end.toISOString(), purpose: 'Annual Tech Fest' })
    .expect(201);
  const bookingId = bookRes.body.data.id;

  // 3. Admin approves booking
  await request(appAdmin)
    .patch(`/api/v1/facilities/bookings/${bookingId}/review`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ status: 'approved' })
    .expect(200);

  // 4. Overlapping booking attempt rejected -> 409 BOOKING_CONFLICT
  const overlapRes = await request(appStudent)
    .post('/api/v1/facilities/bookings')
    .set('Authorization', 'Bearer token.1.2')
    .send({ facilityId, startTime: new Date(Date.now() + 55000000).toISOString(), endTime: new Date(Date.now() + 70000000).toISOString(), purpose: 'Clash event' })
    .expect(409);
  assert.equal(overlapRes.body.error.code, 'BOOKING_CONFLICT');
});

test('F24 Documents: certificate request, progress and secure isolation', async () => {
  const userRepo = createMockUserRepo();
  const documentsRepo = createMockDocumentsRepo();
  const appStudent = createApp(loadConfig({}), silent, undefined, authVerifier(studentUser), userRepo, undefined, { documentsRepo });
  const appOtherStudent = createApp(loadConfig({}), silent, undefined, authVerifier(otherStudentUser), userRepo, undefined, { documentsRepo });
  const appAdmin = createApp(loadConfig({}), silent, undefined, authVerifier(adminUser), userRepo, undefined, { documentsRepo });

  // 1. Student requests Bonafide Certificate
  const docReq = await request(appStudent)
    .post('/api/v1/documents')
    .set('Authorization', 'Bearer token.1.2')
    .send({ documentType: 'bonafide', purpose: 'Passport application verification' })
    .expect(201);
  const docId = docReq.body.data.id;

  // 2. Other student cannot inspect request -> 403 FORBIDDEN
  const sneakRes = await request(appOtherStudent)
    .get(`/api/v1/documents/${docId}`)
    .set('Authorization', 'Bearer token.1.2')
    .expect(403);
  assert.equal(sneakRes.body.error.code, 'FORBIDDEN');

  // 3. Admin reviews (approves) and then issues document with URL
  await request(appAdmin)
    .patch(`/api/v1/documents/${docId}/review`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ status: 'approved' })
    .expect(200);

  const issueRes = await request(appAdmin)
    .patch(`/api/v1/documents/${docId}/review`)
    .set('Authorization', 'Bearer token.1.2')
    .send({ status: 'issued', issuedFileUrl: 'campus-file:11111111-1111-4111-a111-111111111111' })
    .expect(200);
  assert.equal(issueRes.body.data.status, 'issued');
  assert.equal(issueRes.body.data.issuedFileUrl, 'campus-file:11111111-1111-4111-a111-111111111111');
});

test('F20 & F21: audit trail query and bulk CSV formula injection sanitization', async () => {
  const userRepo = createMockUserRepo();
  const auditRepo = createMockAuditRepo();
  const appAdmin = createApp(loadConfig({}), silent, undefined, authVerifier(adminUser), userRepo, undefined, { auditRepo });

  // 1. Admin queries audit logs
  const auditRes = await request(appAdmin)
    .get('/api/v1/audit-events')
    .set('Authorization', 'Bearer token.1.2')
    .expect(200);
  assert.equal(auditRes.body.data.length, 1);
  assert.equal(auditRes.body.data[0].action, 'hostel.allocated');

  // 2. Bulk CSV validate import
  const csvRes = await request(appAdmin)
    .post('/api/v1/bulk/validate-import')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      rows: [
        { email: 'user1@dcrust.ac.in', displayName: 'Valid User', role: 'student' },
        { email: 'invalid-email', displayName: 'Bad Row' },
      ],
    })
    .expect(200);

  assert.equal(csvRes.body.data.validCount, 1);
  assert.equal(csvRes.body.data.errorCount, 1);

  // 3. Bulk CSV sanitize export escapes spreadsheet formula injections
  const sanitizeRes = await request(appAdmin)
    .post('/api/v1/bulk/sanitize-export')
    .set('Authorization', 'Bearer token.1.2')
    .send({
      rows: [
        { displayName: '=cmd|/c calc!A0', role: '+admin' },
      ],
    })
    .expect(200);

  assert.equal(sanitizeRes.body.data[0].displayName, "'=cmd|/c calc!A0");
  assert.equal(sanitizeRes.body.data[0].role, "'+admin");
});
