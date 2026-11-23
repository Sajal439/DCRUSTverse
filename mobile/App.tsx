import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { Header } from './src/components/Header';
import { LoginScreen } from './src/screens/LoginScreen';
import { OnboardScreen } from './src/screens/OnboardScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DigitalIdScreen } from './src/screens/DigitalIdScreen';
import { AcademicsScreen } from './src/screens/AcademicsScreen';
import { TicketsScreen } from './src/screens/TicketsScreen';
import { NoticesScreen } from './src/screens/NoticesScreen';
import { CampusMapScreen } from './src/screens/CampusMapScreen';
import { BusTrackerScreen } from './src/screens/BusTrackerScreen';
import { AiAssistantScreen } from './src/screens/AiAssistantScreen';
import { AdminUsersScreen } from './src/screens/AdminUsersScreen';
import { THEME } from './src/styles/theme';

function MainApp() {
  const { user, token, isLoading, isOffline, needsOnboarding, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Connecting to DCRUSTverse Campus Portal...</Text>
      </View>
    );
  }

  // If not authenticated, show Login Screen
  if (!token) {
    return <LoginScreen />;
  }

  // If authenticated in Supabase but not yet onboarded in campus database
  if (needsOnboarding) {
    return <OnboardScreen />;
  }

  const primaryRole = user?.roles?.[0]?.role || (user?.email?.startsWith('faculty') ? 'faculty' : user?.email?.startsWith('admin') ? 'administrator' : 'student');

  // Render active screen
  const renderScreen = () => {
    switch (currentTab) {
      case 'home':
        return <DashboardScreen onNavigate={setCurrentTab} />;
      case 'academics':
        return <AcademicsScreen />;
      case 'admin-users':
        return <AdminUsersScreen />;
      case 'digital-id':
        return <DigitalIdScreen />;
      case 'map':
        return <CampusMapScreen />;
      case 'bus':
        return <BusTrackerScreen />;
      case 'ai':
        return <AiAssistantScreen />;
      case 'tickets':
        return <TicketsScreen />;
      case 'notices':
        return <NoticesScreen />;
      default:
        return <DashboardScreen onNavigate={setCurrentTab} />;
    }
  };

  const getHeaderTitle = () => {
    switch (currentTab) {
      case 'home':
        return primaryRole === 'administrator' ? 'Admin Command' : primaryRole === 'faculty' ? 'Faculty Portal' : 'Student Portal';
      case 'academics':
        return primaryRole === 'faculty' ? 'Instructor Workflows' : 'My Academics';
      case 'admin-users':
        return 'Campus User Control';
      case 'digital-id':
        return 'Digital Identity';
      case 'map':
        return 'Campus Explorer';
      case 'bus':
        return primaryRole === 'administrator' ? 'Fleet Telemetry' : 'Live Bus Telemetry';
      case 'ai':
        return 'DCRUSTbot Assistant';
      case 'tickets':
        return primaryRole === 'administrator' ? 'Complaints Queue' : 'Complaints & Requests';
      case 'notices':
        return primaryRole === 'administrator' ? 'Publish Circulars' : 'Campus Circulars';
      default:
        return 'DCRUSTverse';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Campus Header with Offline Indicator & Actions */}
      <Header
        title={getHeaderTitle()}
        subtitle={`DCRUST Murthal • Logged in as ${user?.displayName || 'User'}`}
        isOffline={isOffline}
        onLogout={logout}
        onOpenNotifications={() => setCurrentTab('notices')}
        unreadCount={2}
      />

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Dynamic Role-Adaptive Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        {/* TAB 1: HOME / OVERVIEW */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setCurrentTab('home')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={currentTab === 'home' ? 'view-dashboard' : 'view-dashboard-outline'}
            size={22}
            color={currentTab === 'home' ? THEME.colors.primary : THEME.colors.textSecondary}
          />
          <Text style={[styles.tabLabel, currentTab === 'home' && styles.tabLabelActive]}>
            {primaryRole === 'administrator' ? 'Overview' : 'Home'}
          </Text>
        </TouchableOpacity>

        {/* TAB 2: ACADEMICS / USERS (ADMIN) */}
        {primaryRole === 'administrator' ? (
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setCurrentTab('admin-users')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={currentTab === 'admin-users' ? 'account-multiple' : 'account-multiple-outline'}
              size={22}
              color={currentTab === 'admin-users' ? THEME.colors.primary : THEME.colors.textSecondary}
            />
            <Text style={[styles.tabLabel, currentTab === 'admin-users' && styles.tabLabelActive]}>
              Users
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setCurrentTab('academics')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={currentTab === 'academics' ? 'book-education' : 'book-education-outline'}
              size={22}
              color={currentTab === 'academics' ? THEME.colors.primary : THEME.colors.textSecondary}
            />
            <Text style={[styles.tabLabel, currentTab === 'academics' && styles.tabLabelActive]}>
              {primaryRole === 'faculty' ? 'Teaching' : 'Academics'}
            </Text>
          </TouchableOpacity>
        )}

        {/* TAB 3: CENTER PROMINENT BUTTON (ID CARD OR COMPLAINTS FOR ADMIN) */}
        {primaryRole === 'administrator' ? (
          <TouchableOpacity
            style={styles.centerIdBtn}
            onPress={() => setCurrentTab('tickets')}
            activeOpacity={0.8}
          >
            <View style={[styles.centerIdCircle, currentTab === 'tickets' && styles.centerIdCircleActive]}>
              <MaterialCommunityIcons name="wrench-outline" size={24} color="#FFF" />
            </View>
            <Text style={[styles.tabLabel, currentTab === 'tickets' && styles.tabLabelActive]}>
              Tickets
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.centerIdBtn}
            onPress={() => setCurrentTab('digital-id')}
            activeOpacity={0.8}
          >
            <View style={[styles.centerIdCircle, currentTab === 'digital-id' && styles.centerIdCircleActive]}>
              <MaterialCommunityIcons name="qrcode-scan" size={24} color="#FFF" />
            </View>
            <Text style={[styles.tabLabel, currentTab === 'digital-id' && styles.tabLabelActive]}>
              My ID
            </Text>
          </TouchableOpacity>
        )}

        {/* TAB 4: TRANSIT / BUS (OR NOTICES FOR ADMIN) */}
        {primaryRole === 'administrator' ? (
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setCurrentTab('notices')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={currentTab === 'notices' ? 'bullhorn' : 'bullhorn-outline'}
              size={22}
              color={currentTab === 'notices' ? THEME.colors.primary : THEME.colors.textSecondary}
            />
            <Text style={[styles.tabLabel, currentTab === 'notices' && styles.tabLabelActive]}>
              Circulars
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setCurrentTab('bus')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={currentTab === 'bus' || currentTab === 'map' ? 'bus-clock' : 'bus'}
              size={22}
              color={currentTab === 'bus' || currentTab === 'map' ? THEME.colors.primary : THEME.colors.textSecondary}
            />
            <Text style={[styles.tabLabel, (currentTab === 'bus' || currentTab === 'map') && styles.tabLabelActive]}>
              Transit
            </Text>
          </TouchableOpacity>
        )}

        {/* TAB 5: AI HELP (OR FLEET FOR ADMIN) */}
        {primaryRole === 'administrator' ? (
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setCurrentTab('bus')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={currentTab === 'bus' ? 'bus-multiple' : 'bus'}
              size={22}
              color={currentTab === 'bus' ? THEME.colors.primary : THEME.colors.textSecondary}
            />
            <Text style={[styles.tabLabel, currentTab === 'bus' && styles.tabLabelActive]}>
              Fleet
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setCurrentTab('ai')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={currentTab === 'ai' ? 'robot' : 'robot-outline'}
              size={22}
              color={currentTab === 'ai' ? THEME.colors.primary : THEME.colors.textSecondary}
            />
            <Text style={[styles.tabLabel, currentTab === 'ai' && styles.tabLabelActive]}>
              AI Help
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 62,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
    ...THEME.shadows.card,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginTop: 3,
  },
  tabLabelActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  centerIdBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: -16,
  },
  centerIdCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.float,
  },
  centerIdCircleActive: {
    backgroundColor: THEME.colors.accent,
  },
});
