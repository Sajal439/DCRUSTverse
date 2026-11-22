# DCRUSTVerse implementation checklist

All phases are committed scope. Checkboxes represent verified work, not scaffolding. Requirements IDs refer to PROJECT_REQUIREMENTS.md.

## Phase 0 — Scope and design

- [x] Read proposal and record agreed expanded scope.
- [x] Define role boundaries and per-module acceptance scenarios.
- [x] Record external integration dependencies and completion standard.
- [ ] Select and document stack, repository structure and deployment approach.
- [ ] Define screen navigation, API contracts and database schema.
- [ ] Create feature traceability register linking requirement, implementation and test evidence.

## Phase 1 — Working foundation

- [x] Stage 1: create TypeScript/Express API scaffolding, configuration, health endpoint and error handling.
- [ ] Stage 2: configure database and migrations. Pooling, migration runner, initial identity schema and readiness API implemented. Live database verification pending. Test files written for manual execution.
- [ ] Stage 3: implement authentication and session lifecycle. Supabase token verification and identity endpoint implemented. Campus onboarding, frontend session flows and live verification pending.
- [ ] Stage 4: implement scoped permissions.
- [ ] Initialize web, API, shared contracts and local database setup.
- [ ] Add migrations, fictional seeds and environment examples.
- [ ] Implement F01–F03: accounts, scoped permissions, profiles, dashboards and academic setup.
- [ ] Implement shared file storage, audit events, notification storage and worker infrastructure.
- [ ] Verify session revocation and cross-role/object access denial.

## Phase 2 — Academic workflows

- [ ] Implement F04–F07: timetable, attendance, assignments, grading and published results.
- [ ] Implement F18, F25: calendar and appointments.
- [ ] Verify conflicts, attendance corrections, submissions, unpublished-result restrictions and grade changes.

## Phase 3 — Campus operations

- [ ] Implement F08–F10: hostel, library and complaints.
- [ ] Implement F19–F21: approvals, audit views and bulk import/export.
- [ ] Implement F23–F24: facility bookings and document requests.
- [ ] Verify room/copy/booking concurrency, restricted attachments and approval transitions.

## Phase 4 — Communication and participation

- [ ] Implement F11–F13: clubs, events, placements, notices and real-time notifications.
- [ ] Implement F22, F26–F27: lost and found, directory and surveys.
- [ ] Implement F16–F17: permission-aware search and source-verified reports.
- [ ] Verify registration capacity, placement eligibility, targeting and survey privacy.

## Phase 5 — Digital campus

- [ ] Implement F14–F15: maintained locations, facilities, maps and navigation.
- [ ] Implement F31–F32: QR location pages and digital ID verification.
- [ ] Implement F36: interactive 3D campus and 2D fallback.
- [ ] Verify location links, route accessibility data and revoked credentials.

## Phase 6 — Mobile and connected services

- [ ] Implement F28–F29 across core journeys: offline behavior and accessibility.
- [ ] Implement F30: sourced AI answers with permission filtering.
- [ ] Implement F33–F34: vehicle/sensor ingestion, dashboards, stale states and simulators.
- [ ] Implement F35: mobile client and shared workflows.
- [ ] Implement F37: university adapters and sync monitoring.
- [ ] Verify reconnect behavior, source permissions, stale readings and idempotent sync.

## Phase 7 — Completion and demonstration

- [ ] Run acceptance scenarios for every F01–F37 requirement and record evidence.
- [ ] Run full role/permission regression and critical concurrent-operation tests.
- [ ] Verify desktop/mobile layouts, keyboard use, empty/error states and file access.
- [ ] Test deployment, migrations, backup and restore.
- [ ] Prepare demonstration accounts, resettable data and an end-to-end demonstration script.
- [ ] Document installation, configuration, operations, API and external dependencies.
- [ ] Connect and verify actual external feeds where available; explicitly record every remaining simulated integration.
- [ ] Produce a release checklist showing implemented, verified and live-commissioned status separately.

## Demonstration journeys

1. Administrator enrolls a student and assigns faculty; faculty records attendance, publishes an assignment and releases results; the student sees only their permitted records.
2. Student submits a complaint; assigned service staff resolves it; student receives an update and can reopen it; administrator sees accurate resolution reporting.
3. Student applies for a hostel room and reserves a book; authorized staff completes allocation and issue; capacity and availability update correctly.
4. Coordinator obtains event approval; student registers and attends; placement officer publishes an opportunity and advances an eligible application.
5. Visitor searches a campus building, views its information, follows a route, scans its QR link and selects it in the 3D view.
6. Student requests a facility booking, faculty appointment and document; relevant staff processes each request through the approval/calendar workflows.
7. Mobile user submits a request; web staff handles it; notification and audit views reflect the change. Offline and reconnect states are demonstrated.
8. Assistant answers with sources; device and bus feeds show fresh/stale status; synchronization retries without duplicates. Simulation labels remain visible where applicable.
