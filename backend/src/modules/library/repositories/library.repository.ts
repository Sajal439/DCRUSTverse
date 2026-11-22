import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql, ilike } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import {
  libraryTitles,
  bookCopies,
  loans,
  reservations,
} from '../../../database/schema.ts';

import type {
  LibraryTitleItem,
  BookCopyItem,
  LoanItem,
  ReservationItem,
  LibraryRepository,
} from '../../../types/library.ts';

export type {
  LibraryTitleItem,
  BookCopyItem,
  LoanItem,
  ReservationItem,
  LibraryRepository,
};

export function createDrizzleLibraryRepository(db: NodePgDatabase<typeof schema>): LibraryRepository {
  return {
    async searchTitles(query, category): Promise<LibraryTitleItem[]> {
      const conditions = [];
      if (query) {
        conditions.push(sql`${libraryTitles.title} ILIKE ${'%' + query + '%'} OR ${libraryTitles.author} ILIKE ${'%' + query + '%'} OR ${libraryTitles.isbn} = ${query}`);
      }
      if (category) {
        conditions.push(eq(libraryTitles.category, category));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(libraryTitles).where(whereClause).orderBy(libraryTitles.title);
      return rows.map(r => ({
        id: r.id,
        isbn: r.isbn,
        title: r.title,
        author: r.author,
        category: r.category,
        totalCopies: r.totalCopies,
        availableCopies: r.availableCopies,
      }));
    },

    async createTitle(data): Promise<LibraryTitleItem> {
      const copies = data.totalCopies ?? 1;
      const [row] = await db
        .insert(libraryTitles)
        .values({
          isbn: data.isbn.trim(),
          title: data.title.trim(),
          author: data.author.trim(),
          category: data.category.trim(),
          totalCopies: copies,
          availableCopies: copies,
        })
        .returning();
      if (!row) throw new Error('Failed to create library title');
      return {
        id: row.id,
        isbn: row.isbn,
        title: row.title,
        author: row.author,
        category: row.category,
        totalCopies: row.totalCopies,
        availableCopies: row.availableCopies,
      };
    },

    async addCopy(titleId, barcode): Promise<BookCopyItem> {
      const [row] = await db
        .insert(bookCopies)
        .values({
          titleId,
          barcode: barcode.trim(),
          status: 'available',
        })
        .returning();
      if (!row) throw new Error('Failed to add book copy');
      return {
        id: row.id,
        titleId: row.titleId,
        barcode: row.barcode,
        status: row.status as BookCopyItem['status'],
      };
    },

    async listCopies(titleId): Promise<BookCopyItem[]> {
      const rows = await db.select().from(bookCopies).where(eq(bookCopies.titleId, titleId));
      return rows.map(r => ({
        id: r.id,
        titleId: r.titleId,
        barcode: r.barcode,
        status: r.status as BookCopyItem['status'],
      }));
    },

    async issueBook(copyId, userId, days = 14): Promise<LoanItem> {
      // Check copy status
      const [copy] = await db.select().from(bookCopies).where(eq(bookCopies.id, copyId)).limit(1);
      if (!copy) throw new Error('Book copy not found');
      if (copy.status !== 'available') {
        throw new Error('Book copy is not available for loan');
      }

      // Mark copy issued
      await db
        .update(bookCopies)
        .set({ status: 'issued' })
        .where(eq(bookCopies.id, copyId));

      // Decrement available copies
      await db
        .update(libraryTitles)
        .set({ availableCopies: sql`GREATEST(0, ${libraryTitles.availableCopies} - 1)` })
        .where(eq(libraryTitles.id, copy.titleId));

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);

      const [loan] = await db
        .insert(loans)
        .values({
          copyId,
          userId,
          dueDate,
        })
        .returning();

      if (!loan) throw new Error('Failed to create loan record');
      return {
        id: loan.id,
        copyId: loan.copyId,
        userId: loan.userId,
        issuedAt: loan.issuedAt.toISOString(),
        dueDate: loan.dueDate.toISOString(),
        returnedAt: null,
        fineAmount: loan.fineAmount,
      };
    },

    async returnBook(copyId): Promise<LoanItem | null> {
      // Find active loan
      const [loan] = await db
        .select()
        .from(loans)
        .where(and(eq(loans.copyId, copyId), sql`${loans.returnedAt} IS NULL`))
        .limit(1);
      if (!loan) return null;

      // Update loan
      const [updatedLoan] = await db
        .update(loans)
        .set({ returnedAt: new Date() })
        .where(eq(loans.id, loan.id))
        .returning();

      if (!updatedLoan) throw new Error('Failed to update loan');

      const [copy] = await db.select().from(bookCopies).where(eq(bookCopies.id, copyId)).limit(1);
      if (copy) {
        // Mark copy available
        await db.update(bookCopies).set({ status: 'available' }).where(eq(bookCopies.id, copyId));
        // Increment available count
        await db.update(libraryTitles).set({ availableCopies: sql`${libraryTitles.availableCopies} + 1` }).where(eq(libraryTitles.id, copy.titleId));

        // Advance reservation queue if any
        const [nextRes] = await db
          .select()
          .from(reservations)
          .where(and(eq(reservations.titleId, copy.titleId), eq(reservations.status, 'pending')))
          .orderBy(reservations.queuePosition)
          .limit(1);

        if (nextRes) {
          await db
            .update(reservations)
            .set({ status: 'fulfilled' })
            .where(eq(reservations.id, nextRes.id));
        }
      }

      return {
        id: updatedLoan.id,
        copyId: updatedLoan.copyId,
        userId: updatedLoan.userId,
        issuedAt: updatedLoan.issuedAt.toISOString(),
        dueDate: updatedLoan.dueDate.toISOString(),
        returnedAt: updatedLoan.returnedAt ? updatedLoan.returnedAt.toISOString() : null,
        fineAmount: updatedLoan.fineAmount,
      };
    },

    async listUserLoans(userId): Promise<LoanItem[]> {
      const rows = await db.select().from(loans).where(eq(loans.userId, userId)).orderBy(loans.issuedAt);
      return rows.map(r => ({
        id: r.id,
        copyId: r.copyId,
        userId: r.userId,
        issuedAt: r.issuedAt.toISOString(),
        dueDate: r.dueDate.toISOString(),
        returnedAt: r.returnedAt ? r.returnedAt.toISOString() : null,
        fineAmount: r.fineAmount,
      }));
    },

    async reserveTitle(titleId, userId): Promise<ReservationItem> {
      // Find queue position
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(reservations)
        .where(and(eq(reservations.titleId, titleId), eq(reservations.status, 'pending')));

      const queuePosition = (countResult?.count ?? 0) + 1;

      const [row] = await db
        .insert(reservations)
        .values({
          titleId,
          userId,
          queuePosition,
          status: 'pending',
        })
        .returning();

      if (!row) throw new Error('Failed to reserve book');
      return {
        id: row.id,
        titleId: row.titleId,
        userId: row.userId,
        queuePosition: row.queuePosition,
        status: row.status as ReservationItem['status'],
        reservedAt: row.reservedAt.toISOString(),
      };
    },

    async listReservations(titleId): Promise<ReservationItem[]> {
      const rows = await db.select().from(reservations).where(eq(reservations.titleId, titleId)).orderBy(reservations.queuePosition);
      return rows.map(r => ({
        id: r.id,
        titleId: r.titleId,
        userId: r.userId,
        queuePosition: r.queuePosition,
        status: r.status as ReservationItem['status'],
        reservedAt: r.reservedAt.toISOString(),
      }));
    },
  };
}
