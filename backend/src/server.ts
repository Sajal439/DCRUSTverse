import { createAcademicPolicy } from './modules/academics/repositories/academic-policy.repository.ts';
import { createFilesRepository } from './modules/files/repositories/files.repository.ts';
import { startPushWorker } from './modules/client-services/services/push-worker.ts';
import { createPushRepository } from './modules/client-services/repositories/push.repository.ts';
import { createBulkRepository } from './modules/bulk/repositories/bulk.repository.ts';
import { createApp } from './app.ts';
import { logger } from './lib/logger.ts';
import { loadConfig } from './config/env.ts';
import { createDatabase } from './config/database.ts';
import { createReadinessCheck } from './services/readiness.service.ts';
import { createDrizzleUserRepository } from './modules/auth/repositories/user.repository.ts';
import { createDrizzleAcademicsRepository } from './modules/academics/repositories/academics.repository.ts';
import { createDrizzleTimetableRepository } from './modules/timetable/repositories/timetable.repository.ts';
import { createDrizzleAttendanceRepository } from './modules/attendance/repositories/attendance.repository.ts';
import { createDrizzleAssignmentsRepository } from './modules/assignments/repositories/assignments.repository.ts';
import { createDrizzleAppointmentsRepository } from './modules/appointments/repositories/appointments.repository.ts';
import { createDrizzleHostelRepository } from './modules/hostel/repositories/hostel.repository.ts';
import { createDrizzleLibraryRepository } from './modules/library/repositories/library.repository.ts';
import { createDrizzleTicketsRepository } from './modules/tickets/repositories/tickets.repository.ts';
import { createDrizzleFacilitiesRepository } from './modules/facilities/repositories/facilities.repository.ts';
import { createDrizzleDocumentsRepository } from './modules/documents/repositories/documents.repository.ts';
import { createDrizzleAuditRepository } from './modules/audit/controllers/audit.controller.ts';

// Phase 4
import { createDrizzleClubsRepository } from './modules/clubs/repositories/clubs.repository.ts';
import { createDrizzlePlacementsRepository } from './modules/placements/repositories/placements.repository.ts';
import { createDrizzleNoticesRepository } from './modules/notices/repositories/notices.repository.ts';
import { createDrizzleLostFoundRepository } from './modules/lost-found/repositories/lost-found.repository.ts';
import { createDrizzleDirectoryRepository } from './modules/directory/repositories/directory.repository.ts';
import { createDrizzleSurveysRepository } from './modules/surveys/repositories/surveys.repository.ts';
import { createDrizzleSearchRepository } from './modules/search/repositories/search.repository.ts';
import { createDrizzleAnalyticsRepository } from './modules/analytics/repositories/analytics.repository.ts';

// Phase 5
import { createDrizzleCampusRepository } from './modules/campus/repositories/campus.repository.ts';
import { createDrizzleDigitalIdRepository } from './modules/digital-id/repositories/digital-id.repository.ts';

// Phase 6
import { createDrizzleAiAssistantRepository } from './modules/ai-assistant/repositories/ai.repository.ts';
import { createDrizzleIotBusRepository } from './modules/iot-bus/repositories/iot-bus.repository.ts';
import { createDrizzleIntegrationsRepository } from './modules/integrations/repositories/integrations.repository.ts';

try {
  const config = loadConfig();
  const database = createDatabase(config, logger);
  const check = createReadinessCheck(database);

  const userRepo = database ? createDrizzleUserRepository(database.orm) : undefined;
  const academicsRepo = database ? createDrizzleAcademicsRepository(database.orm) : undefined;

  const extraRepos = database
    ? {
        pushRepo: createPushRepository(database.orm),
        filesRepo: createFilesRepository(database.orm),
        academicPolicy: createAcademicPolicy(database.orm),
        bulkRepo: createBulkRepository(database.orm),
        timetableRepo: createDrizzleTimetableRepository(database.orm),
        attendanceRepo: createDrizzleAttendanceRepository(database.orm),
        assignmentsRepo: createDrizzleAssignmentsRepository(database.orm),
        appointmentsRepo: createDrizzleAppointmentsRepository(database.orm),
        hostelRepo: createDrizzleHostelRepository(database.orm),
        libraryRepo: createDrizzleLibraryRepository(database.orm),
        ticketsRepo: createDrizzleTicketsRepository(database.orm),
        facilitiesRepo: createDrizzleFacilitiesRepository(database.orm),
        documentsRepo: createDrizzleDocumentsRepository(database.orm),
        auditRepo: createDrizzleAuditRepository(database.orm),
        clubsRepo: createDrizzleClubsRepository(database.orm),
        placementsRepo: createDrizzlePlacementsRepository(database.orm),
        noticesRepo: createDrizzleNoticesRepository(database.orm),
        lostFoundRepo: createDrizzleLostFoundRepository(database.orm),
        directoryRepo: createDrizzleDirectoryRepository(database.orm),
        surveysRepo: createDrizzleSurveysRepository(database.orm),
        searchRepo: createDrizzleSearchRepository(database.orm),
        analyticsRepo: createDrizzleAnalyticsRepository(database.orm),
        campusRepo: createDrizzleCampusRepository(database.orm),
        digitalIdRepo: createDrizzleDigitalIdRepository(database.orm),
        aiRepo: createDrizzleAiAssistantRepository(database.orm),
        iotBusRepo: createDrizzleIotBusRepository(database.orm),
        integrationsRepo: createDrizzleIntegrationsRepository(database.orm),
      }
    : undefined;

  const server = createApp(config, logger, check, undefined, userRepo, academicsRepo, extraRepos).listen(
    config.PORT,
    config.HOST,
    () => {
      logger.info({ event: 'server_started', host: config.HOST, port: config.PORT, environment: config.NODE_ENV });
    },
  );

  server.on('error', error => {
    logger.error({ event: 'server_error', message: error.message });
    void database?.close().catch(() => logger.error({ event: 'database_shutdown_failed' }));
    process.exitCode = 1;
  });

  const stopPushWorker = database ? startPushWorker(database.pool) : () => {};
  let stopping = false;
  const shutdown = (signal: string) => {
    if (stopping) return;
    stopping = true;
    stopPushWorker();
    logger.info({ event: 'server_stopping', signal });
    const timeout = setTimeout(() => {
      server.closeAllConnections();
      process.exit(1);
    }, 10_000);
    timeout.unref();
    server.close(async error => {
      try {
        await database?.close();
        process.exitCode = error ? 1 : 0;
      } catch {
        logger.error({ event: 'database_shutdown_failed' });
        process.exitCode = 1;
      } finally {
        clearTimeout(timeout);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  logger.error({ event: 'startup_failed', message: error instanceof Error ? error.message : 'Startup failed' });
  process.exitCode = 1;
}
