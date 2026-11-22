import { createFilesRouter } from './modules/files/routes/files.routes.ts';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './lib/logger.ts';
import { handleErrors, notFound } from './middleware/errors.ts';
import { requestContext } from './middleware/request-context.ts';
import { createV1Router } from './routes/v1.ts';
import type { ReadinessCheck } from './types/database.ts';
import type { Config } from './types/config.ts';
import type { Logger } from './types/logger.ts';
import type { VerifyIdentity } from './types/auth.ts';
import type { CampusUserRepository } from './types/user-repository.ts';
import type { AcademicsRepository } from './types/academics.ts';
import type { ExtraRepositories } from './types/repositories.ts';

import { createSupabase } from './config/supabase.ts';
import { createVerifyIdentity } from './modules/auth/services/auth.service.ts';
import { createAuthRouter } from './modules/auth/routes/auth.routes.ts';
import { createUsersRouter } from './modules/users/routes/users.routes.ts';
import { createProfileRouter } from './modules/profile/routes/profile.routes.ts';
import { createAcademicsRouter } from './modules/academics/routes/academics.routes.ts';

// Phase 2
import { createTimetableRouter } from './modules/timetable/routes/timetable.routes.ts';
import { createAttendanceRouter } from './modules/attendance/routes/attendance.routes.ts';
import { createAssignmentsRouter } from './modules/assignments/routes/assignments.routes.ts';
import { createAppointmentsRouter } from './modules/appointments/routes/appointments.routes.ts';
import { createCalendarRouter } from './modules/calendar/routes/calendar.routes.ts';

// Phase 3
import { createHostelRouter } from './modules/hostel/routes/hostel.routes.ts';
import { createLibraryRouter } from './modules/library/routes/library.routes.ts';
import { createTicketsRouter } from './modules/tickets/routes/tickets.routes.ts';
import { createFacilitiesRouter } from './modules/facilities/routes/facilities.routes.ts';
import { createDocumentsRouter } from './modules/documents/routes/documents.routes.ts';
import { createAuditRouter } from './modules/audit/routes/audit.routes.ts';
import { createBulkRouter } from './modules/bulk/routes/bulk.routes.ts';

// Phase 4
import { createClubsRouter } from './modules/clubs/routes/clubs.routes.ts';
import { createPlacementsRouter } from './modules/placements/routes/placements.routes.ts';
import { createNoticesRouter } from './modules/notices/routes/notices.routes.ts';
import { createLostFoundRouter } from './modules/lost-found/routes/lost-found.routes.ts';
import { createDirectoryRouter } from './modules/directory/routes/directory.routes.ts';
import { createSurveysRouter } from './modules/surveys/routes/surveys.routes.ts';
import { createSearchRouter } from './modules/search/routes/search.routes.ts';
import { createAnalyticsRouter } from './modules/analytics/routes/analytics.routes.ts';

// Phase 5
import { createCampusRouter } from './modules/campus/routes/campus.routes.ts';
import { createDigitalIdRouter } from './modules/digital-id/routes/digital-id.routes.ts';

// Phase 6
import { createAiAssistantRouter } from './modules/ai-assistant/routes/ai.routes.ts';
import { createIotBusRouter } from './modules/iot-bus/routes/iot-bus.routes.ts';
import { createIntegrationsRouter } from './modules/integrations/routes/integrations.routes.ts';
import { createClientServicesRouter } from './modules/client-services/routes/client-services.routes.ts';

export type { ExtraRepositories };

