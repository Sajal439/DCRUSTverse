import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

export async function enablePush() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') throw new Error('Push registration requires the installed Android or iOS app.');
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('campus', { name: 'Campus updates', importance: Notifications.AndroidImportance.DEFAULT });
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Notifications are disabled. Enable them in your device settings.');
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('This build does not have a notification project configured.');
  const deviceToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const device = await apiRequest<{ id: string }>('/client/push/register', { method: 'POST', body: JSON.stringify({ deviceToken, platform: Platform.OS }) });
  await AsyncStorage.setItem('campus_push_device', device.id);
}
export async function unregisterPush() {
  const id = await AsyncStorage.getItem('campus_push_device');
  if (id) await apiRequest(`/client/push/devices/${id}`, { method: 'DELETE' });
  await AsyncStorage.removeItem('campus_push_device');
}
