import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@dcrustverse:cache:';

export async function cacheSet<T>(key: string, data: T): Promise<void> {
  try {
    const payload = JSON.stringify({
      data,
      cachedAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, payload);
  } catch (err) {
    console.warn(`[Storage] Failed to cache ${key}:`, err);
  }
}

export async function cacheGet<T>(key: string): Promise<{ data: T; cachedAt: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Storage] Failed to read cached ${key}:`, err);
    return null;
  }
}

export async function cacheRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (err) {
    console.warn(`[Storage] Failed to remove ${key}:`, err);
  }
}

export async function clearAllPrivateCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) || k.startsWith('@dcrustverse:auth:'));
    if (cacheKeys.length > 0) {
      await Promise.all(cacheKeys.map(k => AsyncStorage.removeItem(k)));
    }
  } catch (err) {
    console.warn('[Storage] Failed to clear private cache on logout:', err);
  }
}
