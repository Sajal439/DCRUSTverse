import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { DocumentsRepository } from '../repositories/documents.repository.ts';
import {
  createDocumentRequestSchema,
  reviewDocumentRequestSchema,
} from '../schemas/documents.schema.ts';

export function createRequest(repo: DocumentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = createDocumentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid request data');
    }

    const data = await repo.createRequest({
      userId: actor.id,
      documentType: parsed.data.documentType,
      purpose: parsed.data.purpose,
    });

    res.status(201).json({ data });
  };
}

export function listRequests(repo: DocumentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const isPrivileged = actor.roles.some(r => ['administrator', 'service_staff', 'department_head'].includes(r.role));
    const userId = isPrivileged ? (req.query.userId as string | undefined) : actor.id;

    const data = await repo.listRequests({ userId, status: req.query.status as string });
    res.json({ data });
  };
}

export function getRequest(repo: DocumentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const id = req.params.id as string;
    const item = await repo.getRequestById(id);
    if (!item) throw new HttpError(404, 'NOT_FOUND', 'Document request not found');

    const isGlobalAdmin = actor.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
    if (!isGlobalAdmin && item.userId !== actor.id) {
      throw new HttpError(403, 'FORBIDDEN', 'Access to document request is restricted');
    }

    res.json({ data: item });
  };
}

export function reviewRequest(repo: DocumentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const id = req.params.id as string;
    const parsed = reviewDocumentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid review data');
    }

    const data = await repo.reviewRequest(id, parsed.data.status, actor.id, parsed.data.issuedFileUrl);
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Document request not found');

    res.json({ data });
  };
}
