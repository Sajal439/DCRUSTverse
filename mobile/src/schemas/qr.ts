import { z } from 'zod';

export const campusQrSchema = z.string().trim().max(100).regex(/^(?:[a-f0-9]{48}|dcrust_loc_[a-f0-9]{24})$/, 'This is not a DCRUSTVerse ID or location code');
export function qrLookupPath(code: string) {
  const parsed = campusQrSchema.parse(code);
  return parsed.startsWith('dcrust_loc_') ? `/campus/qr/scan/${parsed}` : `/digital-id/verify/${parsed}`;
}
