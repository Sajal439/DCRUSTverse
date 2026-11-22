import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { tickets, ticketComments } from '../../../database/schema.ts';

import type {
  TicketItem,
  TicketCommentItem,
  TicketsRepository,
} from '../../../types/tickets.ts';

export type {
  TicketItem,
  TicketCommentItem,
  TicketsRepository,
};

export function createDrizzleTicketsRepository(db: NodePgDatabase<typeof schema>): TicketsRepository {
  return {
    async createTicket(data): Promise<TicketItem> {
      const trackingId = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const [row] = await db
        .insert(tickets)
        .values({
          trackingId,
          creatorId: data.creatorId,
          category: data.category,
          priority: data.priority ?? 'medium',
          status: 'open',
          isSensitive: data.isSensitive ?? (data.category === 'harassment'),
          title: data.title.trim(),
          description: data.description.trim(),
        })
        .returning();
      if (!row) throw new Error('Failed to create ticket');
      return {
        id: row.id,
        trackingId: row.trackingId,
        creatorId: row.creatorId,
        category: row.category as TicketItem['category'],
        priority: row.priority as TicketItem['priority'],
        status: row.status as TicketItem['status'],
        isSensitive: row.isSensitive,
        assignedStaffId: row.assignedStaffId,
        title: row.title,
        description: row.description,
        resolutionNotes: row.resolutionNotes,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },

    async getTicketById(id): Promise<TicketItem | null> {
      const [row] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
      if (!row) return null;
      return {
        id: row.id,
        trackingId: row.trackingId,
        creatorId: row.creatorId,
        category: row.category as TicketItem['category'],
        priority: row.priority as TicketItem['priority'],
        status: row.status as TicketItem['status'],
        isSensitive: row.isSensitive,
        assignedStaffId: row.assignedStaffId,
        title: row.title,
        description: row.description,
        resolutionNotes: row.resolutionNotes,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },

    async getTicketByTrackingId(trackingId): Promise<TicketItem | null> {
      const [row] = await db.select().from(tickets).where(eq(tickets.trackingId, trackingId.toUpperCase().trim())).limit(1);
      if (!row) return null;
      return {
        id: row.id,
        trackingId: row.trackingId,
        creatorId: row.creatorId,
        category: row.category as TicketItem['category'],
        priority: row.priority as TicketItem['priority'],
        status: row.status as TicketItem['status'],
        isSensitive: row.isSensitive,
        assignedStaffId: row.assignedStaffId,
        title: row.title,
        description: row.description,
        resolutionNotes: row.resolutionNotes,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },

    async listTickets(filters = {}): Promise<TicketItem[]> {
      const conditions = [];
      if (filters.creatorId) conditions.push(eq(tickets.creatorId, filters.creatorId));
      if (filters.assignedStaffId) conditions.push(eq(tickets.assignedStaffId, filters.assignedStaffId));
      if (filters.category) conditions.push(eq(tickets.category, filters.category as any));
      if (filters.status) conditions.push(eq(tickets.status, filters.status as any));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(tickets).where(whereClause).orderBy(tickets.createdAt);
      return rows.map(r => ({
        id: r.id,
        trackingId: r.trackingId,
        creatorId: r.creatorId,
        category: r.category as TicketItem['category'],
        priority: r.priority as TicketItem['priority'],
        status: r.status as TicketItem['status'],
        isSensitive: r.isSensitive,
        assignedStaffId: r.assignedStaffId,
        title: r.title,
        description: r.description,
        resolutionNotes: r.resolutionNotes,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    },

    async updateStatus(id, status, resolutionNotes): Promise<TicketItem | null> {
      const [row] = await db
        .update(tickets)
        .set({
          status,
          ...(resolutionNotes !== undefined ? { resolutionNotes } : {}),
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, id))
        .returning();
      if (!row) return null;
      return {
        id: row.id,
        trackingId: row.trackingId,
        creatorId: row.creatorId,
        category: row.category as TicketItem['category'],
        priority: row.priority as TicketItem['priority'],
        status: row.status as TicketItem['status'],
        isSensitive: row.isSensitive,
        assignedStaffId: row.assignedStaffId,
        title: row.title,
        description: row.description,
        resolutionNotes: row.resolutionNotes,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },

    async assignStaff(id, staffId): Promise<TicketItem | null> {
      const [row] = await db
        .update(tickets)
        .set({ assignedStaffId: staffId, updatedAt: new Date() })
        .where(eq(tickets.id, id))
        .returning();
      if (!row) return null;
      return {
        id: row.id,
        trackingId: row.trackingId,
        creatorId: row.creatorId,
        category: row.category as TicketItem['category'],
        priority: row.priority as TicketItem['priority'],
        status: row.status as TicketItem['status'],
        isSensitive: row.isSensitive,
        assignedStaffId: row.assignedStaffId,
        title: row.title,
        description: row.description,
        resolutionNotes: row.resolutionNotes,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },

    async addComment(data): Promise<TicketCommentItem> {
      const [row] = await db
        .insert(ticketComments)
        .values({
          ticketId: data.ticketId,
          userId: data.userId,
          message: data.message.trim(),
          isInternal: data.isInternal ?? false,
        })
        .returning();
      if (!row) throw new Error('Failed to add comment');
      return {
        id: row.id,
        ticketId: row.ticketId,
        userId: row.userId,
        message: row.message,
        isInternal: row.isInternal,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async listComments(ticketId, includeInternal = false): Promise<TicketCommentItem[]> {
      const conditions = [eq(ticketComments.ticketId, ticketId)];
      if (!includeInternal) {
        conditions.push(eq(ticketComments.isInternal, false));
      }
      const rows = await db.select().from(ticketComments).where(and(...conditions)).orderBy(ticketComments.createdAt);
      return rows.map(r => ({
        id: r.id,
        ticketId: r.ticketId,
        userId: r.userId,
        message: r.message,
        isInternal: r.isInternal,
        createdAt: r.createdAt.toISOString(),
      }));
    },
  };
}
