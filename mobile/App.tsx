import { PasswordRecoveryScreen } from './src/screens/PasswordRecoveryScreen';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { OnboardScreen } from './src/screens/OnboardScreen';
import { CampusTabs } from './src/navigation/CampusTabs';
import { LiveTabs } from './src/navigation/LiveTabs';
import { THEME } from './src/styles/theme';

function MainApp() {
  const { passwordRecovery, token, user, isLoading, isDemo, authError, needsOnboarding, refreshProfile, logout } = useAuth();
  if (passwordRecovery) return <SafeAreaView style={styles.container}><PasswordRecoveryScreen /></SafeAreaView>;
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Connecting to DCRUSTverse Campus Portal...</Text>
      </SafeAreaView>
    );
  }
  if (token && (authError || (!needsOnboarding && user?.status !== 'active'))) {
    return <SafeAreaView style={styles.loading}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 16 }}>{authError ? 'Campus connection unavailable' : 'Account awaiting approval'}</Text>
      <Text style={styles.loadingText}>{authError || 'Your profile has been submitted. A campus administrator must activate your account and assign your role.'}</Text>
      <Pressable accessibilityRole="button" onPress={() => void refreshProfile()} style={{ padding: 16 }}><Text style={{ color: '#2448A6' }}>Retry / check account status</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => void logout()} style={{ padding: 16 }}><Text style={{ color: '#2448A6' }}>Sign out</Text></Pressable>
    </SafeAreaView>;
  }
  if (!token || needsOnboarding) {
    return (
      <SafeAreaView style={styles.container}>
        {!token ? <LoginScreen /> : <OnboardScreen />}
      </SafeAreaView>
    );
  }
  if (isDemo) return <View style={{ flex: 1 }}><SafeAreaView edges={['top']} style={{ backgroundColor: '#FFF2CC' }}><Text style={{ padding: 10, color: '#704D00', textAlign: 'center' }}>PREVIEW ONLY · Sample data. Changes are local and never submitted.</Text></SafeAreaView><CampusTabs /></View>;
  return <LiveTabs />;
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style="dark" />
      <AuthProvider><MainApp /></AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.colors.background, padding: 20 },
  loadingText: { marginTop: 12, fontSize: 13, color: THEME.colors.textSecondary, fontWeight: '500' },
});
