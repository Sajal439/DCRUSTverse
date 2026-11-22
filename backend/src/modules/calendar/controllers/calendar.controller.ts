import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { TimetableRepository } from '../../timetable/repositories/timetable.repository.ts';
import type { AssignmentsRepository } from '../../assignments/repositories/assignments.repository.ts';
import type { AppointmentsRepository } from '../../appointments/repositories/appointments.repository.ts';
import type { AcademicsRepository } from '../../academics/repositories/academics.repository.ts';

import type { CalendarEntry } from '../../../types/calendar.ts';
export type { CalendarEntry };

export function getUnifiedCalendar(
  timetableRepo: TimetableRepository,
  assignmentsRepo: AssignmentsRepository,
  appointmentsRepo: AppointmentsRepository,
  academicsRepo: AcademicsRepository,
): RequestHandler {
  return async (_req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const entries: CalendarEntry[] = [];

    // 1. User's enrolled/teaching sections
    const isFaculty = actor.roles.some(r => r.role === 'faculty');
    let sectionIds: string[] = [];

    if (isFaculty) {
      const teaches = await academicsRepo.listTeachingAssignments({ facultyId: actor.id });
      sectionIds = teaches.map(t => t.sectionId);
    } else {
      const enrolls = await academicsRepo.listEnrollments({ studentId: actor.id });
      sectionIds = enrolls.filter(e => e.status === 'enrolled').map(e => e.sectionId);
    }

    // 2. Class sessions
    for (const sectionId of sectionIds) {
      const sessions = await timetableRepo.listSessions({ sectionId });
      for (const s of sessions) {
        if (s.status !== 'cancelled') {
          entries.push({
            id: `class-${s.id}`,
            type: 'class',
            title: `Class Session (Day ${s.dayOfWeek})`,
            startTime: s.startTime,
            endTime: s.endTime,
            sourceId: s.id,
          });
        }
      }

      // 3. Assignment deadlines
      const assignList = await assignmentsRepo.listAssignments(sectionId);
      for (const a of assignList) {
        entries.push({
          id: `assign-${a.id}`,
          type: 'assignment_due',
          title: `Due: ${a.title}`,
          startTime: a.dueDate,
          sourceId: a.id,
        });
      }
    }

    // 4. Confirmed Appointments
    const appts = await appointmentsRepo.listAppointments({
      ...(isFaculty ? { facultyId: actor.id } : { studentId: actor.id }),
      status: 'confirmed',
    });

    for (const appt of appts) {
      entries.push({
        id: `appt-${appt.id}`,
        type: 'appointment',
        title: `Appointment: ${appt.reason}`,
        startTime: appt.startTime,
        endTime: appt.endTime,
        sourceId: appt.id,
      });
    }

    res.json({ data: entries });
  };
}
