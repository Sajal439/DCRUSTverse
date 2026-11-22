import { canReviewDocument } from '../services/document-policy.ts';
import type { CampusUserRepository } from '../../../types/user-repository.ts';
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

export function listRequests(repo: DocumentsRepository, users?: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const isPrivileged = actor.roles.some(r => ['administrator', 'service_staff', 'department_head'].includes(r.role));
    const userId = isPrivileged ? (req.query.userId as string | undefined) : actor.id;

    const data = await repo.listRequests({ userId, status: req.query.status as string });
    const permitted = await Promise.all(data.map(async item => item.userId === actor.id || await canReviewDocument(actor, item.userId, users) ? item : null));
    res.json({ data: permitted.filter(Boolean) });
  };
}

export function getRequest(repo: DocumentsRepository, users?: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const id = req.params.id as string;
    const item = await repo.getRequestById(id);
    if (!item) throw new HttpError(404, 'NOT_FOUND', 'Document request not found');

    const isGlobalAdmin = actor.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
    if (!isGlobalAdmin && item.userId !== actor.id && !await canReviewDocument(actor, item.userId, users)) {
      throw new HttpError(403, 'FORBIDDEN', 'Access to document request is restricted');
    }

    res.json({ data: item });
  };
}

export function reviewRequest(repo: DocumentsRepository, users?: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const id = req.params.id as string;
    const parsed = reviewDocumentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid review data');
    }

    const existing = await repo.getRequestById(id);
    if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Document request not found');
    if (!await canReviewDocument(actor, existing.userId, users)) throw new HttpError(403, 'FORBIDDEN', 'This request is outside your review scope');
    if (existing.userId === actor.id) throw new HttpError(403, 'SELF_APPROVAL_DISALLOWED', 'Another staff member must review your request');
    if (existing.status === 'issued' || existing.status === 'rejected' || (parsed.data.status === 'issued' && existing.status !== 'approved')) throw new HttpError(409, 'INVALID_TRANSITION', 'Approve a pending request before issuing; completed requests cannot be changed');
    const data = await repo.reviewRequest(id, parsed.data.status, actor.id, parsed.data.issuedFileUrl);
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Document request not found');

    res.json({ data });
  };
}
