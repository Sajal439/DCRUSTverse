import { IntegrationImportScreen } from './IntegrationImportScreen';
import { PushSettingsScreen } from './PushSettingsScreen';
import { BulkUsersScreen } from './BulkUsersScreen';
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { resources } from '../config/resources';
import { canUse } from '../services/workspace';
import { ResourceScreen } from './ResourceScreen';
import { LiveAssistantScreen, LiveDigitalIdScreen, RollCallScreen, SurveyScreen } from './LiveSpecialScreens';
import { QrScannerScreen } from './QrScannerScreen';

export function LiveServicesScreen({ initialKey, academicOnly = false }: { initialKey?: string; academicOnly?: boolean }) {
  const { user } = useAuth();
  const roles = user?.roles?.map(role => role.role) ?? [];
  const [selected, setSelected] = useState<string | null>(initialKey ?? null);
  const [search, setSearch] = useState('');
  useEffect(() => { if (initialKey) setSelected(initialKey); }, [initialKey]);
  const selectedResource = resources.find(item => item.key === selected && canUse(item.roles, roles));
  const back = <Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={{ padding: 16, backgroundColor: '#F3F6FC' }}><Text style={{ color: '#2448A6', fontWeight: '700' }}>‹ All services</Text></Pressable>;
  if (selectedResource) return <ResourceScreen key={selectedResource.key} resource={selectedResource} onBack={() => setSelected(null)} />;
  if (selected === 'integration-import' && roles.includes('administrator')) return <View style={{ flex: 1 }}>{back}<IntegrationImportScreen /></View>;
  if (selected === 'bulk-users' && roles.includes('administrator')) return <View style={{ flex: 1 }}>{back}<BulkUsersScreen /></View>;
  if (selected === 'push-settings') return <View style={{ flex: 1 }}>{back}<PushSettingsScreen /></View>;
  if (selected === 'digital-id') return <View style={{ flex: 1 }}>{back}<LiveDigitalIdScreen /></View>;
  if (selected === 'assistant') return <View style={{ flex: 1 }}>{back}<LiveAssistantScreen /></View>;
  if (selected === 'rollcall') return <View style={{ flex: 1 }}>{back}<RollCallScreen /></View>;
  if (selected === 'surveys') return <View style={{ flex: 1 }}>{back}<SurveyScreen /></View>;
  if (selected === 'qr-scanner') return <View style={{ flex: 1 }}>{back}<QrScannerScreen /></View>;
  const entries = [
    ...(!academicOnly && roles.includes('administrator') ? [{ key: 'integration-import', title: 'Import university record', description: 'Save verified attendance, grade or directory data.', group: 'Administration' }, { key: 'bulk-users', title: 'Import & export users', description: 'Validate CSV, import pending campus accounts and export current users.', group: 'Administration' }] : []),
    ...resources.filter(resource => canUse(resource.roles, roles) && (!academicOnly || resource.group === 'Academics')),
    ...(!academicOnly ? [
      { key: 'push-settings', title: 'Notification settings', description: 'Enable push alerts and manage registered devices.', group: 'My account' },
      { key: 'digital-id', title: 'My digital ID', description: 'An expiring QR credential verified by the campus server.', group: 'My account' },
      { key: 'assistant', title: 'Campus assistant', description: 'Ask questions and review the returned sources.', group: 'Campus explorer' },
      { key: 'surveys', title: 'Surveys & feedback', description: 'Answer available campus surveys.', group: 'Community' },
      { key: 'qr-scanner', title: 'Scan campus QR', description: 'Verify an ID or open campus location information.', group: 'Campus explorer' },
    ] : []),
    ...(roles.some(role => ['faculty', 'department_head', 'administrator'].includes(role)) ? [{ key: 'rollcall', title: 'Record attendance', description: 'Choose a scheduled class and mark its enrolled students.', group: 'Academics' }] : []),
  ].filter(resource => `${resource.title} ${resource.description}`.toLowerCase().includes(search.toLowerCase()));
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>{academicOnly ? 'Academic workspace' : 'Campus services'}</Text>
    <Text style={styles.subtitle}>Choose a service. Your account permissions determine the available actions.</Text>
    <TextInput accessibilityLabel="Find a campus service" value={search} onChangeText={setSearch} placeholder="Search services" style={styles.search} />
    {Array.from(new Set(entries.map(entry => entry.group))).map(group => <View key={group} style={styles.group}>
      <Text accessibilityRole="header" style={styles.groupTitle}>{group}</Text>
      {entries.filter(entry => entry.group === group).map(entry => <Pressable accessibilityRole="button" key={entry.key} style={styles.card} onPress={() => setSelected(entry.key)}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{entry.title}</Text><Text style={styles.subtitle}>{entry.description}</Text></View><Text style={styles.arrow}>›</Text></Pressable>)}
    </View>)}
    {!entries.length && <Text style={styles.subtitle}>No matching services.</Text>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, backgroundColor: '#F3F6FC', flexGrow: 1 }, title: { fontSize: 27, fontWeight: '800', color: '#17263D' }, subtitle: { color: '#52627A', fontSize: 14, lineHeight: 21 },
  search: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD6E5', borderRadius: 12, padding: 14, fontSize: 16 }, group: { gap: 10 }, groupTitle: { fontSize: 18, fontWeight: '700', color: '#17263D' },
  card: { flexDirection: 'row', gap: 16, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#DFE6F0', borderRadius: 14, padding: 17 }, cardTitle: { fontSize: 16, fontWeight: '700', color: '#17263D', marginBottom: 5 }, arrow: { color: '#2448A6', fontSize: 27 },
});
