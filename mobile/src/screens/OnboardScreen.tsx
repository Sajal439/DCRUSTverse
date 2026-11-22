import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { THEME } from '../styles/theme';

export const OnboardScreen: React.FC = () => {
  const { completeOnboarding, email } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    setErrorMsg(null);
    if (isLoading) return;
    setIsLoading(true);
    try {
      await completeOnboarding({
        displayName: displayName.trim(),
        rollNumber: rollNumber.trim() || undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Onboarding failed.');
    } finally { setIsLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="account-plus-outline" size={32} color={THEME.colors.primary} />
          </View>

          <Text style={styles.title}>Campus Profile Setup</Text>
          <Text style={styles.subtitle}>
            Welcome! Complete your student/faculty profile for {email}
          </Text>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Roll Number / Employee ID</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 23001001001"
              value={rollNumber}
              onChangeText={setRollNumber}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Short Bio / Interests</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Computer Science, Robotics Club..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />
          </View>

          <Button
            title="Complete Registration"
            onPress={handleSubmit}
            loading={isLoading}
            size="lg"
            style={{ marginTop: 12 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: THEME.spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    ...THEME.shadows.card,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: THEME.spacing.lg,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    color: THEME.colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});
