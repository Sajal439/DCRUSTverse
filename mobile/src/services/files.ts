import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { apiRequest } from '../api/client';

export async function chooseAttachment() {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset || !asset.size || asset.size > 2 * 1024 * 1024) throw new Error('Choose a file up to 2 MB.');
  const file = new File(asset.uri);
  try { return await apiRequest<{ fileUrl: string; name: string }>('/files', { method: 'POST', body: JSON.stringify({ name: asset.name, mimeType: asset.mimeType, contentBase64: await file.base64() }) }); }
  finally { if (file.exists) file.delete(); }
}
export async function openPrivateFile(link: string) {
  const data = await apiRequest<{ name: string; mimeType: string; contentBase64: string }>(`/files/${encodeURIComponent(link.slice(12))}`);
  const folder = new File(Paths.cache, `${Date.now()}-${data.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
  try {
    folder.write(Uint8Array.from(atob(data.contentBase64), char => char.charCodeAt(0)));
    if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device.');
    await Sharing.shareAsync(folder.uri, { mimeType: data.mimeType });
  } finally { if (folder.exists) folder.delete(); }
}

export async function chooseUserCsv() {
  const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/plain', 'application/vnd.ms-excel'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset || !asset.size || asset.size > 90000) throw new Error('Choose a CSV file smaller than 90 KB.');
  const file = new File(asset.uri);
  try { return await file.text(); }
  finally { if (file.exists) file.delete(); }
}

export async function shareCsv(csv: string) {
  const file = new File(Paths.cache, `campus-users-${Date.now()}.csv`);
  try {
    file.write(csv);
    if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device.');
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export campus users' });
  } finally { if (file.exists) file.delete(); }
}
