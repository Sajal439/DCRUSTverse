import { openPrivateFile } from '../services/files';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Modal, StyleSheet, RefreshControl, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { apiRequest } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { WorkspaceForm } from '../components/WorkspaceForm';
import { canUse, displayValue, loadRecords, pathWithValues, recordTitle } from '../services/workspace';
import type { Operation, RecordData, Resource } from '../types/workspace';

const humanize = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
export function RecordDetails({ data, columns }: { data: RecordData; columns?: string[] }) {
  const keys = columns ?? Object.keys(data).filter(key => !['id', 'verificationToken', 'authUserId', 'deviceToken'].includes(key));
  return <View style={{ gap: 10 }}>{keys.filter(key => data[key] !== undefined).map(key => <View key={key}>
    <Text style={styles.label}>{humanize(key)}</Text>
    {key === 'qrToken' && typeof data[key] === 'string' && <View style={{ padding: 16, alignItems: 'center' }}><QRCode value={String(data[key])} size={180} /></View>}
    {typeof data[key] === 'string' && String(data[key]).startsWith('campus-file:') ? <Pressable onPress={() => void openPrivateFile(String(data[key])).catch(error => Alert.alert('File unavailable', error.message))}><Text style={styles.link}>Download private attachment</Text></Pressable> : typeof data[key] === 'string' && /^https:\/\//.test(data[key] as string)
      ? <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(String(data[key])).catch(() => undefined)}><Text style={styles.link}>Open document</Text></Pressable>
      : <Text selectable style={styles.value}>{['cgpa', 'minCgpa'].includes(key) && typeof data[key] === 'number' ? (data[key] as number / 100).toFixed(2) : displayValue(data[key])}</Text>}
  </View>)}</View>;
}

