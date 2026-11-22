export interface LibraryTitleItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

export interface BookCopyItem {
  id: string;
  titleId: string;
  barcode: string;
  status: 'available' | 'issued' | 'reserved' | 'lost';
}

export interface LoanItem {
  id: string;
  copyId: string;
  userId: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  fineAmount: number;
}

export interface ReservationItem {
  id: string;
  titleId: string;
  userId: string;
  queuePosition: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  reservedAt: string;
}

export interface LibraryRepository {
  searchTitles(query?: string, category?: string): Promise<LibraryTitleItem[]>;
  createTitle(data: { isbn: string; title: string; author: string; category: string; totalCopies?: number }): Promise<LibraryTitleItem>;
  addCopy(titleId: string, barcode: string): Promise<BookCopyItem>;
  listCopies(titleId: string): Promise<BookCopyItem[]>;

  issueBook(copyId: string, userId: string, days?: number): Promise<LoanItem>;
  returnBook(copyId: string): Promise<LoanItem | null>;
  listUserLoans(userId: string): Promise<LoanItem[]>;

  reserveTitle(titleId: string, userId: string): Promise<ReservationItem>;
  listReservations(titleId: string): Promise<ReservationItem[]>;
}
