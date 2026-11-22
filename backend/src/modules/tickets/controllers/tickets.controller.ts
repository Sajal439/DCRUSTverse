import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { TicketsRepository } from '../repositories/tickets.repository.ts';
import {
  createTicketSchema,
  updateTicketStatusSchema,
  assignStaffSchema,
  addCommentSchema,
} from '../schemas/tickets.schema.ts';

export function createTicket(repo: TicketsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid ticket data');
    }

    const data = await repo.createTicket({
      ...parsed.data,
      creatorId: actor.id,
    });

    res.status(201).json({ data });
  };
}

export function getTicket(repo: TicketsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const id = req.params.id as string;
    const ticket = await repo.getTicketById(id);
    if (!ticket) throw new HttpError(404, 'NOT_FOUND', 'Ticket not found');

    const isGlobalAdmin = actor.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
    const isCreator = actor.id === ticket.creatorId;
    const isAssignedStaff = actor.id === ticket.assignedStaffId;

    if (ticket.isSensitive && !isGlobalAdmin && !isCreator && !isAssignedStaff) {
      throw new HttpError(403, 'SENSITIVE_TICKET_FORBIDDEN', 'Access to sensitive ticket is strictly restricted');
    }

    const isStaff = isGlobalAdmin || actor.roles.some(r => ['service_staff', 'department_head'].includes(r.role));
    const comments = await repo.listComments(ticket.id, isStaff);

    res.json({
      data: {
        ...ticket,
        comments,
      },
    });
  };
}

export function listTickets(repo: TicketsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const isPrivileged = actor.roles.some(r => ['administrator', 'service_staff', 'department_head'].includes(r.role));
    const creatorId = isPrivileged ? (req.query.creatorId as string | undefined) : actor.id;

    const list = await repo.listTickets({
      creatorId,
      assignedStaffId: req.query.assignedStaffId as string | undefined,
      category: req.query.category as string | undefined,
      status: req.query.status as string | undefined,
    });

    // Filter out sensitive tickets if the viewer is not creator, assigned staff, or admin
    const isGlobalAdmin = actor.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
    const visibleList = list.filter(t => {
      if (!t.isSensitive) return true;
      return isGlobalAdmin || t.creatorId === actor.id || t.assignedStaffId === actor.id;
    });

    res.json({ data: visibleList });
  };
}

export function updateTicketStatus(repo: TicketsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const id = req.params.id as string;
    const ticket = await repo.getTicketById(id);
    if (!ticket) throw new HttpError(404, 'NOT_FOUND', 'Ticket not found');

    const parsed = updateTicketStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid status data');
    }

    const isCreator = actor.id === ticket.creatorId;
    const isStaff = actor.roles.some(r => ['administrator', 'service_staff', 'department_head'].includes(r.role));

    // A student/creator can only reopen a resolved or closed ticket
    if (!isStaff && isCreator) {
      if (parsed.data.status !== 'reopened') {
        throw new HttpError(403, 'FORBIDDEN', 'Creators can only reopen resolved tickets');
      }
    }

    const data = await repo.updateStatus(id, parsed.data.status, parsed.data.resolutionNotes);
    res.json({ data });
  };
}

export function assignStaff(repo: TicketsRepository): RequestHandler {
  return async (req, res) => {
    const id = req.params.id as string;
    const parsed = assignStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid staff assignment');
    }

    const data = await repo.assignStaff(id, parsed.data.staffId);
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Ticket not found');
    res.json({ data });
  };
}

export function addComment(repo: TicketsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const ticketId = req.params.id as string;
    const parsed = addCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid comment');
    }

    const isStaff = actor.roles.some(r => ['administrator', 'service_staff', 'department_head'].includes(r.role));
    if (parsed.data.isInternal && !isStaff) {
      throw new HttpError(403, 'FORBIDDEN', 'Only staff can post internal notes');
    }

    const data = await repo.addComment({
      ticketId,
      userId: actor.id,
      message: parsed.data.message,
      isInternal: parsed.data.isInternal,
    });

    res.status(201).json({ data });
  };
}
