import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { LibraryRepository } from '../repositories/library.repository.ts';
import {
  createTitleSchema,
  addCopySchema,
  issueBookSchema,
  returnBookSchema,
} from '../schemas/library.schema.ts';

export function searchTitles(repo: LibraryRepository): RequestHandler {
  return async (req, res) => {
    const query = req.query.q as string | undefined;
    const category = req.query.category as string | undefined;
    const data = await repo.searchTitles(query, category);
    res.json({ data });
  };
}

export function createTitle(repo: LibraryRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createTitleSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid title data');
    }
    const data = await repo.createTitle(parsed.data);
    res.status(201).json({ data });
  };
}

export function addCopy(repo: LibraryRepository): RequestHandler {
  return async (req, res) => {
    const titleId = req.params.titleId as string;
    const parsed = addCopySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid barcode');
    }
    const data = await repo.addCopy(titleId, parsed.data.barcode);
    res.status(201).json({ data });
  };
}

export function listCopies(repo: LibraryRepository): RequestHandler {
  return async (req, res) => {
    const titleId = req.params.titleId as string;
    const data = await repo.listCopies(titleId);
    res.json({ data });
  };
}

export function issueBook(repo: LibraryRepository): RequestHandler {
  return async (req, res) => {
    const parsed = issueBookSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid issue data');
    }

    try {
      const data = await repo.issueBook(parsed.data.copyId, parsed.data.userId, parsed.data.days);
      res.status(201).json({ data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to issue book copy';
      throw new HttpError(409, 'ISSUE_FAILED', message);
    }
  };
}

export function returnBook(repo: LibraryRepository): RequestHandler {
  return async (req, res) => {
    const parsed = returnBookSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid return data');
    }

    const data = await repo.returnBook(parsed.data.copyId);
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Active loan for this copy not found');

    res.json({ data });
  };
}

export function listMyLoans(repo: LibraryRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const isLibrarian = actor.roles.some(r => ['librarian', 'administrator'].includes(r.role));
    const targetUserId = (isLibrarian && req.query.userId) ? (req.query.userId as string) : actor.id;

    const data = await repo.listUserLoans(targetUserId);
    res.json({ data });
  };
}

export function reserveTitle(repo: LibraryRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const titleId = req.params.titleId as string;
    const data = await repo.reserveTitle(titleId, actor.id);
    res.status(201).json({ data });
  };
}
