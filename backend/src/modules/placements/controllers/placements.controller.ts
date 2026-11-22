import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { PlacementsRepository } from '../repositories/placements.repository.ts';
import {
  createOpportunitySchema,
  applyOpportunitySchema,
  updateApplicationStatusSchema,
} from '../schemas/placements.schema.ts';

export function listOpportunities(repo: PlacementsRepository): RequestHandler {
  return async (req, res) => {
    const status = req.query.status as string | undefined;
    const data = await repo.listOpportunities(status);
    res.json({ data });
  };
}

export function createOpportunity(repo: PlacementsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = createOpportunitySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid placement data');
    }

    const data = await repo.createOpportunity({
      ...parsed.data,
      minCgpa: parsed.data.minCgpa <= 10 ? Math.round(parsed.data.minCgpa * 100) : Math.round(parsed.data.minCgpa),
      deadline: new Date(parsed.data.deadline),
      createdBy: actor.id,
    });

    res.status(201).json({ data });
  };
}

export function applyOpportunity(repo: PlacementsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const opportunityId = req.params.id as string;
    const opp = await repo.getOpportunityById(opportunityId);
    if (!opp) throw new HttpError(404, 'NOT_FOUND', 'Opportunity not found');

    if (new Date() > new Date(opp.deadline)) {
      throw new HttpError(400, 'DEADLINE_PASSED', 'The application deadline for this drive has passed');
    }

    const parsed = applyOpportunitySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid application data');
    }

    const scaledCgpa = parsed.data.cgpa <= 10 ? Math.round(parsed.data.cgpa * 100) : Math.round(parsed.data.cgpa);
    if (scaledCgpa < opp.minCgpa) {
      throw new HttpError(400, 'CGPA_INELIGIBLE', 'Your CGPA does not meet the minimum eligibility requirement');
    }

    const isBranchEligible = opp.eligibleBranches.some(
      b => b.toLowerCase().trim() === parsed.data.branch.toLowerCase().trim(),
    );
    if (!isBranchEligible) {
      throw new HttpError(400, 'BRANCH_INELIGIBLE', 'Your academic branch is not eligible for this drive');
    }

    try {
      const data = await repo.apply({
        opportunityId,
        studentId: actor.id,
        cgpa: scaledCgpa,
        branch: parsed.data.branch,
      });
      res.status(201).json({ data });
    } catch {
      throw new HttpError(409, 'ALREADY_APPLIED', 'You have already applied to this opportunity');
    }
  };
}

export function listApplications(repo: PlacementsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const isOfficer = actor.roles.some(r => ['placement_officer', 'administrator'].includes(r.role));
    const opportunityId = req.query.opportunityId as string | undefined;
    const studentId = isOfficer ? (req.query.studentId as string | undefined) : actor.id;

    const data = await repo.listApplications({ opportunityId, studentId });
    res.json({ data });
  };
}

export function updateApplicationStatus(repo: PlacementsRepository): RequestHandler {
  return async (req, res) => {
    const id = req.params.id as string;
    const parsed = updateApplicationStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid status');
    }
    const data = await repo.updateApplicationStatus(id, parsed.data.status);
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Application not found');
    res.json({ data });
  };
}
