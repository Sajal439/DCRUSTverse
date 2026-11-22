import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AcademicsScreen } from '../screens/AcademicsScreen';
import { AdminUsersScreen } from '../screens/AdminUsersScreen';
import { DigitalIdScreen } from '../screens/DigitalIdScreen';
import { TicketsScreen } from '../screens/TicketsScreen';
import { NoticesScreen } from '../screens/NoticesScreen';
import { CampusMapScreen } from '../screens/CampusMapScreen';
import { BusTrackerScreen } from '../screens/BusTrackerScreen';
import { AiAssistantScreen } from '../screens/AiAssistantScreen';
import { THEME } from '../styles/theme';
import type { CampusRoute, CampusTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<CampusTabParamList>();
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const icons: Record<CampusRoute, IconName> = {
  home: 'view-dashboard', academics: 'book-education', 'admin-users': 'account-multiple',
  'digital-id': 'qrcode-scan', tickets: 'wrench-outline', notices: 'bullhorn',
  map: 'map-marker', bus: 'bus', ai: 'robot',
};

function HomeScreen({ navigation }: BottomTabScreenProps<CampusTabParamList, 'home'>) {
  return <DashboardScreen onNavigate={(screen) => navigation.navigate(screen)} />;
}

export function CampusTabs() {
  const { user, isOffline, logout } = useAuth();
  // Retain demo-role presentation. API authorization remains server-side.
  const role = user?.roles?.[0]?.role || (user?.email?.startsWith('faculty') ? 'faculty' : user?.email?.startsWith('admin') ? 'administrator' : 'student');
  const admin = role === 'administrator';
  const faculty = role === 'faculty';
  const visible: CampusRoute[] = admin
    ? ['home', 'admin-users', 'tickets', 'notices', 'bus']
    : ['home', 'academics', 'digital-id', 'bus', 'ai'];
  const titles: Record<CampusRoute, string> = {
    home: admin ? 'Admin Command' : faculty ? 'Faculty Portal' : 'Student Portal',
    academics: faculty ? 'Instructor Workflows' : 'My Academics',
    'admin-users': 'Campus User Control', 'digital-id': 'Digital Identity',
    tickets: admin ? 'Complaints Queue' : 'Complaints & Requests',
    notices: admin ? 'Publish Circulars' : 'Campus Circulars', map: 'Campus Explorer',
    bus: admin ? 'Fleet Telemetry' : 'Live Bus Telemetry', ai: 'DCRUSTbot Assistant',
  };
  const labels: Record<CampusRoute, string> = {
    home: admin ? 'Overview' : 'Home', academics: faculty ? 'Teaching' : 'Academics',
    'admin-users': 'Users', 'digital-id': 'My ID', tickets: 'Tickets',
    notices: 'Circulars', map: 'Map', bus: admin ? 'Fleet' : 'Transit', ai: 'AI Help',
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        key={`${user?.id ?? 'campus'}:${role}`}
        initialRouteName="home"
        backBehavior="history"
        screenOptions={({ route, navigation }) => ({
          title: titles[route.name],
          tabBarLabel: labels[route.name],
          tabBarActiveTintColor: THEME.colors.primary,
          tabBarInactiveTintColor: THEME.colors.textSecondary,
          tabBarHideOnKeyboard: true,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: visible.includes(route.name) ? undefined : { display: 'none' },
          tabBarButton: visible.includes(route.name) ? undefined : () => null,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={icons[route.name]} color={color} size={size} />,
          header: () => (
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
              <Header title={titles[route.name]}
                subtitle={`DCRUST Murthal • Logged in as ${user?.displayName || 'User'}`}
                isOffline={isOffline} onLogout={logout}
                onOpenNotifications={() => navigation.navigate('notices')} unreadCount={2} />
            </SafeAreaView>
          ),
        })}
        screenLayout={({ children }) => (
          <SafeAreaView edges={['left', 'right']} style={styles.content}>{children}</SafeAreaView>
        )}
      >
        <Tab.Screen name="home" component={HomeScreen} />
        {admin ? <Tab.Screen name="admin-users" component={AdminUsersScreen} /> : <Tab.Screen name="academics" component={AcademicsScreen} />}
        {admin ? <Tab.Screen name="tickets" component={TicketsScreen} /> : <Tab.Screen name="digital-id" component={DigitalIdScreen} />}
        {admin && <Tab.Screen name="notices" component={NoticesScreen} />}
        <Tab.Screen name="bus" component={BusTrackerScreen} />
        <Tab.Screen name="ai" component={AiAssistantScreen} />
        <Tab.Screen name="map" component={CampusMapScreen} />
        {!admin && <Tab.Screen name="tickets" component={TicketsScreen} />}
        {!admin && <Tab.Screen name="notices" component={NoticesScreen} />}
        {admin && <Tab.Screen name="academics" component={AcademicsScreen} />}
        {admin && <Tab.Screen name="digital-id" component={DigitalIdScreen} />}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: THEME.colors.surface },
  content: { flex: 1, backgroundColor: THEME.colors.background },
  tabBar: { backgroundColor: THEME.colors.surface, borderTopColor: THEME.colors.border },
});
