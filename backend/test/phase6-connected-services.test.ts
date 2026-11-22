import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config/env.ts';
import type { CampusUser } from '../src/types/auth.ts';
import type { CampusUserRepository } from '../src/modules/auth/repositories/user.repository.ts';
import type { AiAssistantRepository } from '../src/modules/ai-assistant/repositories/ai.repository.ts';
import type { IotBusRepository, BusWithPosition, IotDeviceRecord, SensorReadingRecord } from '../src/modules/iot-bus/repositories/iot-bus.repository.ts';
import type { IntegrationsRepository, SyncRunRecord } from '../src/modules/integrations/repositories/integrations.repository.ts';

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

describe('Phase 6: Connected Services (F28, F29, F30, F33, F34, F35, F37)', () => {
  const adminId = randomUUID();
  const studentId = randomUUID();

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
  ];

  const mockVerify = async (token: string) => {
    if (token === 'admin_token.1.2') return { id: mockUsers[0]!.authUserId, email: mockUsers[0]!.email };
    if (token === 'student_token.1.2') return { id: mockUsers[1]!.authUserId, email: mockUsers[1]!.email };
    throw new Error('Unauthenticated');
  };

  // 1. Mock AI Assistant
  const aiRepo: AiAssistantRepository = {
    async answerQuery(query) {
      const qLower = query.toLowerCase();
      if (qLower.includes('other student') || qLower.includes('grades of')) {
        return {
          answer: 'I cannot provide private student records, grades, or personal security credentials. All student academic and personal information is strictly private and protected by university policy.',
          sources: [],
          missingInformationAcknowledged: false,
        };
      }
      if (qLower.includes('library') || qLower.includes('hours')) {
        return {
          answer: 'Central Library is open from 8:00 AM to 8:00 PM Monday through Saturday.',
          sources: [
            {
              title: 'Central Library Directory',
              category: 'Library',
              snippet: 'Operating hours: 8:00 AM to 8:00 PM',
              verified: true,
            },
          ],
          missingInformationAcknowledged: false,
        };
      }
      return {
        answer: 'I do not have authoritative campus information regarding this topic in our verified knowledge base. Please check with the respective department office or university administration.',
        sources: [],
        missingInformationAcknowledged: true,
      };
    },
  };

  // 2. Mock IoT & Bus
  const busesDb: BusWithPosition[] = [];
  const devicesDb: IotDeviceRecord[] = [];
  const readingsDb: SensorReadingRecord[] = [];

  const iotBusRepo: IotBusRepository = {
    async listBuses() { return busesDb; },
    async createBus(data) {
      const b: BusWithPosition = {
        id: randomUUID(),
        busNumber: data.busNumber,
        routeName: data.routeName,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        isLive: data.isLive,
        createdAt: new Date().toISOString(),
        latestPosition: null,
      };
      busesDb.push(b);
      return b;
    },
    async recordPosition(busId, data) {
      const ageMs = Date.now() - data.recordedAt.getTime();
      const isStale = ageMs > 5 * 60 * 1000;
      const bus = busesDb.find(b => b.id === busId);
      if (bus) {
        bus.latestPosition = {
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
          speedKmh: data.speedKmh,
          isSimulated: data.isSimulated,
          recordedAt: data.recordedAt.toISOString(),
          isStale,
        };
      }
      return { id: randomUUID(), isStale };
    },
    async listDevices() { return devicesDb; },
    async registerDevice(data) {
      const d: IotDeviceRecord = {
        id: randomUUID(),
        deviceCode: data.deviceCode,
        locationName: data.locationName,
        sensorType: data.sensorType,
        status: data.status,
        createdAt: new Date().toISOString(),
      };
      devicesDb.push(d);
      return d;
    },
    async recordReading(deviceCode, data) {
      const dev = devicesDb.find(d => d.deviceCode === deviceCode);
      if (!dev) throw new Error('DEVICE_NOT_FOUND: Device code not found');
      const val = parseFloat(data.metricValue);
      if (data.metricName.toLowerCase() === 'temperature' && (val < -50 || val > 80)) {
        throw new Error('INVALID_READING: Temperature outside realistic range');
      }
      const r: SensorReadingRecord = {
        id: randomUUID(),
        deviceId: dev.id,
        metricName: data.metricName,
        metricValue: data.metricValue,
        unit: data.unit,
        isSimulated: data.isSimulated,
        recordedAt: data.recordedAt.toISOString(),
      };
      readingsDb.push(r);
      return r;
    },
    async getDeviceReadings(deviceId) {
      return readingsDb.filter(r => r.deviceId === deviceId);
    },
  };

  // 3. Mock Integrations
  const syncRunsDb: SyncRunRecord[] = [];

  const integrationsRepo: IntegrationsRepository = {
    async executeSync(data) {
      const existing = syncRunsDb.find(s => s.idempotencyKey === data.idempotencyKey && s.status === 'completed');
      if (existing) {
        return { isDuplicate: true, run: existing };
      }
      const run: SyncRunRecord = {
        id: randomUUID(),
        integrationName: data.integrationName,
        status: 'completed',
        idempotencyKey: data.idempotencyKey,
        recordsProcessed: data.payload.length,
        errorLog: null,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
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
      pushRepo: {
        async register(_userId, _token, platform) { return { id: 'device-1', platform, enabled: true, updatedAt: new Date() }; },
        async list() { return []; },
        async remove() { return true; },
      },
      aiRepo,
      iotBusRepo,
      integrationsRepo,
    },
  );

  it('F28, F29, F35: Mobile and client config, offline policy, and push registration', async () => {
    // 1. Get client config
    const configRes = await request(app).get('/api/v1/client/config');
    assert.equal(configRes.status, 200);
    assert.equal(configRes.body.data.appName, 'DCRUSTVerse');
    assert.equal(configRes.body.data.timezone, 'Asia/Kolkata');
    assert(configRes.body.data.offlinePolicy.cacheableResources.length > 0);
    assert.equal(configRes.body.data.accessibility.screenReaderOptimized, true);

    // 2. Student registers push token
    const pushRes = await request(app)
      .post('/api/v1/client/push/register')
      .set('Authorization', 'Bearer student_token.1.2')
      .send({
        deviceToken: 'ExpoPushToken[abcdef1234567890]',
        platform: 'android',
      });
    assert.equal(pushRes.status, 201);
    assert.equal(pushRes.body.data.registered, true);
  });

  it('F30: AI Campus Assistant: verified sources, missing info acknowledgment, and private data denial', async () => {
    // 1. Ask question with known campus data
    const knownRes = await request(app)
      .post('/api/v1/ai/assistant')
      .set('Authorization', 'Bearer student_token.1.2')
      .send({ query: 'What are the library hours?' });
    assert.equal(knownRes.status, 200);
    assert(knownRes.body.data.answer.includes('8:00 AM to 8:00 PM'));
    assert.equal(knownRes.body.data.sources[0].verified, true);
    assert.equal(knownRes.body.data.missingInformationAcknowledged, false);

    // 2. Ask question with unknown data -> acknowledges missing info
    const unknownRes = await request(app)
      .post('/api/v1/ai/assistant')
      .set('Authorization', 'Bearer student_token.1.2')
      .send({ query: 'Who won the 1975 chess tournament?' });
    assert.equal(unknownRes.status, 200);
    assert.equal(unknownRes.body.data.missingInformationAcknowledged, true);

    // 3. Attempt to retrieve another student's private grades -> forbidden / denied
    const privateRes = await request(app)
      .post('/api/v1/ai/assistant')
      .set('Authorization', 'Bearer student_token.1.2')
      .send({ query: 'What are the grades of other student roll number 21001001002?' });
    assert.equal(privateRes.status, 200);
    assert(privateRes.body.data.answer.includes('cannot provide private student records'));
    assert.equal(privateRes.body.data.sources.length, 0);
  });

  it('F33: Live Bus Tracking: create bus, record position, and detect stale telemetry (> 5 mins)', async () => {
    // 1. Staff creates campus bus route
    const busRes = await request(app)
      .post('/api/v1/iot/buses')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        busNumber: 'HR-10-AB-1234',
        routeName: 'Sonipat City to Campus Route 1',
        driverName: 'Ramesh Singh',
        driverPhone: '+919812345678',
        isLive: true,
      });
    assert.equal(busRes.status, 201);
    const busId = busRes.body.data.id;

    // 2. Ingest position recorded 10 minutes ago (stale)
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const stalePosRes = await request(app)
      .post(`/api/v1/iot/buses/${busId}/positions`)
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        latitude: 28.985,
        longitude: 77.082,
        speedKmh: 45,
        isSimulated: true,
        recordedAt: tenMinsAgo,
      });
    assert.equal(stalePosRes.status, 201);
    assert.equal(stalePosRes.body.data.isStale, true);

    // 3. List buses shows stale indicator
    const listRes = await request(app).get('/api/v1/iot/buses');
    assert.equal(listRes.status, 200);
    const bus = listRes.body.data.find((b: any) => b.id === busId);
    assert.equal(bus.latestPosition.isStale, true);
    assert.equal(bus.latestPosition.isSimulated, true);
  });

  it('F34: IoT Campus Monitoring: register device, validate telemetry and reject impossible readings', async () => {
    // 1. Register environmental sensor
    const devRes = await request(app)
      .post('/api/v1/iot/devices')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        deviceCode: 'DCRUST_AQI_01',
        locationName: 'Main Gate Sensor Station',
        sensorType: 'temperature',
        status: 'active',
      });
    assert.equal(devRes.status, 201);

    // 2. Telemetry ingestion: valid reading
    const readingRes = await request(app)
      .post('/api/v1/iot/devices/telemetry')
      .set('x-device-code', 'DCRUST_AQI_01')
      .send({
        metricName: 'temperature',
        metricValue: '28.5',
        unit: 'C',
        isSimulated: false,
        recordedAt: new Date().toISOString(),
      });
    assert.equal(readingRes.status, 201);

    // 3. Telemetry ingestion: physically impossible reading (e.g. -200 C) -> rejected 422
    const invalidRes = await request(app)
      .post('/api/v1/iot/devices/telemetry')
      .set('x-device-code', 'DCRUST_AQI_01')
      .send({
        metricName: 'temperature',
        metricValue: '-200',
        unit: 'C',
        isSimulated: false,
        recordedAt: new Date().toISOString(),
      });
    assert.equal(invalidRes.status, 422);
    assert.equal(invalidRes.body.error.code, 'INVALID_READING');
  });

  it('F37: University Integrations: ERP sync adapter and idempotency guarantee', async () => {
    const idempotencyKey = 'SYNC-DCRUST-ERP-2026-11-23-001';

    // 1. Initial sync execution
    const sync1Res = await request(app)
      .post('/api/v1/integrations/sync')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        integrationName: 'erp_attendance',
        idempotencyKey,
        payload: [{ studentId: studentId, sessionId: '11111111-1111-4111-a111-111111111111', status: 'present' }],
      });
    assert.equal(sync1Res.status, 201);
    assert.equal(sync1Res.body.data.recordsProcessed, 1);
    assert.equal(sync1Res.body.data.status, 'completed');

    // 2. Retry with same idempotency key returns existing run (Idempotent: 200 without duplicate processing)
    const sync2Res = await request(app)
      .post('/api/v1/integrations/sync')
      .set('Authorization', 'Bearer admin_token.1.2')
      .send({
        integrationName: 'erp_attendance',
        idempotencyKey,
        payload: [{ studentId: studentId, sessionId: '11111111-1111-4111-a111-111111111111', status: 'present' }],
      });
    assert.equal(sync2Res.status, 200);
    assert.equal(sync2Res.body.data.idempotencyKey, idempotencyKey);
    assert.equal(sync2Res.body.data.recordsProcessed, 1);
  });
});
