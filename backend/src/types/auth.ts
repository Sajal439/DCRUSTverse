export type RoleName =
  | 'student'
  | 'faculty'
  | 'department_head'
  | 'librarian'
  | 'hostel_warden'
  | 'placement_officer'
  | 'club_coordinator'
  | 'service_staff'
  | 'administrator';

export type ScopeType = 'global' | 'department' | 'course' | 'hostel' | 'club';

export type UserStatus = 'pending' | 'active' | 'disabled';

export interface AuthIdentity {
  id: string;
  email: string;
}

export type VerifyIdentity = (token: string) => Promise<AuthIdentity>;

export interface RoleAssignment {
  id: string;
  userId: string;
  role: RoleName;
  scopeType: ScopeType;
  scopeId: string | null;
  assignedBy?: string | null;
  createdAt: string;
}

export interface CampusUser {
  id: string;
  authUserId: string;
  email: string;
  displayName: string;
  departmentId: string | null;
  status: UserStatus;
  roles: RoleAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  rollNumber: string | null;
  employeeId: string | null;
  designation: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
