import { HttpError } from '../../../lib/http-error.ts';
import { departments, courses, hostels, clubs } from '../../../database/schema.ts';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { users, roleAssignments, profiles, auditEvents } from '../../../database/schema.ts';
import type { CampusUser, RoleAssignment, UserProfile, RoleName, ScopeType, UserStatus } from '../../../types/auth.ts';
import type { CreateUserData, AssignRoleData, CreateAuditData, CampusUserRepository } from '../../../types/user-repository.ts';

export type { CreateUserData, AssignRoleData, CreateAuditData, CampusUserRepository };

export function createDrizzleUserRepository(db: NodePgDatabase<typeof schema>): CampusUserRepository {
  async function loadRolesForUser(userId: string): Promise<RoleAssignment[]> {
    const rows = await db
      .select()
      .from(roleAssignments)
      .where(eq(roleAssignments.userId, userId));
    return rows.map(r => ({
      id: r.id,
      userId: r.userId,
      role: r.role as RoleName,
      scopeType: r.scopeType as ScopeType,
      scopeId: r.scopeId,
      assignedBy: r.assignedBy,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  function mapCampusUser(row: typeof users.$inferSelect, roles: RoleAssignment[]): CampusUser {
    return {
      id: row.id,
      authUserId: row.authUserId,
      email: row.email,
      displayName: row.displayName,
      departmentId: row.departmentId,
      status: row.status as UserStatus,
      roles,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  return {
    async findByAuthId(authUserId: string): Promise<CampusUser | null> {
      const [row] = await db.select().from(users).where(eq(users.authUserId, authUserId)).limit(1);
      if (!row) return null;
      const roles = await loadRolesForUser(row.id);
      return mapCampusUser(row, roles);
    },

    async findById(id: string): Promise<CampusUser | null> {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!row) return null;
      const roles = await loadRolesForUser(row.id);
      return mapCampusUser(row, roles);
    },

    async findByEmail(email: string): Promise<CampusUser | null> {
      const [row] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
      if (!row) return null;
      const roles = await loadRolesForUser(row.id);
      return mapCampusUser(row, roles);
    },

    async create(data: CreateUserData): Promise<CampusUser> {
      const [row] = await db
        .insert(users)
        .values({
          authUserId: data.authUserId,
          email: data.email.toLowerCase().trim(),
          displayName: data.displayName.trim(),
          departmentId: data.departmentId ?? null,
          status: data.status ?? 'pending',
        })
        .returning();
      if (!row) throw new Error('Failed to create user');
      return mapCampusUser(row, []);
    },

    async updateStatus(id: string, status: UserStatus): Promise<CampusUser | null> {
      const [row] = await db
        .update(users)
        .set({ status, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      if (!row) return null;
      const roles = await loadRolesForUser(row.id);
      return mapCampusUser(row, roles);
    },

    async listUsers(options = {}): Promise<{ users: CampusUser[]; total: number }> {
      const limit = Math.min(options.limit ?? 20, 100);
      const offset = options.offset ?? 0;
      const conditions = [];

      if (options.departmentId) {
        conditions.push(eq(users.departmentId, options.departmentId));
      }
      if (options.status) {
        conditions.push(eq(users.status, options.status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select()
        .from(users)
        .where(whereClause)
        .limit(limit)
        .offset(offset);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(whereClause);

      const total = countResult?.count ?? 0;
      const userList = await Promise.all(
        rows.map(async r => {
          const roles = await loadRolesForUser(r.id);
          return mapCampusUser(r, roles);
        }),
      );

      return { users: userList, total };
    },

    async assignRole(data: AssignRoleData): Promise<RoleAssignment> {
      if (data.scopeType !== 'global') {
        const table = { department: departments, course: courses, hostel: hostels, club: clubs }[data.scopeType];
        const [scope] = await db.select({ id: table.id }).from(table).where(eq(table.id, data.scopeId!));
        if (!scope) throw new HttpError(400, 'INVALID_SCOPE', 'The selected role scope no longer exists');
      }
      const previous = await loadRolesForUser(data.userId);
      const duplicate = previous.find(role => role.role === data.role && role.scopeType === data.scopeType && role.scopeId === (data.scopeId ?? null));
      if (duplicate) return duplicate;
      const [row] = await db
        .insert(roleAssignments)
        .values({
          userId: data.userId,
          role: data.role,
          scopeType: data.scopeType,
          scopeId: data.scopeId ?? null,
          assignedBy: data.assignedBy ?? null,
        })
        .returning();
      if (!row) throw new Error('Failed to assign role');
      return {
        id: row.id,
        userId: row.userId,
        role: row.role as RoleName,
        scopeType: row.scopeType as ScopeType,
        scopeId: row.scopeId,
        assignedBy: row.assignedBy,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async revokeRole(assignmentId: string): Promise<boolean> {
      const result = await db.delete(roleAssignments).where(eq(roleAssignments.id, assignmentId)).returning();
      return result.length > 0;
    },

    async getProfile(userId: string): Promise<UserProfile | null> {
      const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
      if (!row) return null;
      return {
        id: row.id,
        userId: row.userId,
        rollNumber: row.rollNumber,
        employeeId: row.employeeId,
        designation: row.designation,
        phone: row.phone,
        avatarUrl: row.avatarUrl,
        bio: row.bio,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },

    async updateProfile(userId: string, data: Partial<Pick<UserProfile, 'phone' | 'bio' | 'avatarUrl' | 'metadata'>>): Promise<UserProfile | null> {
      const [row] = await db
        .update(profiles)
        .set({
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.bio !== undefined ? { bio: data.bio } : {}),
          ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
          ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId))
        .returning();
      if (!row) return null;
      return {
        id: row.id,
        userId: row.userId,
        rollNumber: row.rollNumber,
        employeeId: row.employeeId,
        designation: row.designation,
        phone: row.phone,
        avatarUrl: row.avatarUrl,
        bio: row.bio,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },

    async createProfile(userId: string, data = {}): Promise<UserProfile> {
      const [row] = await db
        .insert(profiles)
        .values({
          userId,
          rollNumber: data.rollNumber ?? null,
          employeeId: data.employeeId ?? null,
          designation: data.designation ?? null,
          phone: data.phone ?? null,
          avatarUrl: data.avatarUrl ?? null,
          bio: data.bio ?? null,
          metadata: data.metadata ?? {},
        })
        .returning();
      if (!row) throw new Error('Failed to create profile');
      return {
        id: row.id,
        userId: row.userId,
        rollNumber: row.rollNumber,
        employeeId: row.employeeId,
        designation: row.designation,
        phone: row.phone,
        avatarUrl: row.avatarUrl,
        bio: row.bio,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },

    async logAudit(data: CreateAuditData): Promise<void> {
      await db.insert(auditEvents).values({
        actorId: data.actorId ?? null,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId ?? null,
        details: data.details ?? {},
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      });
    },
  };
}