export function createApp(
  config: Config,
  log: Logger = logger,
  check: ReadinessCheck = async () => { throw new Error('Database is not configured'); },
  verify: VerifyIdentity = createVerifyIdentity(createSupabase(config)),
  userRepo?: CampusUserRepository,
  academicsRepo?: AcademicsRepository,
  extraRepos?: ExtraRepositories,
) {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestContext(log));
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN, exposedHeaders: ['X-Request-ID'] }));
  if (userRepo && extraRepos?.filesRepo) app.use('/api/v1/files', createFilesRouter(verify, userRepo, extraRepos.filesRepo));
  app.use(express.json({ limit: '100kb' }));
  app.get('/', (_req, res) => {
    res.json({ status: 'ok', name: 'DCRUSTverse API', health: '/api/v1/health' });
  });
  app.use('/api/v1', createV1Router(check));
  app.use('/api/v1/auth', createAuthRouter(verify, userRepo));

  if (userRepo) {
    app.use('/api/v1/users', createUsersRouter(verify, userRepo));
    app.use('/api/v1/profile', createProfileRouter(verify, userRepo));
    app.use('/api/v1/bulk', createBulkRouter(verify, userRepo, extraRepos?.bulkRepo));
    app.use('/api/v1/client', createClientServicesRouter(verify, userRepo, extraRepos?.pushRepo));

    if (academicsRepo) {
      app.use('/api/v1/academics', createAcademicsRouter(verify, userRepo, academicsRepo));
    }

    if (extraRepos?.timetableRepo) {
      app.use('/api/v1/timetable', createTimetableRouter(verify, userRepo, extraRepos.timetableRepo));
    }

    if (extraRepos?.attendanceRepo) {
      app.use('/api/v1/attendance', createAttendanceRouter(verify, userRepo, extraRepos.attendanceRepo));
    }

    if (extraRepos?.assignmentsRepo) {
      app.use('/api/v1/assignments', createAssignmentsRouter(verify, userRepo, extraRepos.assignmentsRepo, extraRepos.filesRepo, extraRepos.academicPolicy));
    }

    if (extraRepos?.appointmentsRepo) {
      app.use('/api/v1/appointments', createAppointmentsRouter(verify, userRepo, extraRepos.appointmentsRepo));
    }

    if (
      extraRepos?.timetableRepo &&
      extraRepos?.assignmentsRepo &&
      extraRepos?.appointmentsRepo &&
      academicsRepo
    ) {
      app.use(
        '/api/v1/calendar',
        createCalendarRouter(
          verify,
          userRepo,
          extraRepos.timetableRepo,
          extraRepos.assignmentsRepo,
          extraRepos.appointmentsRepo,
          academicsRepo,
        ),
      );
    }

    if (extraRepos?.hostelRepo) {
      app.use('/api/v1/hostel', createHostelRouter(verify, userRepo, extraRepos.hostelRepo));
    }

    if (extraRepos?.libraryRepo) {
      app.use('/api/v1/library', createLibraryRouter(verify, userRepo, extraRepos.libraryRepo));
    }

    if (extraRepos?.ticketsRepo) {
      app.use('/api/v1/tickets', createTicketsRouter(verify, userRepo, extraRepos.ticketsRepo));
    }

    if (extraRepos?.facilitiesRepo) {
      app.use('/api/v1/facilities', createFacilitiesRouter(verify, userRepo, extraRepos.facilitiesRepo));
    }

    if (extraRepos?.documentsRepo) {
      app.use('/api/v1/documents', createDocumentsRouter(verify, userRepo, extraRepos.documentsRepo, extraRepos.filesRepo));
    }

    if (extraRepos?.auditRepo) {
      app.use('/api/v1/audit-events', createAuditRouter(verify, userRepo, extraRepos.auditRepo));
    }

    // Phase 4
    if (extraRepos?.clubsRepo) {
      app.use('/api/v1/clubs', createClubsRouter(verify, userRepo, extraRepos.clubsRepo));
    }

    if (extraRepos?.placementsRepo) {
      app.use('/api/v1/placements', createPlacementsRouter(verify, userRepo, extraRepos.placementsRepo));
    }

    if (extraRepos?.noticesRepo) {
      app.use('/api/v1/notices', createNoticesRouter(verify, userRepo, extraRepos.noticesRepo));
    }

    if (extraRepos?.lostFoundRepo) {
      app.use('/api/v1/lost-found', createLostFoundRouter(verify, userRepo, extraRepos.lostFoundRepo));
    }

    if (extraRepos?.directoryRepo) {
      app.use('/api/v1/directory', createDirectoryRouter(verify, userRepo, extraRepos.directoryRepo));
    }

    if (extraRepos?.surveysRepo) {
      app.use('/api/v1/surveys', createSurveysRouter(verify, userRepo, extraRepos.surveysRepo));
    }

    if (extraRepos?.searchRepo) {
      app.use('/api/v1/search', createSearchRouter(verify, userRepo, extraRepos.searchRepo));
    }

    if (extraRepos?.analyticsRepo) {
      app.use('/api/v1/analytics', createAnalyticsRouter(verify, userRepo, extraRepos.analyticsRepo));
    }

    // Phase 5
    if (extraRepos?.campusRepo) {
      app.use('/api/v1/campus', createCampusRouter(verify, userRepo, extraRepos.campusRepo));
    }

    if (extraRepos?.digitalIdRepo) {
      app.use('/api/v1/digital-id', createDigitalIdRouter(verify, userRepo, extraRepos.digitalIdRepo));
    }

    // Phase 6
    if (extraRepos?.aiRepo) {
      app.use('/api/v1/ai', createAiAssistantRouter(verify, userRepo, extraRepos.aiRepo));
    }

    if (extraRepos?.iotBusRepo) {
      app.use('/api/v1/iot', createIotBusRouter(verify, userRepo, extraRepos.iotBusRepo));
    }

    if (extraRepos?.integrationsRepo) {
      app.use('/api/v1/integrations', createIntegrationsRouter(verify, userRepo, extraRepos.integrationsRepo));
    }
  }

  app.use(notFound);
  app.use(handleErrors(log));
  return app;
}
