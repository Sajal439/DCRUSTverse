import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, ilike, or } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { departments, users, profiles, roleAssignments } from '../../../database/schema.ts';

import type {
  DirectoryDepartment,
  DirectoryStaff,
  DirectoryRepository,
} from '../../../types/directory.ts';

export type {
  DirectoryDepartment,
  DirectoryStaff,
  DirectoryRepository,
};

export function createDrizzleDirectoryRepository(db: NodePgDatabase<typeof schema>): DirectoryRepository {
  return {
    async searchDepartments(query) {
      if (query && query.trim()) {
        const pattern = `%${query.trim()}%`;
        const rows = await db
          .select()
          .from(departments)
          .where(or(ilike(departments.name, pattern), ilike(departments.code, pattern)));
        return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
      }
      const rows = await db.select().from(departments);
      return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
    },
    async searchStaff(query) {
      const rows = await db
        .select({
          id: users.id,
          fullName: users.displayName,
          email: users.email,
          phone: profiles.phone,
          departmentId: users.departmentId,
          departmentName: departments.name,
          designation: profiles.designation,
          metadata: profiles.metadata,
        })
        .from(users)
        .innerJoin(profiles, eq(profiles.userId, users.id))
        .leftJoin(departments, eq(departments.id, users.departmentId))
        .innerJoin(roleAssignments, eq(roleAssignments.userId, users.id))
        .where(
          or(
            eq(roleAssignments.role, 'faculty'),
            eq(roleAssignments.role, 'department_head'),
            eq(roleAssignments.role, 'service_staff'),
            eq(roleAssignments.role, 'librarian'),
            eq(roleAssignments.role, 'hostel_warden'),
            eq(roleAssignments.role, 'placement_officer'),
            eq(roleAssignments.role, 'administrator'),
          ),
        );

      const mapped: DirectoryStaff[] = rows.map(r => {
        const meta = (r.metadata as Record<string, any>) ?? {};
        return {
          id: r.id,
          fullName: r.fullName,
          email: r.email,
          departmentName: r.departmentName,
          designation: r.designation,
          officeLocation: (meta.officeLocation as string) ?? null,
          officeHours: (meta.officeHours as string) ?? null,
          phone: r.phone,
          contactVisibility: (meta.contactVisibility as DirectoryStaff['contactVisibility']) ?? 'campus_only',
        };
      });

      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        return mapped.filter(
          s =>
            s.fullName.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            (s.departmentName && s.departmentName.toLowerCase().includes(q)),
        );
      }
      return mapped;
    },
  };
}
