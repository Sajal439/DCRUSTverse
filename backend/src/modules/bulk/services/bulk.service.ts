import { importRowSchema } from '../schemas/bulk.schema.ts';
import { HttpError } from '../../../lib/http-error.ts';

export function sanitizeCsvFormula(value: string): string {
  if (!value) return value;
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some(prefix => value.trimStart().startsWith(prefix) || value.startsWith(prefix))) {
    // Prefix with single quote to neutralize spreadsheet formula execution
    return `'${value}`;
  }
  return value;
}

import type {
  CsvUserRow,
  ValidationSummary,
} from '../../../types/bulk.ts';

export type {
  CsvUserRow,
  ValidationSummary,
};

export function validateUserImportCsv(rows: Array<Record<string, string>>): ValidationSummary<CsvUserRow> {
  const validRows: CsvUserRow[] = [];
  const errors: Array<{ rowNumber: number; reason: string }> = [];

  const seen = new Set<string>();
  rows.forEach((row, idx) => {
    const parsed = importRowSchema.safeParse(row);
    if (!parsed.success) { errors.push({ rowNumber: idx + 1, reason: parsed.error.issues[0]?.message ?? 'Invalid row' }); return; }
    if (seen.has(parsed.data.email)) { errors.push({ rowNumber: idx + 1, reason: 'Duplicate email in this import' }); return; }
    seen.add(parsed.data.email);
    validRows.push(parsed.data);
  });

  return {
    totalRows: rows.length,
    validCount: validRows.length,
    errorCount: errors.length,
    validRows,
    errors,
  };
}
