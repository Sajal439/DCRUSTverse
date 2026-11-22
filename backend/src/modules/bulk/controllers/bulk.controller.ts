import { bulkRowsSchema, executeImportSchema } from '../schemas/bulk.schema.ts';
import type { BulkRepository } from '../../../types/bulk-repository.ts';
import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import { validateUserImportCsv, sanitizeCsvFormula } from '../services/bulk.service.ts';

export function previewUserImport(): RequestHandler {
  return (req, res) => {
    const parsed = bulkRowsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', 'Expected "rows" array in request body');
    }
    const summary = validateUserImportCsv(parsed.data.rows);
    res.json({ data: summary });
  };
}

export function sanitizeCsvExport(): RequestHandler {
  return (req, res) => {
    const parsed = bulkRowsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', 'Expected "rows" array in request body');
    }

    const sanitized = parsed.data.rows.map(row => {
      const cleanRow: Record<string, string> = {};
      for (const [key, val] of Object.entries(row)) {
        cleanRow[key] = typeof val === 'string' ? sanitizeCsvFormula(val) : String(val);
      }
      return cleanRow;
    });

    res.json({ data: sanitized });
  };
}

export function executeUserImport(repo: BulkRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser!;
    const parsed = executeImportSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, 'INVALID_INPUT', 'Validate up to 200 rows and confirm the import');
    const summary = validateUserImportCsv(parsed.data.rows);
    if (summary.errorCount) throw new HttpError(400, 'INVALID_IMPORT', summary.errors.map(error => `Row ${error.rowNumber}: ${error.reason}`).join('; '));
    res.status(201).json({ data: await repo.importUsers(summary.validRows, actor.id) });
  };
}
export function exportUsers(repo: BulkRepository): RequestHandler {
  return async (_req, res) => {
    const rows = await repo.exportUsers();
    const headers = ['email', 'displayName', 'departmentCode', 'status'];
    const quote = (value: string) => '"' + sanitizeCsvFormula(value).replaceAll('"', '""') + '"';
    const csv = [headers.join(','), ...rows.map(row => headers.map(key => quote(row[key] ?? '')).join(','))].join('\r\n');
    res.json({ data: { filename: 'campus-users.csv', csv, count: rows.length } });
  };
}
