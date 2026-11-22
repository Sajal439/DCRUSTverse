# DCRUSTVerse requirements

Status: implementation baseline. No application features are implemented yet.

Source: DCRUSTVerse_Project_Proposal.docx and the scope agreed in this chat. The committed scope includes the proposal, its future scope, the suggested improvements, and additional features. Phases describe delivery order, not optional scope.

## Product and completion standard

DCRUSTVerse connects campus academic records, services, communication, and locations through student, faculty, and staff portals. Every module must use persistent data and enforce permissions on the server. A screen backed only by static sample data does not satisfy a requirement.

A feature is complete when its authorized users can finish the workflow; invalid and unauthorized actions are rejected; loading, empty, error, and success states work; changes are visible to other affected users; and its acceptance scenario has passed. External integrations must distinguish simulated data from live data. Integration completion and live campus commissioning are separate statuses.

## Roles and permissions

Users may hold multiple scoped roles. Department, course, hostel, and club assignments limit their authority.

| Role | Authority |
|---|---|
| Student | Own profile, academic records, submissions, applications, reservations, and requests; permitted campus information |
| Faculty | Assigned teaching groups, attendance, assignments, grading, office hours; permitted student records |
| Department head | Department courses, staff assignments, approvals, and departmental reports |
| Librarian | Catalogue, copies, loans, reservations, and library reports |
| Hostel warden | Assigned hostel applications, rooms, allocation, transfers, and maintenance |
| Placement officer | Opportunities, eligibility, applications, and placement reports |
| Club coordinator | Assigned club memberships, event proposals, registrations, and attendance |
| Service staff | Assigned complaint categories, facilities, and maintenance requests |
| Administrator | Account provisioning, role assignments, campus configuration, academic setup, and authorized reports |

Public visitors may see published campus locations and public information. Private academic records, documents, and contact details must never be exposed through public pages or search. Users cannot grant themselves roles. Account deactivation revokes access.

## Functional requirements and acceptance scenarios

Each row defines the minimum complete workflow. Shared requirements below apply to every row.

