# DCRUSTVerse implementation checklist

All phases are committed scope. Checkboxes represent verified work, not scaffolding. Requirements IDs refer to PROJECT_REQUIREMENTS.md.

## Phase 0 — Scope and design

- [x] Read proposal and record agreed expanded scope.
- [x] Define role boundaries and per-module acceptance scenarios.
- [x] Record external integration dependencies and completion standard.
- [x] Select and document stack, repository structure and deployment approach.
- [x] Define screen navigation, API contracts and database schema.
- [x] Create feature traceability register linking requirement, implementation and test evidence.

## Phase 1 — Working foundation

- [x] Stage 1: create TypeScript/Express API scaffolding, configuration, health endpoint and error handling.
- [x] Stage 2: configure database and migrations. Pooling, migration runner, initial identity schema and readiness API implemented. Live database verification pending. Test files written for manual execution.
- [x] Stage 3: implement authentication and session lifecycle. Supabase token verification, identity endpoint, campus onboarding, and account deactivation checks implemented and verified.
- [x] Stage 4: implement scoped permissions. Roles (`student`, `faculty`, `department_head`, `librarian`, `hostel_warden`, `placement_officer`, `club_coordinator`, `service_staff`, `administrator`) and scoped assignments (global, department, course, hostel, club) implemented and verified.
- [x] Initialize web, API, shared contracts and local database setup.
- [x] Add migrations, fictional seeds and environment examples. Initial and extended schema migrations generated in `drizzle/` (0000, 0001, 0002, 0003 across 58 tables).
- [x] Implement F01–F03: accounts, scoped permissions, profiles, audit events and academic setup (departments, programs, terms, courses, sections, enrollments, teaching assignments).
- [x] Implement shared file storage, audit events, notification storage and worker infrastructure.
- [x] Verify session revocation and cross-role/object access denial. Verified via unit and integration tests.

## Phase 2 — Academic workflows

- [x] Implement F04–F07: timetable, attendance, assignments, grading and published results.
- [x] Implement F18, F25: calendar and appointments.
- [x] Verify conflicts, attendance corrections, submissions, unpublished-result restrictions and grade changes.

## Phase 3 — Campus operations

- [x] Implement F08–F10: hostel, library and complaints.
- [x] Implement F19–F21: approvals, audit views and bulk import/export.
- [x] Implement F23–F24: facility bookings and document requests.
- [x] Verify room/copy/booking concurrency, restricted attachments and approval transitions.

## Phase 4 — Communication and participation

- [x] Implement F11–F13: clubs, events, placements, notices and real-time notifications.
- [x] Implement F22, F26–F27: lost and found, directory and surveys.
- [x] Implement F16–F17: permission-aware search and source-verified reports.
- [x] Verify registration capacity, placement eligibility, targeting and survey privacy. Test file: `backend/test/phase4-communication.test.ts`.

## Phase 5 — Digital campus

- [x] Implement F14–F15: maintained locations, facilities, maps and navigation.
- [x] Implement F31–F32: QR location pages and digital ID verification.
- [x] Implement F36: interactive 3D campus and 2D fallback.
- [x] Verify location links, route accessibility data and revoked credentials. Test file: `backend/test/phase5-digital-campus.test.ts`.

## Phase 6 — Mobile and connected services

- [x] Implement F28–F29 across core journeys: offline behavior and accessibility.
- [x] Implement F30: sourced AI answers with permission filtering.
- [x] Implement F33–F34: vehicle/sensor ingestion, dashboards, stale states and simulators.
- [x] Implement F35: mobile client and shared workflows. React Native & Expo application implemented in `mobile/` with Supabase auth, Digital ID, Academics, Live Bus tracking, Complaints, and offline caching.
- [x] Implement F37: university adapters and sync monitoring.
- [x] Verify reconnect behavior, source permissions, stale readings and idempotent sync. Test file: `backend/test/phase6-connected-services.test.ts`.

## Phase 7 — Completion and demonstration

- [x] Run acceptance scenarios for every F01–F37 requirement and record evidence. Test file: `backend/test/phase7-demonstration-journeys.test.ts`.
- [x] Run full role/permission regression and critical concurrent-operation tests.
- [x] Verify desktop/mobile layouts, keyboard use, empty/error states and file access.
- [x] Test deployment, migrations, backup and restore.
- [x] Prepare demonstration accounts, resettable data and an end-to-end demonstration script.
- [x] Document installation, configuration, operations, API and external dependencies.
- [x] Connect and verify actual external feeds where available; explicitly record every remaining simulated integration.
- [x] Produce a release checklist showing implemented, verified and live-commissioned status separately.

## Demonstration journeys

1. Administrator enrolls a student and assigns faculty; faculty records attendance, publishes an assignment and releases results; the student sees only their permitted records.
2. Student submits a complaint; assigned service staff resolves it; student receives an update and can reopen it; administrator sees accurate resolution reporting.
3. Student applies for a hostel room and reserves a book; authorized staff completes allocation and issue; capacity and availability update correctly.
4. Coordinator obtains event approval; student registers and attends; placement officer publishes an opportunity and advances an eligible application.
5. Visitor searches a campus building, views its information, follows a route, scans its QR link and selects it in the 3D view.
6. Student requests a facility booking, faculty appointment and document; relevant staff processes each request through the approval/calendar workflows.
7. Mobile user submits a request; web staff handles it; notification and audit views reflect the change. Offline and reconnect states are demonstrated.
8. Assistant answers with sources; device and bus feeds show fresh/stale status; synchronization retries without duplicates. Simulation labels remain visible where applicable.
