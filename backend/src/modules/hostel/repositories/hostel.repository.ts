import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import {
  hostels,
  hostelRooms,
  hostelApplications,
  hostelAllocations,
  hostelTransfers,
} from '../../../database/schema.ts';

import type {
  HostelItem,
  HostelRoomItem,
  HostelApplicationItem,
  HostelAllocationItem,
  HostelTransferItem,
  HostelRepository,
} from '../../../types/hostel.ts';

export type {
  HostelItem,
  HostelRoomItem,
  HostelApplicationItem,
  HostelAllocationItem,
  HostelTransferItem,
  HostelRepository,
};

export function createDrizzleHostelRepository(db: NodePgDatabase<typeof schema>): HostelRepository {
  return {
    async listHostels(): Promise<HostelItem[]> {
      const rows = await db.select().from(hostels).orderBy(hostels.name);
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        gender: r.gender as HostelItem['gender'],
        wardenId: r.wardenId,
        capacity: r.capacity,
      }));
    },

    async createHostel(data): Promise<HostelItem> {
      const [row] = await db
        .insert(hostels)
        .values({
          name: data.name.trim(),
          gender: data.gender,
          capacity: data.capacity,
          wardenId: data.wardenId ?? null,
        })
        .returning();
      if (!row) throw new Error('Failed to create hostel');
      return {
        id: row.id,
        name: row.name,
        gender: row.gender as HostelItem['gender'],
        wardenId: row.wardenId,
        capacity: row.capacity,
      };
    },

    async listRooms(hostelId): Promise<HostelRoomItem[]> {
      const rows = await db.select().from(hostelRooms).where(eq(hostelRooms.hostelId, hostelId)).orderBy(hostelRooms.roomNumber);
      return rows.map(r => ({
        id: r.id,
        hostelId: r.hostelId,
        roomNumber: r.roomNumber,
        capacity: r.capacity,
        currentOccupancy: r.currentOccupancy,
      }));
    },

    async createRoom(data): Promise<HostelRoomItem> {
      const [row] = await db
        .insert(hostelRooms)
        .values({
          hostelId: data.hostelId,
          roomNumber: data.roomNumber.trim(),
          capacity: data.capacity ?? 2,
          currentOccupancy: 0,
        })
        .returning();
      if (!row) throw new Error('Failed to create hostel room');
      return {
        id: row.id,
        hostelId: row.hostelId,
        roomNumber: row.roomNumber,
        capacity: row.capacity,
        currentOccupancy: row.currentOccupancy,
      };
    },

    async getRoomById(id): Promise<HostelRoomItem | null> {
      const [row] = await db.select().from(hostelRooms).where(eq(hostelRooms.id, id)).limit(1);
      if (!row) return null;
      return {
        id: row.id,
        hostelId: row.hostelId,
        roomNumber: row.roomNumber,
        capacity: row.capacity,
        currentOccupancy: row.currentOccupancy,
      };
    },

    async apply(studentId, hostelId): Promise<HostelApplicationItem> {
      const [row] = await db
        .insert(hostelApplications)
        .values({
          studentId,
          hostelId,
          status: 'pending',
        })
        .returning();
      if (!row) throw new Error('Failed to apply for hostel');
      return {
        id: row.id,
        studentId: row.studentId,
        hostelId: row.hostelId,
        status: row.status as HostelApplicationItem['status'],
        appliedAt: row.appliedAt.toISOString(),
      };
    },

    async listApplications(filters = {}): Promise<HostelApplicationItem[]> {
      const conditions = [];
      if (filters.studentId) conditions.push(eq(hostelApplications.studentId, filters.studentId));
      if (filters.hostelId) conditions.push(eq(hostelApplications.hostelId, filters.hostelId));
      if (filters.status) conditions.push(eq(hostelApplications.status, filters.status as any));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(hostelApplications).where(whereClause);
      return rows.map(r => ({
        id: r.id,
        studentId: r.studentId,
        hostelId: r.hostelId,
        status: r.status as HostelApplicationItem['status'],
        appliedAt: r.appliedAt.toISOString(),
      }));
    },

    async getAllocationByStudent(studentId): Promise<HostelAllocationItem | null> {
      const [row] = await db.select().from(hostelAllocations).where(eq(hostelAllocations.studentId, studentId)).limit(1);
      if (!row) return null;
      return {
        id: row.id,
        studentId: row.studentId,
        roomId: row.roomId,
        allocatedAt: row.allocatedAt.toISOString(),
      };
    },

    async allocateRoom(studentId, roomId): Promise<HostelAllocationItem> {
      return db.transaction(async tx => {
        const [room] = await tx.select().from(hostelRooms).where(eq(hostelRooms.id, roomId)).for('update');
        if (!room) throw new Error('Room not found');
        if (room.currentOccupancy >= room.capacity) {
          throw new Error('Room has reached full capacity');
        }

        // Increment room occupancy
        await tx
          .update(hostelRooms)
          .set({ currentOccupancy: sql`${hostelRooms.currentOccupancy} + 1` })
          .where(eq(hostelRooms.id, roomId));

        const [row] = await tx
          .insert(hostelAllocations)
          .values({
            studentId,
            roomId,
          })
          .returning();

        if (!row) throw new Error('Failed to allocate room');
        await tx.update(hostelApplications).set({ status: 'approved' }).where(and(eq(hostelApplications.studentId, studentId), eq(hostelApplications.hostelId, room.hostelId), eq(hostelApplications.status, 'pending')));
        return {
          id: row.id,
          studentId: row.studentId,
          roomId: row.roomId,
          allocatedAt: row.allocatedAt.toISOString(),
        };
      });
    },

    async requestTransfer(studentId, toRoomId, reason): Promise<HostelTransferItem> {
      const current = await this.getAllocationByStudent(studentId);
      if (!current) throw new Error('Student has no active room allocation to transfer from');

      const [row] = await db
        .insert(hostelTransfers)
        .values({
          studentId,
          fromRoomId: current.roomId,
          toRoomId,
          reason: reason.trim(),
          status: 'pending',
        })
        .returning();

      if (!row) throw new Error('Failed to request transfer');
      return {
        id: row.id,
        studentId: row.studentId,
        fromRoomId: row.fromRoomId,
        toRoomId: row.toRoomId,
        status: row.status as HostelTransferItem['status'],
        reason: row.reason,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
        requestedAt: row.requestedAt.toISOString(),
      };
    },

    async listTransfers(filters = {}): Promise<HostelTransferItem[]> {
      const conditions = [];
      if (filters.studentId) conditions.push(eq(hostelTransfers.studentId, filters.studentId));
      if (filters.status) conditions.push(eq(hostelTransfers.status, filters.status as any));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(hostelTransfers).where(whereClause);
      return rows.map(r => ({
        id: r.id,
        studentId: r.studentId,
        fromRoomId: r.fromRoomId,
        toRoomId: r.toRoomId,
        status: r.status as HostelTransferItem['status'],
        reason: r.reason,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        requestedAt: r.requestedAt.toISOString(),
      }));
    },

    async approveTransfer(transferId, reviewerId): Promise<HostelTransferItem | null> {
      return db.transaction(async tx => {
        const [transfer] = await tx.select().from(hostelTransfers).where(eq(hostelTransfers.id, transferId)).limit(1).for('update');
        if (!transfer || transfer.status !== 'pending') return null;

        const [allocation] = await tx.select().from(hostelAllocations).where(eq(hostelAllocations.studentId, transfer.studentId)).for('update');
        if (!allocation || allocation.roomId !== transfer.fromRoomId) throw new Error('The original allocation has changed');
        if (transfer.fromRoomId === transfer.toRoomId) throw new Error('Choose a different room');
        const lockedRooms = await tx.select().from(hostelRooms).where(sql`${hostelRooms.id} IN (${transfer.fromRoomId}, ${transfer.toRoomId})`).orderBy(hostelRooms.id).for('update');
        const targetRoom = lockedRooms.find(room => room.id === transfer.toRoomId);
        if (!targetRoom || targetRoom.currentOccupancy >= targetRoom.capacity) {
          throw new Error('Target room is at full capacity');
        }

        // Atomically decrement old room occupancy & increment new room occupancy
        await tx
          .update(hostelRooms)
          .set({ currentOccupancy: sql`GREATEST(0, ${hostelRooms.currentOccupancy} - 1)` })
          .where(eq(hostelRooms.id, transfer.fromRoomId));

        await tx
          .update(hostelRooms)
          .set({ currentOccupancy: sql`${hostelRooms.currentOccupancy} + 1` })
          .where(eq(hostelRooms.id, transfer.toRoomId));

        // Update student allocation to new room
        await tx
          .update(hostelAllocations)
          .set({ roomId: transfer.toRoomId, allocatedAt: new Date() })
          .where(eq(hostelAllocations.studentId, transfer.studentId));

        // Mark transfer approved
        const [updated] = await tx
          .update(hostelTransfers)
          .set({
            status: 'approved',
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
          })
          .where(eq(hostelTransfers.id, transferId))
          .returning();

        if (!updated) throw new Error('Failed to update transfer');

        return {
          id: updated.id,
          studentId: updated.studentId,
          fromRoomId: updated.fromRoomId,
          toRoomId: updated.toRoomId,
          status: updated.status as HostelTransferItem['status'],
          reason: updated.reason,
          reviewedBy: updated.reviewedBy,
          reviewedAt: updated.reviewedAt ? updated.reviewedAt.toISOString() : null,
          requestedAt: updated.requestedAt.toISOString(),
        };
      });
    },


  };
}
