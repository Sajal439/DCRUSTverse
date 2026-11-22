import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { LostFoundRepository } from '../repositories/lost-found.repository.ts';
import {
  createLostFoundItemSchema,
  submitClaimSchema,
  reviewClaimSchema,
} from '../schemas/lost-found.schema.ts';

export function listLostFoundItems(repo: LostFoundRepository): RequestHandler {
  return async (req, res) => {
    const type = req.query.type as 'lost' | 'found' | undefined;
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;

    const items = await repo.listItems({ type, category, status });
    res.json({ data: items });
  };
}

export function getLostFoundItem(repo: LostFoundRepository): RequestHandler {
  return async (req, res) => {
    const id = req.params.id as string;
    const item = await repo.getItemById(id);
    if (!item) throw new HttpError(404, 'NOT_FOUND', 'Item not found');

    res.json({ data: item });
  };
}

export function createLostFoundItem(repo: LostFoundRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = createLostFoundItemSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid item data');
    }

    const item = await repo.createItem({
      ...parsed.data,
      reportedBy: actor.id,
    });

    res.status(201).json({ data: item });
  };
}

export function submitClaim(repo: LostFoundRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const itemId = req.params.id as string;
    const item = await repo.getItemById(itemId);
    if (!item) throw new HttpError(404, 'NOT_FOUND', 'Item not found');
    if (item.status === 'recovered') {
      throw new HttpError(400, 'ITEM_ALREADY_RECOVERED', 'Cannot claim an already recovered item');
    }

    const parsed = submitClaimSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid claim proof');
    }

    const claim = await repo.submitClaim({
      itemId,
      claimantId: actor.id,
      proofDescription: parsed.data.proofDescription,
    });

    res.status(201).json({ data: claim });
  };
}

export function listClaims(repo: LostFoundRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const actorRoles = actor.roles.map((r: { role: string }) => r.role);
    const isStaff = actorRoles.some((r: string) => ['administrator', 'service_staff'].includes(r));

    const itemId = req.params.id as string;
    const item = await repo.getItemById(itemId);
    if (!item) throw new HttpError(404, 'NOT_FOUND', 'Item not found');

    const isReporter = actor.id === item.reportedBy;
    const claims = await repo.listClaimsForItem(itemId);

    // Only staff, reporter, or claimant can see claims; claimant only sees own claim
    if (isStaff || isReporter) {
      return res.json({ data: claims });
    }

    const ownClaims = claims.filter(c => c.claimantId === actor.id);
    res.json({ data: ownClaims });
  };
}

export function reviewClaim(repo: LostFoundRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const claimId = req.params.claimId as string;
    const parsed = reviewClaimSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid status');
    }

    const updated = await repo.reviewClaim(claimId, actor.id, parsed.data.status);
    if (!updated) throw new HttpError(404, 'NOT_FOUND', 'Claim not found');

    res.json({ data: updated });
  };
}

export function markRecovered(repo: LostFoundRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const itemId = req.params.id as string;
    const item = await repo.getItemById(itemId);
    if (!item) throw new HttpError(404, 'NOT_FOUND', 'Item not found');

    const actorRoles = actor.roles.map((r: { role: string }) => r.role);
    const isStaff = actorRoles.some((r: string) => ['administrator', 'service_staff'].includes(r));
    const isReporter = actor.id === item.reportedBy;

    if (!isStaff && !isReporter) {
      throw new HttpError(403, 'FORBIDDEN', 'Only reporter or staff can mark item recovered');
    }

    const recovered = await repo.markItemRecovered(itemId);
    res.json({ data: recovered });
  };
}
