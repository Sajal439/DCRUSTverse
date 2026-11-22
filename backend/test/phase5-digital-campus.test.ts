import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config/env.ts';
import type { CampusUser } from '../src/types/auth.ts';
import type { CampusUserRepository } from '../src/modules/auth/repositories/user.repository.ts';
import type { CampusRepository, LocationRecord, EntranceRecord, PathSegmentRecord, QrLinkRecord } from '../src/modules/campus/repositories/campus.repository.ts';
import type { DigitalIdRepository, DigitalIdCard } from '../src/modules/digital-id/repositories/digital-id.repository.ts';

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

describe('Phase 5: Digital Campus (F14, F15, F31, F32, F36)', () => {
  const adminId = randomUUID();
  const studentId = randomUUID();

  const mockUsers: CampusUser[] = [
    {
      id: adminId,
      authUserId: randomUUID(),
      email: 'admin@dcrust.edu.in',
      displayName: 'Campus Admin',
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
      displayName: 'Aarav Patel',
      status: 'active',
      departmentId: null,
      roles: [{ id: randomUUID(), userId: studentId, role: 'student', scopeType: 'global', scopeId: null, createdAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockVerify = async (token: string) => {
    if (token === 'admin_token.1.2') return { id: mockUsers[0]!.authUserId, email: mockUsers[0]!.email };
    if (token === 'student_token.1.2') return { id: mockUsers[1]!.authUserId, email: mockUsers[1]!.email };
    throw new Error('Unauthenticated');
  };

  // Mock Campus Repo
  const locationsDb: LocationRecord[] = [];
  const entrancesDb: EntranceRecord[] = [];
  const pathsDb: PathSegmentRecord[] = [];
  const qrDb: QrLinkRecord[] = [];

  const campusRepo: CampusRepository = {
    async listPaths() { return []; },
    async listLocations(filters = {}) {
      if (filters.category) return locationsDb.filter(l => l.category === filters.category);
      return locationsDb;
    },
    async getLocationById(id) {
      const loc = locationsDb.find(l => l.id === id);
      if (!loc) return null;
      return {
        ...loc,
        entrances: entrancesDb.filter(e => e.locationId === id),
      };
    },
    async createLocation(data) {
      const loc: LocationRecord = {
        id: randomUUID(),
        code: data.code,
        name: data.name,
        category: data.category,
        building: data.building,
        description: data.description,
        coordinates: data.coordinates ?? { lat: 28.98, lng: 77.08 },
        openingHours: data.openingHours,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        createdAt: new Date().toISOString(),
      };
      locationsDb.push(loc);
      return loc;
    },
    async addEntrance(data) {
      const ent: EntranceRecord = {
        id: randomUUID(),
        locationId: data.locationId,
        name: data.name,
        isAccessible: data.isAccessible,
        createdAt: new Date().toISOString(),
      };
      entrancesDb.push(ent);
      return ent;
    },
    async addPathSegment(data) {
      const path: PathSegmentRecord = {
        id: randomUUID(),
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        distanceMeters: data.distanceMeters,
        isAccessible: data.isAccessible,
        createdAt: new Date().toISOString(),
      };
      pathsDb.push(path);
      return path;
    },
    async findRoute(fromLocationId, toLocationId, accessibleOnly) {
      if (fromLocationId === toLocationId) {
        return { found: true, totalDistanceMeters: 0, isAccessible: true, path: [fromLocationId] };
      }
      const segs = accessibleOnly ? pathsDb.filter(p => p.isAccessible) : pathsDb;
      const direct = segs.find(s => (s.fromLocationId === fromLocationId && s.toLocationId === toLocationId) || (s.fromLocationId === toLocationId && s.toLocationId === fromLocationId));
      if (direct) {
        return { found: true, totalDistanceMeters: direct.distanceMeters, isAccessible: direct.isAccessible, path: [fromLocationId, toLocationId] };
      }
      return { found: false, totalDistanceMeters: 0, isAccessible: false, path: [], missingRouteData: true };
    },
    async createQrLink(locationId) {
      const qr: QrLinkRecord = {
        id: randomUUID(),
        locationId,
        qrToken: `dcrust_loc_${randomUUID().substring(0, 8)}`,
        scanCount: 0,
        createdAt: new Date().toISOString(),
      };
      qrDb.push(qr);
      return qr;
    },
    async resolveQrScan(qrToken) {
      const qr = qrDb.find(q => q.qrToken === qrToken);
      if (!qr) return null;
      qr.scanCount++;
      const location = await this.getLocationById(qr.locationId);
      return { qr, location };
    },
  };

  // Mock Digital ID Repo
  const credentialsDb: DigitalIdCard[] = [];

  const digitalIdRepo: DigitalIdRepository = {
    async issueCredential(userId) {
      const existing = credentialsDb.find(c => c.userId === userId && c.status === 'active');
      if (existing) existing.status = 'revoked';

      const card: DigitalIdCard = {
        userId,
        fullName: 'Aarav Patel',
        email: 'student@dcrust.edu.in',
        rollNumber: '21001001001',
        departmentName: 'Computer Science and Engineering',
        roles: ['student'],
        credentialNumber: `DCRUST-ID-${Math.floor(100000 + Math.random() * 900000)}`,
        barcode: 'BAR-12345678',
        verificationToken: `vtoken_${randomUUID()}`,
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        status: 'active',
        issuedAt: new Date().toISOString(),
      };
      credentialsDb.push(card);
      return card;
    },
    async getCredentialForUser(userId) {
      return credentialsDb.find(c => c.userId === userId && c.status === 'active') ?? null;
    },
    async verifyToken(token) {
      const cred = credentialsDb.find(c => c.verificationToken === token);
      if (!cred) return { valid: false, status: 'revoked', message: 'Token not recognized' };
      if (cred.status === 'revoked') return { valid: false, status: 'revoked', message: 'Credential has been revoked' };
      if (new Date() > new Date(cred.expiresAt)) return { valid: false, status: 'expired', message: 'Token has expired' };
      return { valid: true, status: 'active', userId: cred.userId, fullName: cred.fullName, departmentName: cred.departmentName ?? undefined };
    },
    async revokeCredential(userId) {
      const cred = credentialsDb.find(c => c.userId === userId && c.status === 'active');
      if (!cred) return false;
      cred.status = 'revoked';
      return true;
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
      campusRepo,
      digitalIdRepo,
    },
  );

  it('F14 & F15: Campus Explorer: create locations, entrances, and accessible path routing', async () => {
    // 1. Admin creates Academic Block and Library locations
    const loc1Res = await request(app)
      .post('/api/v1/campus/locations')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        code: 'ACAD_BLK',
        name: 'Academic Block',
        category: 'academic',
        building: 'Main Block',
        description: 'Main lecture halls and departments',
        openingHours: '8:00 AM - 6:00 PM',
      });
    assert.equal(loc1Res.status, 201);
    const loc1Id = loc1Res.body.data.id;

    const loc2Res = await request(app)
      .post('/api/v1/campus/locations')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        code: 'LIB_MAIN',
        name: 'Central Library',
        category: 'library',
        building: 'Library Building',
        description: 'Reference section and reading halls',
        openingHours: '8:00 AM - 8:00 PM',
      });
    assert.equal(loc2Res.status, 201);
    const loc2Id = loc2Res.body.data.id;

    // 2. Add wheelchair ramp entrance
    const entRes = await request(app)
      .post(`/api/v1/campus/locations/${loc1Id}/entrances`)
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        name: 'North Ramp Entrance',
        isAccessible: true,
      });
    assert.equal(entRes.status, 201);

    // 3. Add accessible path between Academic Block and Library
    const pathRes = await request(app)
      .post('/api/v1/campus/paths')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        fromLocationId: loc1Id,
        toLocationId: loc2Id,
        distanceMeters: 120,
        isAccessible: true,
      });
    assert.equal(pathRes.status, 201);

    // 4. Calculate accessible route (Public endpoint)
    const routeRes = await request(app)
      .get(`/api/v1/campus/routes?from=${loc1Id}&to=${loc2Id}&accessibleOnly=true`);
    assert.equal(routeRes.status, 200);
    assert.equal(routeRes.body.data.found, true);
    assert.equal(routeRes.body.data.isAccessible, true);
    assert.equal(routeRes.body.data.totalDistanceMeters, 120);
  });

  it('F31: QR location pages: generate QR code, scan, and disclose unavailable state', async () => {
    // 1. Create a sports facility location
    const gym = await campusRepo.createLocation({
      code: 'GYM_01',
      name: 'Indoor Sports Complex',
      category: 'sports',
      building: 'Sports Complex',
    });

    // 2. Admin generates QR code for gym
    const qrRes = await request(app)
      .post(`/api/v1/campus/locations/${gym.id}/qr`)
      .set('Authorization', 'Bearer admin_token.1.2');
    assert.equal(qrRes.status, 201);
    const token = qrRes.body.data.qrToken;

    // 3. Visitor / mobile scan resolves location
    const scanRes = await request(app).get(`/api/v1/campus/qr/scan/${token}`);
    assert.equal(scanRes.status, 200);
    assert.equal(scanRes.body.data.status, 'available');
    assert.equal(scanRes.body.data.location.name, 'Indoor Sports Complex');
    assert.equal(scanRes.body.data.qr.scanCount, 1);

    // 4. Non-existent QR scan gives 404
    const notFoundScan = await request(app).get('/api/v1/campus/qr/scan/non_existent_qr');
    assert.equal(notFoundScan.status, 404);
  });

  it('F32: Digital ID: issue expiring credential, verify live token, and handle revocation', async () => {
    // 1. Student views or issues active digital ID
    const cardRes = await request(app)
      .get('/api/v1/digital-id/me')
      .set('Authorization', 'Bearer student_token.1.2');
    assert.equal(cardRes.status, 200);
    assert.equal(cardRes.body.data.fullName, 'Aarav Patel');
    assert.equal(cardRes.body.data.status, 'active');
    const vToken = cardRes.body.data.verificationToken;

    // 2. Security guard/gate checks token at verification endpoint
    const verifyRes = await request(app).get(`/api/v1/digital-id/verify/${vToken}`);
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.data.valid, true);
    assert.equal(verifyRes.body.data.fullName, 'Aarav Patel');

    // 3. Admin revokes credential (e.g. discipline or lost card)
    const revokeRes = await request(app)
      .post(`/api/v1/digital-id/revoke/${studentId}`)
      .set('Authorization', 'Bearer admin_token.1.2');
    assert.equal(revokeRes.status, 200);
    assert.equal(revokeRes.body.data.revoked, true);

    // 4. Verification of revoked credential is now rejected
    const verifyRevoked = await request(app).get(`/api/v1/digital-id/verify/${vToken}`);
    assert.equal(verifyRevoked.status, 400);
    assert.equal(verifyRevoked.body.error.code, 'INVALID_OR_REVOKED_CREDENTIAL');
  });
});
