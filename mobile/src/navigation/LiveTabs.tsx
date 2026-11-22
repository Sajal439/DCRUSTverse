import React, { useEffect, useState } from 'react';
import { Text, View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { LiveServicesScreen } from '../screens/LiveServicesScreen';
import { ResourceScreen } from '../screens/ResourceScreen';
import { resourceByKey } from '../config/resources';
import { loadRecords, recordTitle } from '../services/workspace';
import type { RecordData } from '../types/workspace';
import type { LiveTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<LiveTabParamList>();
function Home({ navigation }: BottomTabScreenProps<LiveTabParamList, 'Home'>) {
  const { user } = useAuth();
  const [notices, setNotices] = useState<RecordData[]>([]);
  const [error, setError] = useState('');
  const load = () => { setError(''); void loadRecords('/notices').then(setNotices).catch(err => setError(err instanceof Error ? err.message : 'Unable to load notices')); };
  useEffect(load, []);
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.hero}><Text style={styles.eyebrow}>YOUR CAMPUS, CONNECTED</Text><Text style={styles.heroTitle}>Hello, {user?.displayName}</Text><Text style={styles.heroText}>Manage your studies, requests and campus life from one place.</Text></View>
    <Text style={styles.sectionTitle}>Quick actions</Text>
    <View style={styles.grid}>{[
      ['calendar', 'My calendar', 'calendar-month'], ['assignments', 'Assignments', 'book-open-variant'], ['tickets', 'Raise a request', 'message-alert-outline'],
      ['digital-id', 'My digital ID', 'qrcode'], ['library', 'Library', 'bookshelf'], ['buses', 'Bus updates', 'bus'],
    ].map(([key, title, icon]) => <Pressable key={key} accessibilityRole="button" style={styles.tile} onPress={() => navigation.navigate('Services', { resourceKey: key, openedAt: Date.now() })}>
      <MaterialCommunityIcons name={icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']} size={27} color="#2448A6" /><Text style={styles.tileTitle}>{title}</Text>
    </Pressable>)}</View>
    <Text style={styles.sectionTitle}>Campus notices</Text>
    {!!error && <View><Text style={styles.error}>{error}</Text><Pressable onPress={load} accessibilityRole="button"><Text style={styles.link}>Retry notices</Text></Pressable></View>}
    {!error && !notices.length && <Text style={styles.subtitle}>No published notices are available.</Text>}
    {notices.slice(0, 4).map((notice, index) => <Pressable key={String(notice.id ?? index)} style={styles.notice} onPress={() => navigation.navigate('Services', { resourceKey: 'notices', openedAt: Date.now() })}><Text style={styles.tileTitle}>{recordTitle(notice)}</Text><Text numberOfLines={3} style={styles.subtitle}>{String(notice.content ?? '')}</Text></Pressable>)}
  </ScrollView>;
}
function Services({ route }: BottomTabScreenProps<LiveTabParamList, 'Services'>) { return <LiveServicesScreen key={route.params?.openedAt ?? 'services'} initialKey={route.params?.resourceKey} />; }
function Academics() { return <LiveServicesScreen academicOnly />; }
function Inbox() { return <ResourceScreen resource={resourceByKey('notifications')} />; }
function Profile() { return <ResourceScreen resource={resourceByKey('profile')} />; }
const icons = { Home: 'home-outline', Academics: 'book-open-outline', Services: 'view-grid-outline', Inbox: 'bell-outline', Profile: 'account-outline' } as const;

export function LiveTabs() {
  const { user, logout } = useAuth();
  return <NavigationContainer><Tab.Navigator key={user?.id} backBehavior="history" screenOptions={({ route }) => ({
    tabBarActiveTintColor: '#2448A6', tabBarInactiveTintColor: '#52627A', tabBarHideOnKeyboard: true,
    tabBarIcon: ({ size, color }) => <MaterialCommunityIcons name={icons[route.name]} size={size} color={color} />,
    header: () => <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}><View style={styles.headerRow}><View style={{ flex: 1 }}><Text style={styles.brand}>DCRUSTVerse</Text><Text style={styles.role}>{user?.roles?.map(role => role.role.replaceAll('_', ' ')).join(' · ') || 'Campus member'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={() => void logout()} style={styles.logout}><MaterialCommunityIcons name="logout" size={22} color="#2448A6" /></Pressable></View></SafeAreaView>,
  })} screenLayout={({ children }) => <SafeAreaView edges={['left', 'right']} style={{ flex: 1 }}>{children}</SafeAreaView>}>
    <Tab.Screen name="Home" component={Home} /><Tab.Screen name="Academics" component={Academics} /><Tab.Screen name="Services" component={Services} /><Tab.Screen name="Inbox" component={Inbox} /><Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator></NavigationContainer>;
}
const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, backgroundColor: '#F3F6FC', flexGrow: 1 }, hero: { padding: 24, borderRadius: 20, backgroundColor: '#193478', gap: 12 }, eyebrow: { color: '#BDCDF5', fontWeight: '700', fontSize: 11, letterSpacing: 1.5 }, heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800' }, heroText: { color: '#E1E9FB', lineHeight: 23, fontSize: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#17263D' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, tile: { width: '47%', flexGrow: 1, minWidth: 130, padding: 18, borderRadius: 14, backgroundColor: '#fff', gap: 12, borderWidth: 1, borderColor: '#DFE6F0' }, tileTitle: { fontSize: 16, fontWeight: '700', color: '#17263D' }, notice: { padding: 18, gap: 10, borderRadius: 14, backgroundColor: '#fff' }, subtitle: { fontSize: 14, lineHeight: 21, color: '#52627A' }, error: { color: '#A32020' }, link: { color: '#2448A6', padding: 12 },
  header: { backgroundColor: '#fff' }, headerRow: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }, brand: { color: '#193478', fontWeight: '800', fontSize: 20 }, role: { color: '#52627A', fontSize: 12, marginTop: 4, textTransform: 'capitalize' }, logout: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
