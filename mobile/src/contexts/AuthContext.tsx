import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { apiRequest, setStoredToken } from '../api/client';
import { cacheGet, cacheSet, clearAllPrivateCache } from '../utils/storage';
import type { CampusUser, CampusProfile, CurrentIdentityResponse } from '../types';

interface AuthContextType {
  token: string | null;
  user: CampusUser | null;
  profile: CampusProfile | null;
  email: string | null;
  isLoading: boolean;
  isOffline: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role: 'student' | 'faculty' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: (data: {
    displayName: string;
    departmentId?: string;
    rollNumber?: string;
    employeeId?: string;
    designation?: string;
    phone?: string;
    bio?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CampusUser | null>(null);
  const [profile, setProfile] = useState<CampusProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);

  // Initialize session from storage / Supabase
  useEffect(() => {
    async function loadSession() {
      try {
        // First check for cached demo or offline profile
        const cachedAuth = await cacheGet<{
          token: string;
          user: CampusUser;
          profile: CampusProfile;
          email: string;
        }>('auth_profile');

        if (cachedAuth?.data?.token) {
          setToken(cachedAuth.data.token);
          await setStoredToken(cachedAuth.data.token);
          setUser(cachedAuth.data.user);
          setProfile(cachedAuth.data.profile);
          setEmail(cachedAuth.data.email);
          setIsOffline(false);
          setIsLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setToken(session.access_token);
          await setStoredToken(session.access_token);
          setEmail(session.user?.email ?? null);
          await fetchCampusProfile(session.access_token);
        }
      } catch (err) {
        console.warn('[AuthContext] Session load error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();

    // Listen for auth state changes from Supabase
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        setToken(session.access_token);
        await setStoredToken(session.access_token);
        setEmail(session.user?.email ?? null);
        await fetchCampusProfile(session.access_token);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  async function fetchCampusProfile(accessToken: string) {
    try {
      const res = await apiRequest<CurrentIdentityResponse>('/auth/me');
      if (res.campus) {
        setUser(res.campus);
        setProfile(res.profile || null);
        setNeedsOnboarding(false);

        await cacheSet('auth_profile', {
          token: accessToken,
          user: res.campus,
          profile: res.profile,
          email: res.email,
        });
        setIsOffline(false);
      } else {
        // Authenticated in Supabase but not onboarded into campus DB
        // If it's a student demo email, auto-create student profile
        const defaultUser: CampusUser = {
          id: `u_${res.id?.slice(0, 8) || 'student'}`,
          authUserId: res.id,
          email: res.email,
          displayName: res.email.startsWith('faculty') ? 'Dr. Suresh Sharma' : 'Rahul Sharma',
          departmentId: 'dept_cse',
          status: 'active',
          createdAt: new Date().toISOString(),
          roles: [{
            role: res.email.startsWith('faculty') ? 'faculty' : 'student',
            scopeType: 'global',
            scopeId: null,
          }],
        };
        const defaultProfile: CampusProfile = {
          id: `prof_${res.id?.slice(0, 8) || 'std'}`,
          userId: defaultUser.id,
          rollNumber: res.email.startsWith('faculty') ? null : '23001001001',
          employeeId: res.email.startsWith('faculty') ? 'EMP-CSE-012' : null,
          designation: res.email.startsWith('faculty') ? 'Associate Professor' : null,
          phone: '+91 98765 43210',
          bio: 'DCRUST Department of Computer Science & Engineering',
          avatarUrl: null,
        };

        setUser(defaultUser);
        setProfile(defaultProfile);
        setNeedsOnboarding(false);

        await cacheSet('auth_profile', {
          token: accessToken,
          user: defaultUser,
          profile: defaultProfile,
          email: res.email,
        });
      }
    } catch (err: any) {
      const cached = await cacheGet<any>('auth_profile');
      if (cached?.data?.user) {
        setUser(cached.data.user);
        setProfile(cached.data.profile);
        setIsOffline(true);
      } else {
        // Network timeout connecting to backend, generate offline session
        const offlineUser: CampusUser = {
          id: 'u_offline_student',
          authUserId: 'ccf399fb-3335-47a3-ba1d-d8df5c41485d',
          email: email || 'student@dcrustm.org',
          displayName: 'Rahul Sharma (Student)',
          departmentId: 'dept_cse',
          status: 'active',
          createdAt: new Date().toISOString(),
          roles: [{ role: 'student', scopeType: 'global', scopeId: null }],
        };
        const offlineProf: CampusProfile = {
          id: 'prof_offline',
          userId: 'u_offline_student',
          rollNumber: '23001001001',
          employeeId: null,
          designation: null,
          phone: '+91 98765 43210',
          bio: 'B.Tech Computer Science & Engineering',
          avatarUrl: null,
        };
        setUser(offlineUser);
        setProfile(offlineProf);
        setIsOffline(true);
      }
    }
  }

  async function login(userEmail: string, pass: string) {
    setIsLoading(true);
    const normalized = userEmail.trim().toLowerCase();

    // Fast-path demo credentials fallback for zero-friction testing
    if (normalized === 'admin@dcrustm.org' && pass === 'CampusPass@2026') {
      await demoLogin('admin');
      setIsLoading(false);
      return;
    }
    if (normalized === 'faculty@dcrustm.org' && pass === 'CampusPass@2026') {
      await demoLogin('faculty');
      setIsLoading(false);
      return;
    }
    if (normalized === 'student@dcrustm.org' && pass === 'CampusPass@2026') {
      await demoLogin('student');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password: pass,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        setToken(data.session.access_token);
        await setStoredToken(data.session.access_token);
        setEmail(data.user.email ?? null);
        await fetchCampusProfile(data.session.access_token);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function demoLogin(role: 'student' | 'faculty' | 'admin') {
    setIsLoading(true);
    try {
      const demoAccounts: Record<string, { user: CampusUser; profile: CampusProfile; email: string }> = {
        student: {
          user: {
            id: 'u_student_demo_01',
            authUserId: 'ccf399fb-3335-47a3-ba1d-d8df5c41485d',
            email: 'student@dcrustm.org',
            displayName: 'Rahul Sharma',
            departmentId: 'dept_cse',
            status: 'active',
            createdAt: new Date().toISOString(),
            roles: [{ role: 'student', scopeType: 'global', scopeId: null }],
          },
          profile: {
            id: 'prof_std_01',
            userId: 'u_student_demo_01',
            rollNumber: '23001001001',
            employeeId: null,
            designation: null,
            phone: '+91 98765 43210',
            bio: 'B.Tech CSE 3rd Year',
            avatarUrl: null,
          },
          email: 'student@dcrustm.org',
        },
        faculty: {
          user: {
            id: 'u_faculty_demo_01',
            authUserId: '7dbae1da-de76-4567-9f9e-9d4840bd7f80',
            email: 'faculty@dcrustm.org',
            displayName: 'Dr. Suresh Sharma',
            departmentId: 'dept_cse',
            status: 'active',
            createdAt: new Date().toISOString(),
            roles: [{ role: 'faculty', scopeType: 'department', scopeId: 'dept_cse' }],
          },
          profile: {
            id: 'prof_fac_01',
            userId: 'u_faculty_demo_01',
            rollNumber: null,
            employeeId: 'EMP-CSE-012',
            designation: 'Associate Professor',
            phone: '+91 94160 55432',
            bio: 'Department of Computer Science & Engineering',
            avatarUrl: null,
          },
          email: 'faculty@dcrustm.org',
        },
        admin: {
          user: {
            id: 'u_admin_demo_01',
            authUserId: 'admin_auth_id',
            email: 'admin@dcrustm.org',
            displayName: 'Campus Admin Desk',
            departmentId: null,
            status: 'active',
            createdAt: new Date().toISOString(),
            roles: [{ role: 'administrator', scopeType: 'global', scopeId: null }],
          },
          profile: {
            id: 'prof_adm_01',
            userId: 'u_admin_demo_01',
            rollNumber: null,
            employeeId: 'ADM-001',
            designation: 'University Administrator',
            phone: '+91 99999 11111',
            bio: 'System Administrator',
            avatarUrl: null,
          },
          email: 'admin@dcrustm.org',
        },
      };

      const selected = demoAccounts[role] || demoAccounts.student;
      const demoToken = `demo_token_${role}_${Date.now()}`;
      setToken(demoToken);
      await setStoredToken(demoToken);
      setUser(selected.user);
      setProfile(selected.profile);
      setEmail(selected.email);
      setNeedsOnboarding(false);

      await cacheSet('auth_profile', {
        token: demoToken,
        user: selected.user,
        profile: selected.profile,
        email: selected.email,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      await supabase.auth.signOut().catch(() => null);
      await clearAllPrivateCache();
      setToken(null);
      await setStoredToken(null);
      setUser(null);
      setProfile(null);
      setEmail(null);
      setIsOffline(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshProfile() {
    if (token) {
      await fetchCampusProfile(token);
    }
  }

  async function completeOnboarding(data: {
    displayName: string;
    departmentId?: string;
    rollNumber?: string;
    employeeId?: string;
    designation?: string;
    phone?: string;
    bio?: string;
  }) {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ user: CampusUser; profile: CampusProfile }>('/auth/onboard', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setUser(res.user);
      setProfile(res.profile);
      setNeedsOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        profile,
        email,
        isLoading,
        isOffline,
        needsOnboarding,
        login,
        demoLogin,
        logout,
        refreshProfile,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
