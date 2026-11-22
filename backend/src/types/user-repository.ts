import type { CampusUser, RoleAssignment, UserProfile, RoleName, ScopeType, UserStatus } from './auth.ts';

export interface CreateUserData {
  authUserId: string;
  email: string;
  displayName: string;
  departmentId?: string | null;
  status?: UserStatus;
}

export interface AssignRoleData {
  userId: string;
  role: RoleName;
  scopeType: ScopeType;
  scopeId?: string | null;
  assignedBy?: string | null;
}

export interface CreateAuditData {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CampusUserRepository {
  findByAuthId(authUserId: string): Promise<CampusUser | null>;
  findById(id: string): Promise<CampusUser | null>;
  findByEmail(email: string): Promise<CampusUser | null>;
  create(data: CreateUserData): Promise<CampusUser>;
  updateStatus(id: string, status: UserStatus): Promise<CampusUser | null>;
  listUsers(options?: {
    departmentId?: string;
    status?: UserStatus;
    role?: RoleName;
    limit?: number;
    offset?: number;
  }): Promise<{ users: CampusUser[]; total: number }>;
  assignRole(data: AssignRoleData): Promise<RoleAssignment>;
  revokeRole(assignmentId: string): Promise<boolean>;
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, data: Partial<Pick<UserProfile, 'phone' | 'bio' | 'avatarUrl' | 'metadata'>>): Promise<UserProfile | null>;
  createProfile(userId: string, data?: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<UserProfile>;
  logAudit(data: CreateAuditData): Promise<void>;
}