| ID | Module and screens | Required behavior and acceptance scenario |
|---|---|---|
| F01 | Login, recovery, account administration | Provision verified campus accounts, reset passwords using expiring single-use tokens, manage sessions, deactivate accounts, and assign scoped roles. Verify an expired token and deactivated session fail; unauthorized role changes fail. |
| F02 | Profiles and dashboards | Students and faculty edit permitted profile fields; dashboards show their schedule, deadlines, notices, and pending actions. Verify two students cannot see each other's private records. |
| F03 | Departments and academic setup | Manage departments, programs, academic years, semesters, courses, sections, enrollment, and teaching assignments. Enroll a student and assign faculty; their portal views update. |
| F04 | Timetable | Manage recurring classes, rooms, exceptions, cancellations, and changes. Reject overlapping room/faculty bookings and notify affected users when a class changes. |
| F05 | Attendance | Faculty record attendance for assigned sessions; students view subject totals and request corrections. Approve a correction, recompute percentages, and preserve edit history. Duplicate session records are prevented. |
| F06 | Assignments | Faculty publish assignments and deadlines; students submit files or text; faculty grade and return feedback. Enforce late-submission policy, preserve submission history, and restrict file access. |
| F07 | Results and performance | Record assessments, calculate configured totals, review and publish results. Students see only published own results; authorized faculty see assigned students and performance summaries. Corrections are audited. |
| F08 | Hostel | Students apply, staff allocate rooms within capacity, and students request transfers or maintenance. Approve a transfer atomically and update occupancy without double allocation. |
| F09 | Library | Search catalogue and copy availability; reserve, issue, return, and renew books; show due dates and configured fines if enabled. Concurrent requests cannot issue the same copy twice; returns advance the reservation queue. |
| F10 | Complaints and service requests | Create categorized tickets with attachments and tracking IDs; route to responsible staff; track resolution targets, comments, escalation, closure, and reopening. Sensitive tickets have restricted visibility. Resolve and reopen a ticket across student and staff accounts. |
| F11 | Events and clubs | Manage membership applications and coordinator permissions; propose and approve events; register within capacity and record attendance. Reject duplicate registrations and prevent oversubscription. |
| F12 | Placements | Publish opportunities, eligibility and deadlines; students maintain placement profiles and apply; officers track selection stages. Verify eligibility enforcement and deadline checks on submission. |
| F13 | Notices and notifications | Draft, target, publish, expire and archive notices by role/department/year. Maintain in-app notifications, read status, and channel preferences. Real-time delivery updates connected clients; reconnecting users recover missed notifications. |
| F14 | Campus Explorer and navigation | Search buildings, departments, rooms, labs, hostels, library, sports facilities, canteens and offices. Show descriptions, photos, entrances, hours, contacts and walking routes. Accessible routing uses verified accessible paths; missing route data is disclosed. |
| F15 | Campus and faculty management | Authorized staff maintain facilities, location records, opening hours, faculty profiles and department assignments. Changes appear in directory, map, and relevant portals. |
| F16 | Global search | Search authorized notices, locations, events, catalogue entries and relevant records with filters and pagination. Private content never leaks through titles, snippets, counts, or direct links. |
| F17 | Analytics and reports | Produce attendance, hostel occupancy, complaint resolution, event participation and placement reports with date/scope filters and exports. Verify totals against source records and restrict exports by permission. |
| F18 | Unified calendar | Combine classes, exams, deadlines, events, appointments and placements with source links. Source changes update calendar entries; timezone and all-day events are consistent. |
| F19 | Approval centre | Show assigned pending hostel, club/event, booking, document and other supported approvals. Approve or reject with reasons; duplicate processing cannot repeat the action. |
| F20 | Audit history | Record actor, action, target, timestamp and relevant change details for sensitive operations. Authorized reviewers can filter records; ordinary users cannot alter history. Do not log passwords or reset tokens. |
| F21 | Bulk import/export | Provide CSV templates, preview validation, row errors, duplicate handling and import summaries for users, courses, enrollment and timetables. Invalid imports do not silently corrupt records; exported text cannot execute spreadsheet formulas. |
| F22 | Lost and found | Publish lost/found reports, search items, submit private claims, verify claims and mark recovered. Hide claim evidence and contact details from public listings. |
| F23 | Facility booking | Request rooms, labs, sports facilities and halls with approval and cancellation. Check availability against bookings and timetable; concurrent approvals cannot double-book. |
| F24 | Document requests | Request configured certificates, supply supporting data, obtain approval and securely download issued documents. Track progress; restrict downloads to authorized people. |
| F25 | Faculty appointments | Faculty publish office-hour availability; students request appointments; faculty accept, reject or reschedule. Prevent overlaps and reflect confirmed appointments in calendars. |
| F26 | Campus directory | Search departments, offices and permitted staff contact information, opening hours and locations. Honor contact visibility settings. |
| F27 | Feedback and surveys | Publish targeted surveys, accept responses within a window and aggregate results. Enforce response limits; explain whether responses are anonymous and keep anonymous responses out of identity-linked reports. |
| F28 | Low-connectivity access | Cache selected public campus content and explicitly selected schedule information; indicate offline/stale state and clear private caches on logout. Unsupported offline mutations must fail clearly. |
| F29 | Accessibility | Provide semantic navigation, keyboard operation, visible focus, labelled forms, sufficient contrast and accessible errors. Verify core journeys with keyboard and screen-reader checks; provide text alternatives to maps and 3D views. |
| F30 | AI campus assistant | Answer from approved campus information with source references and acknowledge missing information. Respect user permissions; treat retrieved content as data. Test unknown questions and attempts to retrieve another student's records. |
| F31 | QR location information | Generate location QR codes linking to maintained location pages. Scans open the correct campus information on mobile; deleted locations show a useful unavailable state. |
| F32 | Digital ID | Show authorized identity details and an expiring verification mechanism. Authorized verification reflects active/revoked status; a screenshot alone does not establish current validity. |
| F33 | Live bus tracking | Ingest vehicle coordinates with timestamps; display routes, stops, last update and stale/offline state. Test with a labelled simulator and separately verify a real device feed before calling it live. |
| F34 | IoT campus monitoring | Register devices, authenticate readings, store measurements, show trends and configured alerts. Reject invalid readings and display offline sensors; distinguish simulated feeds from live ones. |
| F35 | Mobile application | Deliver a mobile client using the shared API for login, dashboard, notices, calendar, map and service requests, with relevant device notifications. Verify a request created on mobile is handled in the staff web portal. Packaging/distribution targets must be recorded. |
| F36 | 3D campus visualization | Deliver an interactive campus model with selectable buildings linked to Explorer records and a usable 2D fallback. Record data provenance and distinguish approximate geometry from surveyed dimensions. |
| F37 | University integrations | Provide documented adapters, authenticated synchronization, field mappings, conflict policy, retry handling and sync status for available university systems. Verify repeated imports are idempotent. A contract-tested adapter is not a claim of live university connectivity. |

