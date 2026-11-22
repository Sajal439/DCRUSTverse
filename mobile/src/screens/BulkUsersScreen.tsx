import React, { useState } from 'react';
import { ScrollView, Text, TextInput, Pressable, Alert } from 'react-native';
import { chooseUserCsv, shareCsv } from '../services/files';
import { apiRequest } from '../api/client';
import { parseCsv } from '../services/csv';
import type { ImportPreview } from '../types/bulk';

export function BulkUsersScreen() {
  const [csv, setCsv] = useState(''); const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function run(action: 'preview' | 'import' | 'export') {
    if (busy) return; setBusy(true); setMessage('');
    try {
      if (action === 'export') {
        const data = await apiRequest<{ csv: string; count: number }>('/bulk/export-users');
        await shareCsv(data.csv);
        setMessage(`Export prepared: ${data.count} accounts.`);
      } else {
        const rows = parseCsv(csv);
        if (action === 'preview') setPreview(await apiRequest<ImportPreview>('/bulk/validate-import', { method: 'POST', body: JSON.stringify({ rows }) }));
        else {
          const data = await apiRequest<{ imported: number; skipped: number }>('/bulk/import-users', { method: 'POST', body: JSON.stringify({ rows, confirm: true }) });
          setMessage(`Imported ${data.imported} pending accounts. Skipped ${data.skipped} existing accounts. Approve new accounts in Campus accounts.`); setPreview(null);
        }
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Operation failed'); }
    finally { setBusy(false); }
  }
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 18 }}>
    <Text style={{ fontSize: 24, fontWeight: '700' }}>Import & export campus users</Text>
    <Text>Paste CSV with email,displayName headers. Optional columns: departmentCode,role. Roles are student or faculty. Supabase logins must already be confirmed. Existing accounts are preserved; new accounts await approval.</Text>
    <Pressable disabled={busy} onPress={async () => { setBusy(true); try { const content = await chooseUserCsv(); if (content !== null) { setCsv(content); setPreview(null); setMessage('CSV loaded. Validate before importing.'); } } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not read CSV'); } finally { setBusy(false); } }}><Text style={{ color: '#2448A6', padding: 12 }}>Choose CSV file</Text></Pressable>
    <TextInput accessibilityLabel="User CSV" multiline value={csv} onChangeText={value => { setCsv(value); setPreview(null); }} placeholder={'email,displayName,departmentCode,role\nstudent@example.org,Student Name,DEMO-CSE,student'} style={{ minHeight: 180, borderWidth: 1, borderColor: '#CBD6E5', padding: 12, textAlignVertical: 'top' }} />
    <Pressable disabled={busy} onPress={() => void run('preview')}><Text style={{ color: '#2448A6', padding: 12 }}>Validate CSV</Text></Pressable>
    {preview && <><Text>{preview.validCount} valid / {preview.totalRows} rows</Text>{preview.errors.map(error => <Text key={error.rowNumber} style={{ color: '#A32020' }}>Row {error.rowNumber}: {error.reason}</Text>)}
      {!preview.errorCount && <Pressable disabled={busy} onPress={() => Alert.alert('Import accounts?', `Create up to ${preview.validCount} pending campus accounts?`, [{ text: 'Cancel' }, { text: 'Import', onPress: () => void run('import') }])}><Text style={{ color: '#2448A6', padding: 12 }}>Confirm import</Text></Pressable>}
    </>}
    <Pressable disabled={busy} onPress={() => void run('export')}><Text style={{ color: '#2448A6', padding: 12 }}>Export & share accounts CSV</Text></Pressable>
    <Text accessibilityLiveRegion="polite">{busy ? 'Working…' : message}</Text>
  </ScrollView>;
}
