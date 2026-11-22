import React, { useState } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { enablePush, unregisterPush } from '../services/push';
import { ResourceScreen } from './ResourceScreen';

export function PushSettingsScreen() {
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [revision, setRevision] = useState(0);
  async function update(enable: boolean) {
    if (busy) return; setBusy(true);
    try { if (enable) await enablePush(); else await unregisterPush(); setRevision(n => n + 1); setMessage(enable ? 'Device registered for campus updates.' : 'Notifications disabled for this account on this device.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update notifications'); }
    finally { setBusy(false); }
  }
  return <View style={{ flex: 1 }}><View style={{ padding: 20, gap: 12 }}>
    <Text>Register this device to receive campus updates. You can remove other registered devices below.</Text>
    <Pressable disabled={busy} onPress={() => void update(true)}><Text style={{ color: '#2448A6', padding: 10 }}>Enable notifications</Text></Pressable>
    <Pressable disabled={busy} onPress={() => void update(false)}><Text style={{ color: '#2448A6', padding: 10 }}>Disable on this device</Text></Pressable>
    <Pressable onPress={() => void Linking.openSettings()}><Text style={{ color: '#2448A6', padding: 10 }}>Open device settings</Text></Pressable>
    <Text accessibilityLiveRegion="polite">{busy ? 'Updating…' : message}</Text>
  </View><ResourceScreen key={revision} resource={{ key: 'push-devices', title: 'Registered devices', description: 'Removing a device stops future push delivery to it.', group: 'My account', path: '/client/push/devices', columns: ['platform', 'enabled', 'updatedAt'], actions: [{ label: 'Remove device', path: '/client/push/devices/{id}', method: 'DELETE' }] }} /></View>;
}
