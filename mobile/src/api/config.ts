import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detect development host IP from Expo Metro bundler (e.g. 192.168.1.5:8081)
const debuggerHost = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
const hostIp = debuggerHost ? debuggerHost.split(':')[0] : '192.168.1.5';

// Android Emulator connects via 10.0.2.2 if not using hostUri
const DEV_API_HOST = Platform.OS === 'android' && !debuggerHost
  ? 'http://10.0.2.2:4000/api/v1'
  : `http://${hostIp}:4000/api/v1`;

export const APP_CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || DEV_API_HOST,
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ufzkmcxsenybgnxaalra.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_bvapyWSp-WrGIA9O6bh4jg_Ut9dLryd',
  APP_NAME: 'DCRUSTverse',
  UNIVERSITY_NAME: 'Deenbandhu Chhotu Ram University of Science & Technology',
  CAMPUS_LOCATION: 'Murthal, Sonipat, Haryana',
};
