import { Linking, Alert } from 'react-native';
import { acceptRecovery } from '../services/recovery';
import { unregisterPush } from '../services/push';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../api/supabase';
import { apiRequest, setStoredToken } from '../api/client';
import { cacheGet, cacheSet, clearAllPrivateCache } from '../utils/storage';
import { demoAccounts } from '../config/demo-accounts';
import type { CampusUser, CampusProfile, CurrentIdentityResponse } from '../types';
import type { AuthContextType, OnboardingData } from '../types/auth-context';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CampusUser | null>(null);
  const [profile, setProfile] = useState<CampusProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const demoMode = useRef(false);
  const revision = useRef(0);

  async function fetchCampusProfile(accessToken: string) {
    const current = ++revision.current;
    setAuthError(null);
    try {
      const identity = await apiRequest<CurrentIdentityResponse>('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (current !== revision.current || demoMode.current) return;
      setUser(identity.campus ?? null);
      setProfile(identity.profile ?? null);
      setEmail(identity.email);
      setNeedsOnboarding(!identity.campus);
    } catch (error) {
      if (current !== revision.current || demoMode.current) return;
      setUser(null); setProfile(null); setNeedsOnboarding(false);
      setAuthError(error instanceof Error ? error.message : 'Cannot reach the campus server. Please retry.');
    }
  }

  async function resetLocal() {
    revision.current++; setPasswordRecovery(false);
    setToken(null); setUser(null); setProfile(null); setEmail(null);
    setNeedsOnboarding(false); setAuthError(null); setIsDemo(false);
    await clearAllPrivateCache();
    await setStoredToken(null);
  }

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const cached = await cacheGet<{ role: 'student' | 'faculty' | 'admin' }>('demo_session');
        if (!active) return;
        if (cached?.data && cached.data.role in demoAccounts) {
          await demoLogin(cached.data.role);
          return;
        }
        // Supabase is the authority for live sessions; a cached profile cannot authenticate.
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) throw error;
        if (session) {
          setToken(session.access_token); setEmail(session.user.email ?? null);
          await setStoredToken(session.access_token);
          await fetchCampusProfile(session.access_token);
        } else { await setStoredToken(null); }
      } catch (error) {
        if (active) setAuthError(error instanceof Error ? error.message : 'Session could not be restored');
      } finally { if (active) setIsLoading(false); }
    };
    void initialize();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      // Defer work until Supabase has released its auth lock.
      if (event === 'INITIAL_SESSION' || demoMode.current) return;
      setTimeout(() => {
        if (!active || demoMode.current) return;
        if (!session) { void resetLocal(); return; }
        setToken(session.access_token); setEmail(session.user.email ?? null);
        void setStoredToken(session.access_token).then(() => fetchCampusProfile(session.access_token));
      }, 0);
    });
    return () => { active = false; revision.current++; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const receive = async (url: string | null | undefined) => {
      if (!url?.startsWith('dcrustverse://auth/recovery')) return;
      try { await acceptRecovery(url); setPasswordRecovery(true); }
      catch { Alert.alert('Recovery link unavailable', 'This link is invalid or expired. Request a new recovery email.'); }
    };
    void Linking.getInitialURL().then(receive);
    const listener = Linking.addEventListener('url', event => { void receive(event.url); });
    return () => listener.remove();
  }, []);
  async function login(userEmail: string, password: string) {
    setAuthError(null); demoMode.current = false; setIsDemo(false);
    try {
      await clearAllPrivateCache();
      const { data, error } = await supabase.auth.signInWithPassword({ email: userEmail.trim().toLowerCase(), password });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error('No authenticated session was returned.');
      setToken(data.session.access_token); setEmail(data.user.email ?? null);
      await setStoredToken(data.session.access_token);
      await fetchCampusProfile(data.session.access_token);
    } finally { setIsLoading(false); }
  }

  async function demoLogin(role: 'student' | 'faculty' | 'admin') {
    demoMode.current = true; revision.current++; setIsLoading(true);
    try {
      await clearAllPrivateCache();
      const account = demoAccounts[role];
      const previewToken = `demo_token_${role}`;
      setIsDemo(true); setToken(previewToken); setUser(account.user); setProfile(account.profile); setEmail(account.email);
      setNeedsOnboarding(false); setAuthError(null);
      await setStoredToken(previewToken);
      await cacheSet('demo_session', { role });
    } finally { setIsLoading(false); }
  }

  async function logout() {
    if (!demoMode.current) await unregisterPush().catch(() => undefined);
    setIsLoading(true);
    const wasDemo = demoMode.current;
    demoMode.current = false;
    try { if (!wasDemo) await supabase.auth.signOut({ scope: 'local' }); }
    finally { await resetLocal(); setIsLoading(false); }
  }
  async function refreshProfile() { if (token && !demoMode.current) await fetchCampusProfile(token); }
  async function completeOnboarding(data: OnboardingData) {
    // Keep the form mounted so submission errors remain visible.
    const result = await apiRequest<{ user: CampusUser; profile: CampusProfile }>('/auth/onboard', { method: 'POST', body: JSON.stringify(data) });
    setUser(result.user); setProfile(result.profile); setNeedsOnboarding(false);
  }
  return <AuthContext.Provider value={{ passwordRecovery, finishRecovery: () => setPasswordRecovery(false), token, user, profile, email, isLoading, isOffline: false, isDemo, needsOnboarding, authError, login, demoLogin, logout, refreshProfile, completeOnboarding }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
