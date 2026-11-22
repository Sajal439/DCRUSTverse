import { requestRecovery } from '../services/recovery';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { THEME } from '../styles/theme';
import { registerAccount } from '../services/registration';

export const LoginScreen: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [notice, setNotice] = useState('');

  const handleLogin = async () => {
    if (isLoading) return;
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your campus email and password.');
      return;
    }
    setErrorMsg(null);
    setNotice('');
    setIsLoading(true);
    try {
      if (registering) {
        await registerAccount(email, password);
        setNotice('Check your inbox to verify your email, then sign in and complete your campus profile. Campus access requires administrator approval.');
        setRegistering(false);
      } else { await login(email, password); }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally { setIsLoading(false); }
  };

  const handleInstantDemo = async (role: 'student' | 'faculty' | 'admin') => {
    setErrorMsg(null);
    try {
      await demoLogin(role);
    } catch (err: any) {
      setErrorMsg('Demo sign-in failed.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* University Crest Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="school" size={48} color={THEME.colors.accent} />
          </View>
          <Text style={styles.brandTitle}>DCRUSTverse</Text>
          <Text style={styles.brandSubtitle}>
            Deenbandhu Chhotu Ram University of Science & Technology
          </Text>
          <Text style={styles.locationTag}>Murthal, Sonipat</Text>
        </View>

        {/* 1-Tap Instant Demo Access Section */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeaderRow}>
            <MaterialCommunityIcons name="lightning-bolt" size={18} color="#D97706" />
            <Text style={styles.demoCardTitle}>Preview sample screens</Text>
          </View>
          <Text style={styles.demoCardSub}>Preview only. Sample accounts do not submit requests or access real campus records.</Text>
          <View style={styles.demoBtnRow}>
            <TouchableOpacity
              style={[styles.demoRoleBtn, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
              onPress={() => handleInstantDemo('student')}
              activeOpacity={0.7}
            >
              <Text style={styles.roleEmoji}>🎓</Text>
              <Text style={[styles.roleBtnText, { color: '#3730A3' }]}>Student</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoRoleBtn, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
              onPress={() => handleInstantDemo('faculty')}
              activeOpacity={0.7}
            >
              <Text style={styles.roleEmoji}>👨‍🏫</Text>
              <Text style={[styles.roleBtnText, { color: '#92400E' }]}>Faculty</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoRoleBtn, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}
              onPress={() => handleInstantDemo('admin')}
              activeOpacity={0.7}
            >
              <Text style={styles.roleEmoji}>🛡️</Text>
              <Text style={[styles.roleBtnText, { color: '#334155' }]}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Standard Email / Password Sign-In Box */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>{registering ? 'Create your account' : 'Campus sign in'}</Text>
          <Text style={styles.formSubtitle}>Use your verified campus account for live services.</Text>

          {errorMsg && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}
          {!!notice && <Text accessibilityLiveRegion="polite" style={{ color: '#12643A', marginBottom: 16, lineHeight: 21 }}>{notice}</Text>}

          <TouchableOpacity disabled={isLoading} onPress={async () => { setIsLoading(true); setErrorMsg(null); try { await requestRecovery(email); setNotice('If an account exists, a recovery email will arrive. Open its link on this Android device.'); } catch (error) { setErrorMsg(error instanceof Error ? error.message : 'Recovery request failed'); } finally { setIsLoading(false); } }}><Text style={{ color: '#2448A6', paddingVertical: 14 }}>Forgot password? Enter your email below, then tap here.</Text></TouchableOpacity>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>University Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={20} color={THEME.colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="rollnumber@dcrustm.org"
                placeholderTextColor={THEME.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={THEME.colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={THEME.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={THEME.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title={registering ? 'Register & verify email' : 'Sign in'}
            onPress={handleLogin}
            loading={isLoading}
            size="lg"
            style={styles.signInBtn}
          />
          <TouchableOpacity accessibilityRole="button" disabled={isLoading} onPress={() => { setRegistering(!registering); setErrorMsg(null); }} style={{ padding: 16 }}><Text style={{ color: '#2448A6', textAlign: 'center', fontWeight: '700' }}>{registering ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text></TouchableOpacity>
        </View>

        <Text style={styles.footerHelp}>
          Official portal for DCRUST Murthal campus students, staff, and faculty.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.primaryDark,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: THEME.spacing.md,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.primary,
    borderWidth: 2,
    borderColor: THEME.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs,
    ...THEME.shadows.float,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 20,
  },
  locationTag: {
    fontSize: 10,
    color: THEME.colors.accentLight,
    fontWeight: '600',
    marginTop: 2,
  },
  demoCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: THEME.spacing.md,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  demoCardSub: {
    fontSize: 11,
    color: '#78350F',
    marginBottom: 10,
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoRoleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 6,
  },
  roleEmoji: {
    fontSize: 16,
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    ...THEME.shadows.float,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  formSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: THEME.spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    flex: 1,
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    height: 46,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.text,
  },
  signInBtn: {
    marginTop: THEME.spacing.sm,
  },
  footerHelp: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: THEME.spacing.lg,
    lineHeight: 16,
  },
});