export function ResourceScreen({ resource, context = {}, onBack }: { resource: Resource; context?: RecordData; onBack?: () => void }) {
  const { user } = useAuth();
  const roles = user?.roles?.map(role => role.role) ?? [];
  const [rows, setRows] = useState<RecordData[]>([]);
  const [filters, setFilters] = useState<RecordData>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [operation, setOperation] = useState<{ operation: Operation; record: RecordData } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [result, setResult] = useState<RecordData | null>(null);
  const [child, setChild] = useState<{ resource: Resource; context: RecordData } | null>(null);
  const requestId = useRef(0);
  let path = '';
  try { path = pathWithValues(resource.path, { userId: user?.id, ...context, ...filters }); } catch { /* Wait for required filters. */ }
  const load = useCallback(async () => {
    const id = ++requestId.current;
    if (!path) { setRows([]); return; }
    setBusy(true); setError('');
    try { const records = await loadRecords(path); if (id === requestId.current) setRows(records); }
    catch (err) { if (id === requestId.current) { setRows([]); setError(err instanceof Error ? err.message : 'Could not load records'); } }
    finally { if (id === requestId.current) setBusy(false); }
  }, [path]);
  useEffect(() => { void load(); return () => { requestId.current++; }; }, [load]);
  const open = (action: Operation, record: RecordData) => { setOperation({ operation: action, record }); setSaveError(''); setMessage(''); };
  const save = async (values: RecordData) => {
    if (!operation || saving) return;
    setSaving(true); setSaveError('');
    try {
      const action = operation.operation;
      const variables = { ...context, ...filters, ...operation.record, ...values };
      const body = Object.fromEntries(Object.entries(action.body ?? {}).map(([key, value]) => [key, typeof value === 'string' ? pathWithValues(value, variables) : value]));
      const method = action.method ?? 'POST';
      const response = await apiRequest<unknown>(pathWithValues(action.path, variables), { method, ...(method === 'GET' ? {} : { body: JSON.stringify({ ...values, ...body }) }) });
      setOperation(null);
      if (method === 'GET') setResult(response && typeof response === 'object' ? response as RecordData : { result: response });
      else {
        setMessage('Saved successfully on the campus server.');
        if (response && typeof response === 'object' && !Array.isArray(response)) setResult(response as RecordData);
        await load();
      }
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Unable to save. Please retry.'); }
    finally { setSaving(false); }
  };
  if (child) return <ResourceScreen key={`${child.resource.key}:${child.context.id}`} resource={child.resource} context={child.context} onBack={() => { setChild(null); void load(); }} />;
  const filtered = rows.filter(row => resource.columns.some(key => displayValue(row[key]).toLowerCase().includes(search.toLowerCase())) || recordTitle(row).toLowerCase().includes(search.toLowerCase()));
  return <View style={styles.root}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}>
      {!!onBack && <Pressable accessibilityRole="button" onPress={onBack}><Text style={styles.link}>‹ Back</Text></Pressable>}
      <Text accessibilityRole="header" style={styles.title}>{resource.title}</Text><Text style={styles.description}>{resource.description}</Text>
      {!!resource.filters?.length && <WorkspaceForm key={resource.key} fields={resource.filters} label="Load records" onSubmit={setFilters} />}
      {!!resource.create && canUse(resource.create.roles, roles) && <Pressable accessibilityRole="button" style={styles.primary} onPress={() => open(resource.create!, context)}><Text style={styles.primaryText}>＋ {resource.create.label}</Text></Pressable>}
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.success}>{message}</Text>}
      {!!error && <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={load}><Text style={styles.link}>Retry</Text></Pressable></View>}
      {!!path && <TextInput accessibilityLabel="Search loaded records" style={styles.search} value={search} onChangeText={setSearch} placeholder="Search these records" />}
      {busy && <ActivityIndicator color="#2448A6" />}
      {!busy && !error && !!path && !filtered.length && <View style={styles.card}><Text style={styles.description}>{search ? 'No matching records.' : 'No records yet. New records will appear here after they are saved.'}</Text></View>}
      {filtered.map((row, index) => <View key={String(row.id ?? index)} style={styles.card}>
        <Text style={styles.cardTitle}>{recordTitle(row)}</Text>
        <RecordDetails data={row} columns={resource.columns} />
        <View style={styles.actions}>
          {resource.children?.map(item => <Pressable key={item.label} accessibilityRole="button" style={styles.action} onPress={() => setChild({ resource: item.resource, context: { ...row, parentId: row.id } })}><Text style={styles.link}>{item.label} →</Text></Pressable>)}
          {resource.actions?.filter(action => canUse(action.roles, roles)).map(action => <Pressable key={action.label} accessibilityRole="button" style={styles.action} onPress={() => open(action, row)}><Text style={styles.link}>{action.label}</Text></Pressable>)}
        </View>
      </View>)}
    </ScrollView>
    <Modal visible={!!operation || !!result} animationType="slide" onRequestClose={() => { if (!saving) { setOperation(null); setResult(null); } }}>
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable disabled={saving} accessibilityRole="button" onPress={() => { setOperation(null); setResult(null); }}><Text style={styles.link}>Close</Text></Pressable>
          {operation && <><Text style={styles.title}>{operation.operation.label}</Text><Text style={styles.description}>{recordTitle(operation.record) === 'Record' ? 'Complete the fields below.' : recordTitle(operation.record)}</Text>
            {!!saveError && <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text>}
            <WorkspaceForm fields={operation.operation.fields ?? []} initial={{ ...context, ...filters }} label={operation.operation.method === 'GET' ? 'Open details' : 'Confirm & save'} busy={saving} onSubmit={save} />
          </>}
          {!!result && <><Text style={styles.title}>Details</Text><RecordDetails data={result} /></>}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F6FC' }, content: { padding: 20, gap: 16, paddingBottom: 40, width: '100%', maxWidth: 1000, alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#17263D' }, description: { color: '#52627A', fontSize: 15, lineHeight: 22 },
  card: { padding: 18, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#DCE4F0', gap: 14 }, cardTitle: { fontWeight: '700', fontSize: 18, color: '#17263D' },
  label: { color: '#52627A', fontSize: 12, textTransform: 'capitalize', marginBottom: 3 }, value: { color: '#17263D', fontSize: 15, lineHeight: 22 },
  search: { minHeight: 48, backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD6E5', padding: 12, borderRadius: 10, color: '#17263D' },
  primary: { backgroundColor: '#2448A6', borderRadius: 10, padding: 15, alignItems: 'center' }, primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  actions: { gap: 8, flexDirection: 'row', flexWrap: 'wrap' }, action: { borderWidth: 1, borderColor: '#DCE4F0', borderRadius: 8, paddingHorizontal: 10, minHeight: 44, justifyContent: 'center' },
  link: { color: '#2448A6', fontWeight: '700', paddingVertical: 10 }, error: { color: '#A32020', lineHeight: 22 }, errorBox: { padding: 15, borderRadius: 10, backgroundColor: '#FFF0F0' }, success: { color: '#12643A', lineHeight: 22 },
});
