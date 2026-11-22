import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { IotBusRepository } from '../repositories/iot-bus.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  listBuses,
  createBus,
  recordBusPosition,
  listDevices,
  registerDevice,
  ingestSensorReading,
  getDeviceReadings,
} from '../controllers/iot-bus.controller.ts';

export function createIotBusRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  iotBusRepo: IotBusRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  // Sensor telemetry ingestion (device authentication headers)
  router.post('/devices/telemetry', ingestSensorReading(iotBusRepo));

  // Public feeds
  router.get('/buses', listBuses(iotBusRepo));
  router.get('/devices', listDevices(iotBusRepo));
  router.get('/devices/:id/readings', getDeviceReadings(iotBusRepo));

  // Staff endpoints
  router.post(
    '/buses',
    auth,
    campusUser,
    requireRoles(['administrator', 'service_staff']),
    createBus(iotBusRepo),
  );
  router.post(
    '/buses/:id/positions',
    auth,
    campusUser,
    requireRoles(['administrator', 'service_staff']),
    recordBusPosition(iotBusRepo),
  );
  router.post(
    '/devices',
    auth,
    campusUser,
    requireRoles(['administrator', 'service_staff']),
    registerDevice(iotBusRepo),
  );

  return router;
}
