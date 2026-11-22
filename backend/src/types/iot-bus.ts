export interface BusWithPosition {
  id: string;
  busNumber: string;
  routeName: string;
  driverName: string;
  driverPhone: string;
  isLive: boolean;
  createdAt: string;
  latestPosition?: {
    latitude: string;
    longitude: string;
    speedKmh: number;
    isSimulated: boolean;
    recordedAt: string;
    isStale: boolean;
  } | null;
}

export interface IotDeviceRecord {
  id: string;
  deviceCode: string;
  locationName: string;
  sensorType: 'air_quality' | 'water_level' | 'power' | 'temperature';
  status: 'active' | 'offline';
  createdAt: string;
}

export interface SensorReadingRecord {
  id: string;
  deviceId: string;
  metricName: string;
  metricValue: string;
  unit: string;
  isSimulated: boolean;
  recordedAt: string;
}

export interface IotBusRepository {
  listBuses(): Promise<BusWithPosition[]>;
  createBus(data: { busNumber: string; routeName: string; driverName: string; driverPhone: string; isLive: boolean }): Promise<BusWithPosition>;
  recordPosition(busId: string, data: { latitude: number; longitude: number; speedKmh: number; isSimulated: boolean; recordedAt: Date }): Promise<{ id: string; isStale: boolean }>;

  listDevices(): Promise<IotDeviceRecord[]>;
  registerDevice(data: { deviceCode: string; locationName: string; sensorType: 'air_quality' | 'water_level' | 'power' | 'temperature'; status: 'active' | 'offline' }): Promise<IotDeviceRecord>;
  recordReading(deviceCode: string, data: { metricName: string; metricValue: string; unit: string; isSimulated: boolean; recordedAt: Date }): Promise<SensorReadingRecord>;
  getDeviceReadings(deviceId: string): Promise<SensorReadingRecord[]>;
}
