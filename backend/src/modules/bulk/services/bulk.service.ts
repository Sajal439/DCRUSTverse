import { HttpError } from '../../../lib/http-error.ts';

export function sanitizeCsvFormula(value: string): string {
  if (!value) return value;
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some(prefix => value.startsWith(prefix))) {
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

  rows.forEach((row, idx) => {
    const rowNumber = idx + 1;
    const email = row.email?.trim().toLowerCase();
    const displayName = row.displayName?.trim();

    if (!email || !email.includes('@')) {
      errors.push({ rowNumber, reason: 'Invalid or missing email address' });
      return;
    }

    if (!displayName || displayName.length < 1 || displayName.length > 200) {
      errors.push({ rowNumber, reason: 'Display name must be between 1 and 200 characters' });
      return;
    }

    validRows.push({
      email: sanitizeCsvFormula(email),
      displayName: sanitizeCsvFormula(displayName),
      departmentCode: row.departmentCode ? sanitizeCsvFormula(row.departmentCode.trim().toUpperCase()) : undefined,
      role: row.role ? sanitizeCsvFormula(row.role.trim().toLowerCase()) : undefined,
    });
  });

  return {
    totalRows: rows.length,
    validCount: validRows.length,
    errorCount: errors.length,
    validRows,
    errors,
  };
}
