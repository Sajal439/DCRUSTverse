import React, { useRef, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { WorkspaceForm } from '../components/WorkspaceForm';
import { apiRequest } from '../api/client';
import type { Field, RecordData } from '../types/workspace';
const fields: Record<string, Field[]> = {
  hr_directory: [{ key: 'email', label: 'Existing staff email', required: true }, { key: 'designation', label: 'Designation', required: true }, { key: 'phone', label: 'Phone' }],
  erp_attendance: [{ key: 'sessionId', label: 'Class session', kind: 'reference', source: '/timetable/sessions', required: true }, { key: 'studentId', label: 'Student', kind: 'reference', source: '/users?role=student&limit=100', required: true }, { key: 'status', label: 'Attendance', kind: 'select', options: ['present', 'absent', 'late', 'excused'], required: true }],
  exam_portal: [{ key: 'submissionId', label: 'Submission ID from the source system', required: true }, { key: 'marksObtained', label: 'Marks', kind: 'number', min: 0, max: 10000, required: true }, { key: 'feedback', label: 'Feedback' }],
};
export function IntegrationImportScreen() {
  const [mode, setMode] = useState('hr_directory'); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const previous = useRef({ body: '', key: '' });
  async function submit(values: RecordData) {
    if (busy) return; setBusy(true); setMessage('');
    const body = JSON.stringify({ integrationName: mode, payload: [values] });
    if (previous.current.body !== body) previous.current = { body, key: `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}` };
    try {
      const result = await apiRequest<{ recordsProcessed: number; status: string }>('/integrations/sync', { method: 'POST', body: JSON.stringify({ ...JSON.parse(body), idempotencyKey: previous.current.key }) });
      setMessage(`${result.status}: ${result.recordsProcessed} record saved. Repeating this request will not duplicate the import.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Import failed'); }
    finally { setBusy(false); }
  }
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16 }}>
    <Text style={{ fontSize: 24, fontWeight: '700' }}>Import a university record</Text>
    <Text>Manually transfer a record from your authorized source system. This does not connect to the university's external servers. Updates are validated and saved atomically.</Text>
    {Object.keys(fields).map(key => <Pressable disabled={busy} key={key} onPress={() => setMode(key)}><Text style={{ padding: 10, color: '#2448A6', fontWeight: mode === key ? '800' : '400' }}>{key.replaceAll('_', ' ')}</Text></Pressable>)}
    <WorkspaceForm key={mode} fields={fields[mode]} label="Confirm & import record" busy={busy} onSubmit={submit} />
    <Text accessibilityLiveRegion="polite">{message}</Text>
  </ScrollView>;
}
