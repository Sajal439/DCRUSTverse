import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { IotBusRepository } from '../repositories/iot-bus.repository.ts';
import {
  createBusSchema,
  recordBusPositionSchema,
  registerIotDeviceSchema,
  recordSensorReadingSchema,
} from '../schemas/iot-bus.schema.ts';

export function listBuses(repo: IotBusRepository): RequestHandler {
  return async (_req, res) => {
    const data = await repo.listBuses();
    res.json({ data });
  };
}

export function createBus(repo: IotBusRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createBusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid bus data');
    }

    const data = await repo.createBus(parsed.data);
    res.status(201).json({ data });
  };
}

export function recordBusPosition(repo: IotBusRepository): RequestHandler {
  return async (req, res) => {
    const busId = req.params.id as string;
    const parsed = recordBusPositionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid coordinates');
    }

    const result = await repo.recordPosition(busId, {
      ...parsed.data,
      recordedAt: new Date(parsed.data.recordedAt),
    });

    res.status(201).json({ data: result });
  };
}

export function listDevices(repo: IotBusRepository): RequestHandler {
  return async (_req, res) => {
    const data = await repo.listDevices();
    res.json({ data });
  };
}

export function registerDevice(repo: IotBusRepository): RequestHandler {
  return async (req, res) => {
    const parsed = registerIotDeviceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid device details');
    }

    const data = await repo.registerDevice(parsed.data);
    res.status(201).json({ data });
  };
}

export function ingestSensorReading(repo: IotBusRepository): RequestHandler {
  return async (req, res) => {
    const deviceCode = (req.headers['x-device-code'] as string | undefined) ?? (req.body?.deviceCode as string | undefined);

    if (!deviceCode) {
      throw new HttpError(401, 'DEVICE_AUTH_REQUIRED', 'Missing x-device-code header or deviceCode field');
    }

    const parsed = recordSensorReadingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid sensor reading');
    }

    try {
      const reading = await repo.recordReading(deviceCode, {
        ...parsed.data,
        recordedAt: new Date(parsed.data.recordedAt),
      });
      res.status(201).json({ data: reading });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sensor recording failed';
      if (msg.includes('DEVICE_NOT_FOUND')) {
        throw new HttpError(404, 'DEVICE_NOT_FOUND', 'Device code not registered');
      }
      if (msg.includes('INVALID_READING')) {
        throw new HttpError(422, 'INVALID_READING', msg.replace('INVALID_READING: ', ''));
      }
      throw new HttpError(400, 'RECORDING_FAILED', msg);
    }
  };
}

export function getDeviceReadings(repo: IotBusRepository): RequestHandler {
  return async (req, res) => {
    const deviceId = req.params.id as string;
    const data = await repo.getDeviceReadings(deviceId);
    res.json({ data });
  };
}
