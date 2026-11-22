import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { AcademicPolicy } from '../../../types/academic-policy.ts';
import { HttpError } from '../../../lib/http-error.ts';
export function assignmentScope(policy: AcademicPolicy): RequestHandler {
  return async (req, res, next) => {
    const parts = req.path.split('/').filter(Boolean);
    const source = parts[0] === 'submissions' ? 'submission' : parts[0] === 'sections' || !parts.length ? 'section' : 'assignment';
    const rawId = !parts.length ? req.method === 'POST' ? req.body?.sectionId : req.query.sectionId : parts[0] === 'sections' || parts[0] === 'submissions' ? parts[1] : parts[0];
    const id = z.uuid().safeParse(rawId);
    if (!id.success) throw new HttpError(400, 'INVALID_INPUT', 'Choose a valid class, assignment or submission');
    await policy.authorize(res.locals.campusUser!, source, id.data, req.method === 'GET' ? res.locals.campusUser!.roles.some(role => ['faculty', 'department_head', 'administrator'].includes(role.role)) ? 'teach' : 'read' : parts[1] === 'submit' ? 'submit' : 'teach');
    next();
  };
}
