import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { placementOpportunities, placementApplications } from '../../../database/schema.ts';

import type {
  PlacementOpportunityItem,
  PlacementApplicationItem,
  PlacementsRepository,
} from '../../../types/placements.ts';

export type {
  PlacementOpportunityItem,
  PlacementApplicationItem,
  PlacementsRepository,
};

export function createDrizzlePlacementsRepository(db: NodePgDatabase<typeof schema>): PlacementsRepository {
  return {
    async listOpportunities(status) {
      const conditions = status ? [eq(placementOpportunities.status, status as any)] : [];
      const rows = await db.select().from(placementOpportunities).where(and(...conditions)).orderBy(placementOpportunities.deadline);
      return rows.map(r => ({
        ...r,
        status: r.status as PlacementOpportunityItem['status'],
        eligibleBranches: (r.eligibleBranches as string[]) ?? [],
        deadline: r.deadline.toISOString(),
        createdAt: r.createdAt.toISOString(),
      }));
    },
    async createOpportunity(data) {
      const [row] = await db.insert(placementOpportunities).values(data).returning();
      if (!row) throw new Error('Failed to create opportunity');
      return {
        ...row,
        status: row.status as PlacementOpportunityItem['status'],
        eligibleBranches: (row.eligibleBranches as string[]) ?? [],
        deadline: row.deadline.toISOString(),
        createdAt: row.createdAt.toISOString(),
      };
    },
    async getOpportunityById(id) {
      const [row] = await db.select().from(placementOpportunities).where(eq(placementOpportunities.id, id)).limit(1);
      if (!row) return null;
      return {
        ...row,
        status: row.status as PlacementOpportunityItem['status'],
        eligibleBranches: (row.eligibleBranches as string[]) ?? [],
        deadline: row.deadline.toISOString(),
        createdAt: row.createdAt.toISOString(),
      };
    },
    async apply(data) {
      const [row] = await db.insert(placementApplications).values(data).returning();
      if (!row) throw new Error('Failed to apply for opportunity');
      return {
        ...row,
        status: row.status as PlacementApplicationItem['status'],
        appliedAt: row.appliedAt.toISOString(),
      };
    },
    async listApplications(filters = {}) {
      const conditions = [];
      if (filters.opportunityId) conditions.push(eq(placementApplications.opportunityId, filters.opportunityId));
      if (filters.studentId) conditions.push(eq(placementApplications.studentId, filters.studentId));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(placementApplications).where(whereClause);
      return rows.map(r => ({
        ...r,
        status: r.status as PlacementApplicationItem['status'],
        appliedAt: r.appliedAt.toISOString(),
      }));
    },
    async updateApplicationStatus(id, status) {
      const [row] = await db.update(placementApplications).set({ status }).where(eq(placementApplications.id, id)).returning();
      if (!row) return null;
      return {
        ...row,
        status: row.status as PlacementApplicationItem['status'],
        appliedAt: row.appliedAt.toISOString(),
      };
    },
  };
}
