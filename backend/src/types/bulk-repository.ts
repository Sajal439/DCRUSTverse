import type { CsvUserRow } from './bulk.ts';

export interface BulkRepository {
  importUsers(rows: CsvUserRow[], actorId: string): Promise<{ imported: number; skipped: number }>;
  exportUsers(): Promise<Record<string, string>[]>;
}
