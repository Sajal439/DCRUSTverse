import type { CampusUser, CampusProfile } from './index';
export type OnboardingData = {
  displayName: string; departmentId?: string; rollNumber?: string; employeeId?: string;
  designation?: string; phone?: string; bio?: string;
};
export interface AuthContextType {
  passwordRecovery: boolean; finishRecovery: () => void;
  token: string | null; user: CampusUser | null; profile: CampusProfile | null; email: string | null;
  isLoading: boolean; isOffline: boolean; isDemo: boolean; needsOnboarding: boolean; authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role: 'student' | 'faculty' | 'admin') => Promise<void>;
  logout: () => Promise<void>; refreshProfile: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
}