## Shared implementation requirements

- Server-side validation, object-level authorization, pagination, safe file handling and consistent error responses.
- Persistent database with migrations, referential integrity and transactions for contested resources.
- Configurable academic, hostel, library and approval policies; do not invent university policies as official facts.
- Private file storage with authorized downloads; upload type and size limits.
- Asia/Kolkata for campus display; preserve unambiguous timestamps in storage.
- Automated backup procedure and a tested restore; documented environment setup and deployment.
- Responsive layouts, accessible forms, useful empty states and no dead primary actions.
- Seeded fictional demonstration accounts and data visibly separated from live campus records.
- Meaningful automated tests for permissions, state transitions, concurrency and integrations, plus browser checks for core journeys.
- Secrets supplied through environment configuration, never committed to source control.

## Data model baseline

Identity: User, Profile, Role, RoleAssignment, Session, PasswordResetToken.

Academics: Department, Program, AcademicTerm, Course, Section, Enrollment, TeachingAssignment, Room, ClassSession, AttendanceRecord, AttendanceCorrection, Assignment, Submission, Grade, ResultPublication.

Operations: Hostel, HostelRoom, HostelApplication, Allocation, TransferRequest, LibraryTitle, BookCopy, Loan, Reservation, Ticket, TicketComment, TicketTransition, Facility, Booking.

Engagement: Club, Membership, Event, Registration, PlacementOpportunity, PlacementApplication, Notice, Notification, CalendarEntry, Appointment, Survey, Question, Response.

Services: LostFoundItem, Claim, DocumentRequest, IssuedDocument, Approval, Attachment, AuditEvent, ImportJob.

Campus and integrations: CampusLocation, Entrance, PathSegment, QRLocationLink, DigitalCredential, Bus, Route, Stop, VehiclePosition, Device, SensorReading, Alert, KnowledgeSource, IntegrationConnection, SyncRun, ExternalRecordMapping.

## External dependencies and open decisions

Real campus data, accurate map paths, building photographs and model geometry require collection or authorized sources. University integration requires documented interfaces and authorized access. Bus tracking and IoT require hardware feeds for live commissioning. AI requires a configured model provider or locally hosted model. Outbound email and device notifications require configured delivery services.

The proposed stack remains a decision to validate at implementation kickoff: TypeScript web application, Node.js API, PostgreSQL, shared API contracts, mobile client, object storage, and a background worker for notifications, imports and synchronization. No provider subscription or paid service is assumed.

Before live commissioning, record institution-approved policies, authoritative data sources, integration owners, mobile distribution target and hosting credentials. Development can proceed with documented configuration and labelled synthetic fixtures.
