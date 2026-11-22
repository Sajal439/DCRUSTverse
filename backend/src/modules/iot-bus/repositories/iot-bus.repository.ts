import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import {
  buses,
  busPositions,
  iotDevices,
  sensorReadings,
} from '../../../database/schema.ts';

import type {
  BusWithPosition,
  IotDeviceRecord,
  SensorReadingRecord,
  IotBusRepository,
} from '../../../types/iot-bus.ts';

export type {
  BusWithPosition,
  IotDeviceRecord,
  SensorReadingRecord,
  IotBusRepository,
};

export function createDrizzleIotBusRepository(db: NodePgDatabase<typeof schema>): IotBusRepository {
  return {
    async listBuses() {
      const allBuses = await db.select().from(buses);
      const results: BusWithPosition[] = [];
      const now = Date.now();

      for (const b of allBuses) {
        const [pos] = await db
          .select()
          .from(busPositions)
          .where(eq(busPositions.busId, b.id))
          .orderBy(sql`${busPositions.recordedAt} DESC`)
          .limit(1);

        let latestPosition = null;
        if (pos) {
          const ageMs = now - pos.recordedAt.getTime();
          const isStale = ageMs > 5 * 60 * 1000;
          latestPosition = {
            latitude: pos.latitude,
            longitude: pos.longitude,
            speedKmh: pos.speedKmh,
            isSimulated: pos.isSimulated,
            recordedAt: pos.recordedAt.toISOString(),
            isStale,
          };
        }

        results.push({
          id: b.id,
          busNumber: b.busNumber,
          routeName: b.routeName,
          driverName: b.driverName,
          driverPhone: b.driverPhone,
          isLive: b.isLive,
          createdAt: b.createdAt.toISOString(),
          latestPosition,
        });
      }

      return results;
    },
    async createBus(data) {
      const [row] = await db
        .insert(buses)
        .values({
          busNumber: data.busNumber.toUpperCase().trim(),
          routeName: data.routeName.trim(),
          driverName: data.driverName.trim(),
          driverPhone: data.driverPhone.trim(),
          isLive: data.isLive,
        })
        .returning();

      if (!row) throw new Error('Failed to create bus');
      return {
        id: row.id,
        busNumber: row.busNumber,
        routeName: row.routeName,
        driverName: row.driverName,
        driverPhone: row.driverPhone,
        isLive: row.isLive,
        createdAt: row.createdAt.toISOString(),
        latestPosition: null,
      };
    },
    async recordPosition(busId, data) {
      const ageMs = Date.now() - data.recordedAt.getTime();
      const isStale = ageMs > 5 * 60 * 1000;

      const [row] = await db
        .insert(busPositions)
        .values({
          busId,
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
          speedKmh: data.speedKmh,
          isSimulated: data.isSimulated,
          recordedAt: data.recordedAt,
        })
        .returning();

      if (!row) throw new Error('Failed to record position');
      return { id: row.id, isStale };
    },
    async listDevices() {
      const allDevices = await db.select().from(iotDevices);
      return allDevices.map(d => ({
        id: d.id,
        deviceCode: d.deviceCode,
        locationName: d.locationName,
        sensorType: d.sensorType as IotDeviceRecord['sensorType'],
        status: d.status as IotDeviceRecord['status'],
        createdAt: d.createdAt.toISOString(),
      }));
    },
    async registerDevice(data) {
      const [row] = await db
        .insert(iotDevices)
        .values({
          deviceCode: data.deviceCode.toUpperCase().trim(),
          locationName: data.locationName.trim(),
          sensorType: data.sensorType,
          status: data.status,
        })
        .returning();

      if (!row) throw new Error('Failed to register device');

      return {
        id: row.id,
        deviceCode: row.deviceCode,
        locationName: row.locationName,
        sensorType: row.sensorType as IotDeviceRecord['sensorType'],
        status: row.status as IotDeviceRecord['status'],
        createdAt: row.createdAt.toISOString(),
      };
    },
    async recordReading(deviceCode, data) {
      const [device] = await db
        .select()
        .from(iotDevices)
        .where(eq(iotDevices.deviceCode, deviceCode.toUpperCase().trim()))
        .limit(1);

      if (!device) {
        throw new Error('DEVICE_NOT_FOUND: Device code not found');
      }

      const numVal = parseFloat(data.metricValue);
      if (data.metricName.toLowerCase() === 'temperature' && (numVal < -50 || numVal > 80)) {
        throw new Error('INVALID_READING: Temperature outside realistic range');
      }

      const [reading] = await db
        .insert(sensorReadings)
        .values({
          deviceId: device.id,
          metricName: data.metricName,
          metricValue: data.metricValue,
          unit: data.unit,
          isSimulated: data.isSimulated,
          recordedAt: data.recordedAt,
        })
        .returning();

      if (!reading) throw new Error('Failed to record reading');

      return {
        id: reading.id,
        deviceId: reading.deviceId,
        metricName: reading.metricName,
        metricValue: reading.metricValue,
        unit: reading.unit,
        isSimulated: reading.isSimulated,
        recordedAt: reading.recordedAt.toISOString(),
      };
    },
    async getDeviceReadings(deviceId) {
      const rows = await db
        .select()
        .from(sensorReadings)
        .where(eq(sensorReadings.deviceId, deviceId))
        .orderBy(sql`${sensorReadings.recordedAt} DESC`)
        .limit(50);

      return rows.map(r => ({
        ...r,
        recordedAt: r.recordedAt.toISOString(),
      }));
    },
  };
}
