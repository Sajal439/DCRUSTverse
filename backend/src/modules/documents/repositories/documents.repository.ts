import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, inArray, and } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { documentRequests } from '../../../database/schema.ts';

import type {
  DocumentRequestItem,
  DocumentsRepository,
} from '../../../types/documents.ts';

export type {
  DocumentRequestItem,
  DocumentsRepository,
};

export function createDrizzleDocumentsRepository(db: NodePgDatabase<typeof schema>): DocumentsRepository {
  return {
    async createRequest(data): Promise<DocumentRequestItem> {
      const [row] = await db
        .insert(documentRequests)
        .values({
          userId: data.userId,
          documentType: data.documentType,
          purpose: data.purpose.trim(),
          status: 'pending',
        })
        .returning();
      if (!row) throw new Error('Failed to create document request');
      return {
        id: row.id,
        userId: row.userId,
        documentType: row.documentType as DocumentRequestItem['documentType'],
        purpose: row.purpose,
        status: row.status as DocumentRequestItem['status'],
        issuedFileUrl: row.issuedFileUrl,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async getRequestById(id): Promise<DocumentRequestItem | null> {
      const [row] = await db.select().from(documentRequests).where(eq(documentRequests.id, id)).limit(1);
      if (!row) return null;
      return {
        id: row.id,
        userId: row.userId,
        documentType: row.documentType as DocumentRequestItem['documentType'],
        purpose: row.purpose,
        status: row.status as DocumentRequestItem['status'],
        issuedFileUrl: row.issuedFileUrl,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async listRequests(filters = {}): Promise<DocumentRequestItem[]> {
      const conditions = [];
      if (filters.userId) conditions.push(eq(documentRequests.userId, filters.userId));
      if (filters.status) conditions.push(eq(documentRequests.status, filters.status as any));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(documentRequests).where(whereClause).orderBy(documentRequests.createdAt);
      return rows.map(r => ({
        id: r.id,
        userId: r.userId,
        documentType: r.documentType as DocumentRequestItem['documentType'],
        purpose: r.purpose,
        status: r.status as DocumentRequestItem['status'],
        issuedFileUrl: r.issuedFileUrl,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async reviewRequest(id, status, reviewedBy, issuedFileUrl): Promise<DocumentRequestItem | null> {
      const [row] = await db
        .update(documentRequests)
        .set({
          status,
          reviewedBy,
          reviewedAt: new Date(),
          ...(issuedFileUrl ? { issuedFileUrl } : {}),
        })
        .where(and(eq(documentRequests.id, id), status === 'issued' ? eq(documentRequests.status, 'approved') : inArray(documentRequests.status, ['pending', 'approved'])))
        .returning();
      if (!row) return null;
      return {
        id: row.id,
        userId: row.userId,
        documentType: row.documentType as DocumentRequestItem['documentType'],
        purpose: row.purpose,
        status: row.status as DocumentRequestItem['status'],
        issuedFileUrl: row.issuedFileUrl,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      };
    },
  };
}
