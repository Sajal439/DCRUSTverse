import { apiRequest } from '../api/client';
import type { RecordData } from '../types/workspace';

export function pathWithValues(path: string, values: RecordData = {}): string {
  return path.replace(/\{([\w]+)\}/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined || value === null || value === '') throw new Error(`Select ${key.replace(/Id$/, '')} first`);
    return encodeURIComponent(String(value));
  });
}

export function asRecords(data: unknown): RecordData[] {
  if (data === null || data === undefined) return [];
  if (Array.isArray(data)) return data.filter((x): x is RecordData => !!x && typeof x === 'object');
  if (typeof data !== 'object') return [{ value: data }];
  const record = data as RecordData;
  for (const key of ['items', 'users', 'results', 'events']) {
    if (Array.isArray(record[key])) return asRecords(record[key]);
  }
  return [record];
}

export async function loadRecords(path: string): Promise<RecordData[]> {
  return asRecords(await apiRequest<unknown>(path));
}

export function recordTitle(record: RecordData): string {
  if (record.startTime && record.dayOfWeek) return `Day ${record.dayOfWeek} · ${record.startTime}–${record.endTime ?? ''}${record.date ? ` · ${record.date}` : ''}`;
  return String(record.displayName ?? record.fullName ?? record.title ?? record.name ?? record.roomNumber ?? record.busNumber ?? record.deviceCode ?? record.credentialNumber ?? record.code ?? record.email ?? record.id ?? 'Record');
}

export function canUse(allowed: readonly string[] | undefined, roles: readonly string[]): boolean {
  return !allowed || roles.some(role => allowed.includes(role));
}

export function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(displayValue).join(', ') || 'None';
  if (typeof value === 'object') return Object.entries(value).map(([key, v]) => `${key}: ${displayValue(v)}`).join('\n');
  return String(value);
}
