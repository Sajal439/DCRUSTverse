import React, { useState } from 'react';
import { ScrollView, Text, TextInput, Pressable } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { changeRecoveredPassword } from '../services/recovery';
export function PasswordRecoveryScreen() {
  const { finishRecovery, logout } = useAuth();
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function save() {
    if (busy) return; setBusy(true); setError('');
    try { await changeRecoveredPassword(password, confirmation); finishRecovery(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Password change failed'); }
    finally { setBusy(false); }
  }
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 20 }}>
    <Text style={{ fontSize: 26, fontWeight: '700' }}>Set a new password</Text>
    <Text>Use at least 12 characters.</Text>
    <TextInput accessibilityLabel="New password" placeholder="New password" secureTextEntry value={password} onChangeText={setPassword} style={{ padding: 14, borderWidth: 1 }} />
    <TextInput accessibilityLabel="Confirm password" placeholder="Confirm password" secureTextEntry value={confirmation} onChangeText={setConfirmation} style={{ padding: 14, borderWidth: 1 }} />
    {!!error && <Text accessibilityRole="alert" style={{ color: '#A32020' }}>{error}</Text>}
    <Pressable disabled={busy} onPress={() => void save()}><Text style={{ color: '#2448A6', padding: 12 }}>{busy ? 'Saving…' : 'Save password'}</Text></Pressable>
    <Pressable disabled={busy} onPress={() => void logout()}><Text style={{ padding: 12 }}>Cancel and sign out</Text></Pressable>
  </ScrollView>;
}
