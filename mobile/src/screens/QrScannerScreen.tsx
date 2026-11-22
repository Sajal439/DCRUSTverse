import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { WorkspaceForm } from '../components/WorkspaceForm';
import { RecordDetails } from './ResourceScreen';
import { qrLookupPath } from '../schemas/qr';
import { apiRequest } from '../api/client';
import type { RecordData } from '../types/workspace';

export function QrScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const focused = useIsFocused();
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RecordData | null>(null);
  const locked = useRef(false);
  const scan = async (code: string) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setResult(null); setCamera(false);
    try {
      setResult(await apiRequest<RecordData>(qrLookupPath(code)));
    } catch (err) { setError(err instanceof Error ? (err.name === 'ZodError' ? 'This is not a supported campus QR code.' : err.message) : 'Unable to verify code'); }
    finally { setBusy(false); locked.current = false; }
  };
  const openCamera = async () => {
    const granted = permission?.granted || (await requestPermission()).granted;
    if (granted) { setCamera(true); setError(''); setResult(null); }
    else setError('Camera access was not granted. You can paste the code below or enable camera access in settings.');
  };
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>Scan a campus QR</Text><Text style={styles.text}>Scan a digital ID or a maintained campus location code. Verification is checked against the campus server.</Text>
    <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => void openCamera()}><Text style={styles.buttonText}>Open QR scanner</Text></Pressable>
    {permission && !permission.canAskAgain && !permission.granted && <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()}><Text style={styles.link}>Open camera settings</Text></Pressable>}
    {camera && focused && permission?.granted && <View style={styles.camera}><CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => void scan(data)} /></View>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {!!result && <View style={styles.card}><Text style={styles.title}>{result.valid === true ? 'Identity verified' : result.status === 'available' ? 'Campus location found' : 'Lookup result'}</Text><RecordDetails data={result} /></View>}
    <WorkspaceForm fields={[{ key: 'code', label: 'Or paste a campus verification code', required: true }]} label="Look up code" busy={busy} onSubmit={data => void scan(String(data.code))} />
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, flexGrow: 1, backgroundColor: '#F3F6FC' }, title: { fontSize: 24, color: '#17263D', fontWeight: '800' }, text: { fontSize: 15, color: '#52627A', lineHeight: 22 },
  camera: { height: 320, borderRadius: 16, overflow: 'hidden' }, button: { padding: 16, backgroundColor: '#2448A6', borderRadius: 10 }, buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' }, error: { color: '#A32020', lineHeight: 22 }, link: { color: '#2448A6', padding: 12 }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 16 },
});
