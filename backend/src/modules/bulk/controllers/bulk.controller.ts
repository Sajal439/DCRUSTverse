import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import { validateUserImportCsv, sanitizeCsvFormula } from '../services/bulk.service.ts';

export function previewUserImport(): RequestHandler {
  return (req, res) => {
    const rows = req.body?.rows;
    if (!Array.isArray(rows)) {
      throw new HttpError(400, 'INVALID_INPUT', 'Expected "rows" array in request body');
    }
    const summary = validateUserImportCsv(rows);
    res.json({ data: summary });
  };
}

export function sanitizeCsvExport(): RequestHandler {
  return (req, res) => {
    const rows = req.body?.rows;
    if (!Array.isArray(rows)) {
      throw new HttpError(400, 'INVALID_INPUT', 'Expected "rows" array in request body');
    }

    const sanitized = rows.map(row => {
      const cleanRow: Record<string, string> = {};
      for (const [key, val] of Object.entries(row)) {
        cleanRow[key] = typeof val === 'string' ? sanitizeCsvFormula(val) : String(val);
      }
      return cleanRow;
    });

    res.json({ data: sanitized });
  };
}
