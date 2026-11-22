import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { lostFoundItems, lostFoundClaims } from '../../../database/schema.ts';

import type {
  LostFoundItemRecord,
  LostFoundClaimRecord,
  LostFoundRepository,
} from '../../../types/lost-found.ts';

export type {
  LostFoundItemRecord,
  LostFoundClaimRecord,
  LostFoundRepository,
};

export function createDrizzleLostFoundRepository(db: NodePgDatabase<typeof schema>): LostFoundRepository {
  return {
    async listItems(filters = {}) {
      const conditions = [];
      if (filters.type) conditions.push(eq(lostFoundItems.type, filters.type));
      if (filters.category) conditions.push(eq(lostFoundItems.category, filters.category));
      if (filters.status) conditions.push(eq(lostFoundItems.status, filters.status as any));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(lostFoundItems).where(whereClause).orderBy(sql`${lostFoundItems.reportedAt} DESC`);
      return rows.map(r => ({
        ...r,
        type: r.type as 'lost' | 'found',
        status: r.status as 'open' | 'claimed' | 'recovered',
        reportedAt: r.reportedAt.toISOString(),
      }));
    },
    async getItemById(id) {
      const [row] = await db.select().from(lostFoundItems).where(eq(lostFoundItems.id, id)).limit(1);
      if (!row) return null;
      return {
        ...row,
        type: row.type as 'lost' | 'found',
        status: row.status as 'open' | 'claimed' | 'recovered',
        reportedAt: row.reportedAt.toISOString(),
      };
    },
    async createItem(data) {
      const [row] = await db.insert(lostFoundItems).values(data).returning();
      if (!row) throw new Error('Failed to create lost/found item');
      return {
        ...row,
        type: row.type as 'lost' | 'found',
        status: row.status as 'open' | 'claimed' | 'recovered',
        reportedAt: row.reportedAt.toISOString(),
      };
    },
    async submitClaim(data) {
      const [row] = await db.insert(lostFoundClaims).values({ ...data, status: 'pending' }).returning();
      if (!row) throw new Error('Failed to submit claim');
      return {
        ...row,
        status: row.status as 'pending' | 'verified' | 'rejected',
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      };
    },
    async listClaimsForItem(itemId) {
      const rows = await db.select().from(lostFoundClaims).where(eq(lostFoundClaims.itemId, itemId));
      return rows.map(r => ({
        ...r,
        status: r.status as 'pending' | 'verified' | 'rejected',
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      }));
    },
    async reviewClaim(claimId, reviewerId, status) {
      const [row] = await db
        .update(lostFoundClaims)
        .set({ status, reviewedBy: reviewerId, reviewedAt: new Date() })
        .where(eq(lostFoundClaims.id, claimId))
        .returning();
      if (!row) return null;
      if (status === 'verified') {
        await db.update(lostFoundItems).set({ status: 'claimed' }).where(eq(lostFoundItems.id, row.itemId));
      }
      return {
        ...row,
        status: row.status as 'pending' | 'verified' | 'rejected',
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      };
    },
    async markItemRecovered(itemId) {
      const [row] = await db
        .update(lostFoundItems)
        .set({ status: 'recovered' })
        .where(eq(lostFoundItems.id, itemId))
        .returning();
      if (!row) return null;
      return {
        ...row,
        type: row.type as 'lost' | 'found',
        status: row.status as 'open' | 'claimed' | 'recovered',
        reportedAt: row.reportedAt.toISOString(),
      };
    },
  };
}
