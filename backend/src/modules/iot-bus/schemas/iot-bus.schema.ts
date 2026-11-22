import { z } from 'zod';

export const createBusSchema = z.object({
  busNumber: z.string().trim().min(3).max(50),
  routeName: z.string().trim().min(2).max(100),
  driverName: z.string().trim().min(2).max(100),
  driverPhone: z.string().trim().min(7).max(20),
  isLive: z.boolean().default(true),
});

export const recordBusPositionSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedKmh: z.number().int().min(0).max(200).default(0),
  isSimulated: z.boolean().default(false),
  recordedAt: z.string().datetime({ offset: true }),
});

export const registerIotDeviceSchema = z.object({
  deviceCode: z.string().trim().min(3).max(50),
  locationName: z.string().trim().min(2).max(100),
  sensorType: z.enum(['air_quality', 'water_level', 'power', 'temperature']),
  status: z.enum(['active', 'offline']).default('active'),
});

export const recordSensorReadingSchema = z.object({
  metricName: z.string().trim().min(2).max(50),
  metricValue: z.string().trim().min(1).max(50),
  unit: z.string().trim().min(1).max(20),
  isSimulated: z.boolean().default(false),
  recordedAt: z.string().datetime({ offset: true }),
});
