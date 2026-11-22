import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { AssignmentsRepository } from '../repositories/assignments.repository.ts';
import {
  createAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from '../schemas/assignments.schema.ts';

export function createAssignment(repo: AssignmentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = createAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid assignment data');
    }

    const data = await repo.createAssignment({
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      createdBy: actor.id,
    });

    res.status(201).json({ data });
  };
}

export function listAssignments(repo: AssignmentsRepository): RequestHandler {
  return async (req, res) => {
    const sectionId = req.query.sectionId as string;
    if (!sectionId) {
      throw new HttpError(400, 'INVALID_INPUT', 'sectionId query parameter is required');
    }
    const data = await repo.listAssignments(sectionId);
    res.json({ data });
  };
}

export function submitAssignment(repo: AssignmentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const assignmentId = req.params.id as string;
    const assignment = await repo.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new HttpError(404, 'NOT_FOUND', 'Assignment not found');
    }

    const existingSubmission = await repo.getSubmission(assignmentId, actor.id);
    if (existingSubmission) {
      throw new HttpError(409, 'ALREADY_SUBMITTED', 'You have already submitted this assignment');
    }

    const parsed = submitAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid submission data');
    }

    const isLate = new Date() > new Date(assignment.dueDate);
    if (isLate && !assignment.allowLate) {
      throw new HttpError(400, 'SUBMISSION_DEADLINE_PASSED', 'Late submissions are not permitted for this assignment');
    }

    const data = await repo.submitAssignment({
      assignmentId,
      studentId: actor.id,
      content: parsed.data.content,
      fileUrl: parsed.data.fileUrl,
      isLate,
    });

    res.status(201).json({ data });
  };
}

export function listSubmissions(repo: AssignmentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const assignmentId = req.params.id as string;
    const isFacultyOrAdmin = actor.roles.some(r => ['faculty', 'administrator', 'department_head'].includes(r.role));

    if (isFacultyOrAdmin) {
      const data = await repo.listSubmissions(assignmentId);
      return res.json({ data });
    }

    // Student can only see their own submission
    const ownSubmission = await repo.getSubmission(assignmentId, actor.id);
    const assignment = await repo.getAssignmentById(assignmentId);
    if (ownSubmission && assignment && !await repo.isResultsPublished(assignment.sectionId)) ownSubmission.grade = null;
    res.json({ data: ownSubmission ? [ownSubmission] : [] });
  };
}

export function gradeSubmission(repo: AssignmentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const submissionId = req.params.submissionId as string;
    const parsed = gradeSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid grade data');
    }

    const data = await repo.gradeSubmission({
      submissionId,
      marksObtained: parsed.data.marksObtained,
      feedback: parsed.data.feedback,
      gradedBy: actor.id,
    });

    res.status(201).json({ data });
  };
}

export function publishSectionResults(repo: AssignmentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const sectionId = req.params.sectionId as string;
    const published = await repo.publishResults(sectionId, actor.id);
    res.json({ data: { sectionId, published } });
  };
}

export function getSectionResults(repo: AssignmentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const sectionId = req.params.sectionId as string;
    const isFacultyOrAdmin = actor.roles.some(r => ['faculty', 'administrator', 'department_head'].includes(r.role));

    const isPublished = await repo.isResultsPublished(sectionId);
    if (!isFacultyOrAdmin && !isPublished) {
      throw new HttpError(403, 'RESULTS_NOT_PUBLISHED', 'Results for this section have not been published yet');
    }

    let targetStudentId = actor.id;
    if (isFacultyOrAdmin && req.query.studentId) {
      targetStudentId = req.query.studentId as string;
    }

    const data = await repo.getStudentResults(targetStudentId, sectionId);
    res.json({ data });
  };
}
