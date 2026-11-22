import type { FileUpload } from '../../../types/files.ts';
import { HttpError } from '../../../lib/http-error.ts';
export function validateFileContent(data: FileUpload): Buffer {
  const bytes = Buffer.from(data.contentBase64, 'base64');
  if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024 || bytes.toString('base64') !== data.contentBase64) throw new HttpError(400, 'INVALID_FILE', 'Choose a valid file up to 2 MB');
  const valid = data.mimeType === 'application/pdf' ? bytes.subarray(0, 5).toString() === '%PDF-'
    : data.mimeType === 'image/png' ? bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
    : data.mimeType === 'image/jpeg' ? bytes.subarray(0, 3).toString('hex') === 'ffd8ff'
    : data.mimeType === 'text/plain' && !bytes.includes(0) && Buffer.from(bytes.toString('utf8')).equals(bytes);
  if (!valid) throw new HttpError(400, 'INVALID_FILE_TYPE', 'File content does not match PDF, PNG, JPEG or UTF-8 text');
  return bytes;
}
