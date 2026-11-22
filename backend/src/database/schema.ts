import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  check,
  index,
  integer,
  jsonb,
  unique,
  boolean,
} from 'drizzle-orm/pg-core';

export const pushDevices = pgTable('push_devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  deviceToken: text('device_token').notNull().unique(),
  platform: text('platform', { enum: ['android', 'ios'] }).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const pushDeliveries = pgTable('push_deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  deviceId: uuid('device_id').references(() => pushDevices.id, { onDelete: 'cascade' }).notNull(),
  notificationId: uuid('notification_id').references(() => notifications.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').default('pending').notNull(),
  ticketId: text('ticket_id'),
  attempts: integer('attempts').default(0).notNull(),
  error: text('error'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [unique('push_delivery_unique').on(table.deviceId, table.notificationId)]).enableRLS();

export const privateFiles = pgTable('private_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  contentBase64: text('content_base64').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

// Participation is separate from answers so anonymous responses have no user ID.
export const surveyParticipations = pgTable('survey_participations', {
  surveyId: uuid('survey_id').references(() => surveys.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
}, table => [unique('survey_participation_unique').on(table.surveyId, table.userId)]).enableRLS();

// ==========================================
// IDENTITY & ACADEMIC SETUP BASELINE
// ==========================================

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  check('departments_code_check', sql`${table.code} = upper(btrim(${table.code})) AND length(${table.code}) BETWEEN 1 AND 30`),
  check('departments_name_check', sql`length(btrim(${table.name})) BETWEEN 1 AND 200`),
]).enableRLS();

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authUserId: uuid('auth_user_id').notNull().unique(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'restrict' }),
  status: text('status', { enum: ['pending', 'active', 'disabled'] }).default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('users_department_idx').on(table.departmentId),
  check('users_email_check', sql`${table.email} = lower(btrim(${table.email})) AND length(${table.email}) BETWEEN 3 AND 254`),
  check('users_name_check', sql`length(btrim(${table.displayName})) BETWEEN 1 AND 200`),
  check('users_status_check', sql`${table.status} IN ('pending', 'active', 'disabled')`),
]).enableRLS();

export const roleAssignments = pgTable('role_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', {
    enum: [
      'student',
      'faculty',
      'department_head',
      'librarian',
      'hostel_warden',
      'placement_officer',
      'club_coordinator',
      'service_staff',
      'administrator',
    ],
  }).notNull(),
  scopeType: text('scope_type', {
    enum: ['global', 'department', 'course', 'hostel', 'club'],
  }).default('global').notNull(),
  scopeId: uuid('scope_id'),
  assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('role_assignments_user_idx').on(table.userId),
  index('role_assignments_lookup_idx').on(table.role, table.scopeType, table.scopeId),
  check('role_assignments_role_check', sql`${table.role} IN ('student', 'faculty', 'department_head', 'librarian', 'hostel_warden', 'placement_officer', 'club_coordinator', 'service_staff', 'administrator')`),
  check('role_assignments_scope_type_check', sql`${table.scopeType} IN ('global', 'department', 'course', 'hostel', 'club')`),
  check('role_assignments_scope_integrity_check', sql`(${table.scopeType} = 'global' AND ${table.scopeId} IS NULL) OR (${table.scopeType} != 'global' AND ${table.scopeId} IS NOT NULL)`),
]).enableRLS();

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  rollNumber: text('roll_number').unique(),
  employeeId: text('employee_id').unique(),
  designation: text('designation'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  check('profiles_phone_check', sql`${table.phone} IS NULL OR length(btrim(${table.phone})) BETWEEN 7 AND 20`),
  check('profiles_bio_check', sql`${table.bio} IS NULL OR length(${table.bio}) <= 1000`),
]).enableRLS();

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  details: jsonb('details').default(sql`'{}'::jsonb`).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('audit_events_actor_idx').on(table.actorId),
  index('audit_events_target_idx').on(table.targetType, table.targetId),
  index('audit_events_created_at_idx').on(table.createdAt),
]).enableRLS();

export const programs = pgTable('programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'restrict' }).notNull(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type', { enum: ['undergraduate', 'postgraduate', 'doctorate', 'diploma'] }).notNull(),
  totalSemesters: integer('total_semesters').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('programs_department_idx').on(table.departmentId),
  check('programs_code_check', sql`${table.code} = upper(btrim(${table.code})) AND length(${table.code}) BETWEEN 1 AND 30`),
  check('programs_name_check', sql`length(btrim(${table.name})) BETWEEN 1 AND 200`),
  check('programs_type_check', sql`${table.type} IN ('undergraduate', 'postgraduate', 'doctorate', 'diploma')`),
  check('programs_semesters_check', sql`${table.totalSemesters} BETWEEN 1 AND 12`),
]).enableRLS();

export const academicTerms = pgTable('academic_terms', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  status: text('status', { enum: ['upcoming', 'active', 'completed'] }).default('upcoming').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  check('academic_terms_code_check', sql`${table.code} = upper(btrim(${table.code})) AND length(${table.code}) BETWEEN 1 AND 30`),
  check('academic_terms_name_check', sql`length(btrim(${table.name})) BETWEEN 1 AND 200`),
  check('academic_terms_status_check', sql`${table.status} IN ('upcoming', 'active', 'completed')`),
  check('academic_terms_dates_check', sql`${table.endDate} > ${table.startDate}`),
]).enableRLS();

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'restrict' }).notNull(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  credits: integer('credits').notNull(),
  type: text('type', { enum: ['core', 'elective', 'lab'] }).default('core').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('courses_department_idx').on(table.departmentId),
  check('courses_code_check', sql`${table.code} = upper(btrim(${table.code})) AND length(${table.code}) BETWEEN 1 AND 30`),
  check('courses_name_check', sql`length(btrim(${table.name})) BETWEEN 1 AND 200`),
  check('courses_credits_check', sql`${table.credits} BETWEEN 1 AND 20`),
  check('courses_type_check', sql`${table.type} IN ('core', 'elective', 'lab')`),
]).enableRLS();

export const sections = pgTable('sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  academicTermId: uuid('academic_term_id').references(() => academicTerms.id, { onDelete: 'restrict' }).notNull(),
  name: text('name').notNull(),
  capacity: integer('capacity').default(60).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('sections_course_idx').on(table.courseId),
  index('sections_term_idx').on(table.academicTermId),
  unique('sections_course_term_name_unique').on(table.courseId, table.academicTermId, table.name),
  check('sections_name_check', sql`length(btrim(${table.name})) BETWEEN 1 AND 20`),
  check('sections_capacity_check', sql`${table.capacity} BETWEEN 1 AND 500`),
]).enableRLS();

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sectionId: uuid('section_id').references(() => sections.id, { onDelete: 'cascade' }).notNull(),
  status: text('status', { enum: ['enrolled', 'dropped', 'completed'] }).default('enrolled').notNull(),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('enrollments_student_idx').on(table.studentId),
  index('enrollments_section_idx').on(table.sectionId),
  unique('enrollments_student_section_unique').on(table.studentId, table.sectionId),
  check('enrollments_status_check', sql`${table.status} IN ('enrolled', 'dropped', 'completed')`),
]).enableRLS();

export const teachingAssignments = pgTable('teaching_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  facultyId: uuid('faculty_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sectionId: uuid('section_id').references(() => sections.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['primary', 'assistant'] }).default('primary').notNull(),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('teaching_assignments_faculty_idx').on(table.facultyId),
  index('teaching_assignments_section_idx').on(table.sectionId),
  unique('teaching_assignments_faculty_section_unique').on(table.facultyId, table.sectionId),
  check('teaching_assignments_role_check', sql`${table.role} IN ('primary', 'assistant')`),
]).enableRLS();

// ==========================================
// PHASE 2: ACADEMIC WORKFLOWS
// ==========================================

export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  building: text('building').notNull(),
  capacity: integer('capacity').notNull(),
  type: text('type', { enum: ['lecture_hall', 'classroom', 'lab', 'seminar_hall'] }).default('classroom').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  check('rooms_code_check', sql`${table.code} = upper(btrim(${table.code})) AND length(${table.code}) BETWEEN 1 AND 30`),
  check('rooms_capacity_check', sql`${table.capacity} BETWEEN 1 AND 1000`),
]).enableRLS();

export const classSessions = pgTable('class_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sectionId: uuid('section_id').references(() => sections.id, { onDelete: 'cascade' }).notNull(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'restrict' }).notNull(),
  facultyId: uuid('faculty_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 1=Mon, 7=Sun
  startTime: text('start_time').notNull(), // HH:mm
  endTime: text('end_time').notNull(), // HH:mm
  date: text('date'), // YYYY-MM-DD optional
  status: text('status', { enum: ['scheduled', 'cancelled', 'rescheduled'] }).default('scheduled').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('class_sessions_section_idx').on(table.sectionId),
  index('class_sessions_room_idx').on(table.roomId),
  index('class_sessions_faculty_idx').on(table.facultyId),
  check('class_sessions_day_check', sql`${table.dayOfWeek} BETWEEN 1 AND 7`),
  check('class_sessions_time_check', sql`${table.startTime} < ${table.endTime}`),
]).enableRLS();

export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => classSessions.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: text('status', { enum: ['present', 'absent', 'late', 'excused'] }).notNull(),
  recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('attendance_session_student_unique').on(table.sessionId, table.studentId),
  index('attendance_student_idx').on(table.studentId),
  check('attendance_status_check', sql`${table.status} IN ('present', 'absent', 'late', 'excused')`),
]).enableRLS();

export const attendanceCorrections = pgTable('attendance_corrections', {
  id: uuid('id').defaultRandom().primaryKey(),
  attendanceRecordId: uuid('attendance_record_id').references(() => attendanceRecords.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  requestedStatus: text('requested_status', { enum: ['present', 'excused'] }).notNull(),
  reason: text('reason').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).default('pending').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('attendance_corrections_student_idx').on(table.studentId),
  check('attendance_corrections_reason_check', sql`length(btrim(${table.reason})) BETWEEN 5 AND 500`),
]).enableRLS();

export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  sectionId: uuid('section_id').references(() => sections.id, { onDelete: 'cascade' }).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  maxMarks: integer('max_marks').default(100).notNull(),
  allowLate: boolean('allow_late').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('assignments_section_idx').on(table.sectionId),
  check('assignments_title_check', sql`length(btrim(${table.title})) BETWEEN 1 AND 200`),
  check('assignments_marks_check', sql`${table.maxMarks} > 0`),
]).enableRLS();

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content'),
  fileUrl: text('file_url'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  isLate: boolean('is_late').default(false).notNull(),
}, table => [
  unique('submissions_assignment_student_unique').on(table.assignmentId, table.studentId),
  index('submissions_student_idx').on(table.studentId),
]).enableRLS();

export const grades = pgTable('grades', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id').references(() => submissions.id, { onDelete: 'cascade' }).notNull().unique(),
  marksObtained: integer('marks_obtained').notNull(),
  feedback: text('feedback'),
  gradedBy: uuid('graded_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gradedAt: timestamp('graded_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  check('grades_marks_check', sql`${table.marksObtained} >= 0`),
]).enableRLS();

export const resultPublications = pgTable('result_publications', {
  id: uuid('id').defaultRandom().primaryKey(),
  sectionId: uuid('section_id').references(() => sections.id, { onDelete: 'cascade' }).notNull().unique(),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedBy: uuid('published_by').references(() => users.id, { onDelete: 'set null' }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
}).enableRLS();

export const facultyAvailabilities = pgTable('faculty_availabilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  facultyId: uuid('faculty_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('faculty_availabilities_faculty_idx').on(table.facultyId),
  check('faculty_availabilities_time_check', sql`${table.startTime} < ${table.endTime}`),
]).enableRLS();

export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  facultyId: uuid('faculty_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  startTime: timestamp('start_date', { withTimezone: true }).notNull(),
  endTime: timestamp('end_date', { withTimezone: true }).notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'rejected', 'cancelled'] }).default('pending').notNull(),
  reason: text('reason').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('appointments_faculty_idx').on(table.facultyId),
  index('appointments_student_idx').on(table.studentId),
  check('appointments_dates_check', sql`${table.endTime} > ${table.startTime}`),
]).enableRLS();

// ==========================================
// PHASE 3: CAMPUS OPERATIONS
// ==========================================

export const hostels = pgTable('hostels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  gender: text('gender', { enum: ['male', 'female', 'coed'] }).notNull(),
  wardenId: uuid('warden_id').references(() => users.id, { onDelete: 'set null' }),
  capacity: integer('capacity').notNull(),
}, table => [
  check('hostels_capacity_check', sql`${table.capacity} > 0`),
]).enableRLS();

export const hostelRooms = pgTable('hostel_rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  hostelId: uuid('hostel_id').references(() => hostels.id, { onDelete: 'cascade' }).notNull(),
  roomNumber: text('room_number').notNull(),
  capacity: integer('capacity').default(2).notNull(),
  currentOccupancy: integer('current_occupancy').default(0).notNull(),
}, table => [
  unique('hostel_rooms_unique').on(table.hostelId, table.roomNumber),
  check('hostel_rooms_occupancy_check', sql`${table.currentOccupancy} <= ${table.capacity}`),
]).enableRLS();

export const hostelApplications = pgTable('hostel_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  hostelId: uuid('hostel_id').references(() => hostels.id, { onDelete: 'cascade' }).notNull(),
  status: text('status', { enum: ['pending', 'approved', 'allocated', 'rejected'] }).default('pending').notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('hostel_applications_student_idx').on(table.studentId),
]).enableRLS();

export const hostelAllocations = pgTable('hostel_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  roomId: uuid('room_id').references(() => hostelRooms.id, { onDelete: 'cascade' }).notNull(),
  allocatedAt: timestamp('allocated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('hostel_allocations_room_idx').on(table.roomId),
]).enableRLS();

export const hostelTransfers = pgTable('hostel_transfers', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fromRoomId: uuid('from_room_id').references(() => hostelRooms.id, { onDelete: 'cascade' }).notNull(),
  toRoomId: uuid('to_room_id').references(() => hostelRooms.id, { onDelete: 'cascade' }).notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).default('pending').notNull(),
  reason: text('reason').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('hostel_transfers_student_idx').on(table.studentId),
]).enableRLS();

export const libraryTitles = pgTable('library_titles', {
  id: uuid('id').defaultRandom().primaryKey(),
  isbn: text('isbn').notNull().unique(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  category: text('category').notNull(),
  totalCopies: integer('total_copies').default(1).notNull(),
  availableCopies: integer('available_copies').default(1).notNull(),
}, table => [
  check('library_titles_copies_check', sql`${table.availableCopies} <= ${table.totalCopies}`),
]).enableRLS();

export const bookCopies = pgTable('book_copies', {
  id: uuid('id').defaultRandom().primaryKey(),
  titleId: uuid('title_id').references(() => libraryTitles.id, { onDelete: 'cascade' }).notNull(),
  barcode: text('barcode').notNull().unique(),
  status: text('status', { enum: ['available', 'issued', 'reserved', 'lost'] }).default('available').notNull(),
}, table => [
  index('book_copies_title_idx').on(table.titleId),
]).enableRLS();

export const loans = pgTable('loans', {
  id: uuid('id').defaultRandom().primaryKey(),
  copyId: uuid('copy_id').references(() => bookCopies.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  returnedAt: timestamp('returned_at', { withTimezone: true }),
  fineAmount: integer('fine_amount').default(0).notNull(),
}, table => [
  index('loans_copy_idx').on(table.copyId),
  index('loans_user_idx').on(table.userId),
]).enableRLS();

export const reservations = pgTable('reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  titleId: uuid('title_id').references(() => libraryTitles.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  queuePosition: integer('queue_position').notNull(),
  status: text('status', { enum: ['pending', 'fulfilled', 'cancelled'] }).default('pending').notNull(),
  reservedAt: timestamp('reserved_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('reservations_title_idx').on(table.titleId),
  index('reservations_user_idx').on(table.userId),
]).enableRLS();

export const tickets = pgTable('tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  trackingId: text('tracking_id').notNull().unique(),
  creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  category: text('category', { enum: ['hostel', 'academic', 'facility', 'harassment', 'general'] }).notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).default('medium').notNull(),
  status: text('status', { enum: ['open', 'in_progress', 'resolved', 'closed', 'reopened'] }).default('open').notNull(),
  isSensitive: boolean('is_sensitive').default(false).notNull(),
  assignedStaffId: uuid('assigned_staff_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('tickets_creator_idx').on(table.creatorId),
  index('tickets_assigned_idx').on(table.assignedStaffId),
  index('tickets_status_idx').on(table.status),
  check('tickets_title_check', sql`length(btrim(${table.title})) BETWEEN 3 AND 200`),
]).enableRLS();

export const ticketComments = pgTable('ticket_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  isInternal: boolean('is_internal').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('ticket_comments_ticket_idx').on(table.ticketId),
  check('ticket_comments_msg_check', sql`length(btrim(${table.message})) BETWEEN 1 AND 2000`),
]).enableRLS();

export const facilities = pgTable('facilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type', { enum: ['hall', 'auditorium', 'lab', 'ground', 'conference_room'] }).notNull(),
  capacity: integer('capacity').notNull(),
}, table => [
  check('facilities_capacity_check', sql`${table.capacity} > 0`),
]).enableRLS();

export const facilityBookings = pgTable('facility_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  facilityId: uuid('facility_id').references(() => facilities.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  purpose: text('purpose').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'cancelled'] }).default('pending').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('facility_bookings_facility_idx').on(table.facilityId),
  index('facility_bookings_user_idx').on(table.userId),
  check('facility_bookings_dates_check', sql`${table.endTime} > ${table.startTime}`),
]).enableRLS();

export const documentRequests = pgTable('document_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  documentType: text('document_type', {
    enum: ['bonafide', 'transcript', 'character_certificate', 'no_objection'],
  }).notNull(),
  purpose: text('purpose').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'issued', 'rejected'] }).default('pending').notNull(),
  issuedFileUrl: text('issued_file_url'),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('document_requests_user_idx').on(table.userId),
]).enableRLS();

// ==========================================
// PHASE 4: COMMUNICATION & PARTICIPATION
// ==========================================

export const clubs = pgTable('clubs', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  coordinatorId: uuid('coordinator_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const clubMemberships = pgTable('club_memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  clubId: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['member', 'coordinator'] }).default('member').notNull(),
  status: text('status', { enum: ['pending', 'active', 'inactive'] }).default('pending').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('club_memberships_unique').on(table.clubId, table.studentId),
  index('club_memberships_student_idx').on(table.studentId),
]).enableRLS();

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  clubId: uuid('club_id').references(() => clubs.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  location: text('location').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  capacity: integer('capacity').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'cancelled'] }).default('pending').notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  check('events_capacity_check', sql`${table.capacity} > 0`),
  check('events_dates_check', sql`${table.endTime} > ${table.startTime}`),
]).enableRLS();

export const eventRegistrations = pgTable('event_registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  attended: boolean('attended').default(false).notNull(),
  registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('event_registrations_unique').on(table.eventId, table.studentId),
  index('event_registrations_student_idx').on(table.studentId),
]).enableRLS();

export const placementOpportunities = pgTable('placement_opportunities', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyName: text('company_name').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  minCgpa: integer('min_cgpa').default(0).notNull(), // scaled by 100, e.g. 750 = 7.50
  eligibleBranches: jsonb('eligible_branches').default(sql`'[]'::jsonb`).notNull(),
  deadline: timestamp('deadline', { withTimezone: true }).notNull(),
  packageDetails: text('package_details'),
  status: text('status', { enum: ['open', 'closed'] }).default('open').notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const placementApplications = pgTable('placement_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  opportunityId: uuid('opportunity_id').references(() => placementOpportunities.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  cgpa: integer('cgpa').notNull(), // scaled by 100
  branch: text('branch').notNull(),
  status: text('status', { enum: ['applied', 'shortlisted', 'selected', 'rejected'] }).default('applied').notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique('placement_applications_unique').on(table.opportunityId, table.studentId),
  index('placement_applications_student_idx').on(table.studentId),
]).enableRLS();

export const notices = pgTable('notices', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  targetRoles: jsonb('target_roles').default(sql`'[]'::jsonb`).notNull(),
  targetDepartmentId: uuid('target_department_id').references(() => departments.id, { onDelete: 'set null' }),
  isUrgent: boolean('is_urgent').default(false).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  publishedBy: uuid('published_by').references(() => users.id, { onDelete: 'set null' }),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('notifications_user_idx').on(table.userId),
]).enableRLS();

export const lostFoundItems = pgTable('lost_found_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type', { enum: ['lost', 'found'] }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  locationFound: text('location_found').notNull(),
  status: text('status', { enum: ['open', 'claimed', 'recovered'] }).default('open').notNull(),
  reportedBy: uuid('reported_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reportedAt: timestamp('reported_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const lostFoundClaims = pgTable('lost_found_claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').references(() => lostFoundItems.id, { onDelete: 'cascade' }).notNull(),
  claimantId: uuid('claimant_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  proofDescription: text('proof_description').notNull(),
  status: text('status', { enum: ['pending', 'verified', 'rejected'] }).default('pending').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('lost_found_claims_item_idx').on(table.itemId),
  index('lost_found_claims_claimant_idx').on(table.claimantId),
]).enableRLS();

export const surveys = pgTable('surveys', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  maxResponses: integer('max_responses').default(1000).notNull(),
  targetRoles: jsonb('target_roles').default(sql`'[]'::jsonb`).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  check('surveys_dates_check', sql`${table.endsAt} > ${table.startsAt}`),
]).enableRLS();

export const surveyQuestions = pgTable('survey_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  surveyId: uuid('survey_id').references(() => surveys.id, { onDelete: 'cascade' }).notNull(),
  questionText: text('question_text').notNull(),
  questionType: text('question_type', { enum: ['multiple_choice', 'text'] }).notNull(),
  options: jsonb('options').default(sql`'[]'::jsonb`).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('survey_questions_survey_idx').on(table.surveyId),
]).enableRLS();

export const surveyResponses = pgTable('survey_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  surveyId: uuid('survey_id').references(() => surveys.id, { onDelete: 'cascade' }).notNull(),
  questionId: uuid('question_id').references(() => surveyQuestions.id, { onDelete: 'cascade' }).notNull(),
  respondentId: uuid('respondent_id').references(() => users.id, { onDelete: 'set null' }),
  responseText: text('response_text').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('survey_responses_survey_idx').on(table.surveyId),
]).enableRLS();

// ==========================================
// PHASE 5: DIGITAL CAMPUS
// ==========================================

export const campusLocations = pgTable('campus_locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category', {
    enum: ['academic', 'hostel', 'admin', 'library', 'sports', 'canteen', 'facility'],
  }).notNull(),
  building: text('building').notNull(),
  description: text('description'),
  coordinates: jsonb('coordinates').default(sql`'{"lat": 0, "lng": 0}'::jsonb`).notNull(),
  openingHours: text('opening_hours'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const locationEntrances = pgTable('location_entrances', {
  id: uuid('id').defaultRandom().primaryKey(),
  locationId: uuid('location_id').references(() => campusLocations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  isAccessible: boolean('is_accessible').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('location_entrances_loc_idx').on(table.locationId),
]).enableRLS();

export const pathSegments = pgTable('path_segments', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromLocationId: uuid('from_location_id').references(() => campusLocations.id, { onDelete: 'cascade' }).notNull(),
  toLocationId: uuid('to_location_id').references(() => campusLocations.id, { onDelete: 'cascade' }).notNull(),
  distanceMeters: integer('distance_meters').notNull(),
  isAccessible: boolean('is_accessible').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const qrLocationLinks = pgTable('qr_location_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  locationId: uuid('location_id').references(() => campusLocations.id, { onDelete: 'cascade' }).notNull(),
  qrToken: text('qr_token').notNull().unique(),
  scanCount: integer('scan_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('qr_links_location_idx').on(table.locationId),
]).enableRLS();

export const digitalCredentials = pgTable('digital_credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  credentialNumber: text('credential_number').notNull().unique(),
  barcode: text('barcode').notNull(),
  status: text('status', { enum: ['active', 'revoked'] }).default('active').notNull(),
  verificationToken: text('verification_token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

// ==========================================
// PHASE 6: CONNECTED SERVICES
// ==========================================

export const buses = pgTable('buses', {
  id: uuid('id').defaultRandom().primaryKey(),
  busNumber: text('bus_number').notNull().unique(),
  routeName: text('route_name').notNull(),
  driverName: text('driver_name').notNull(),
  driverPhone: text('driver_phone').notNull(),
  isLive: boolean('is_live').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const busPositions = pgTable('bus_positions', {
  id: uuid('id').defaultRandom().primaryKey(),
  busId: uuid('bus_id').references(() => buses.id, { onDelete: 'cascade' }).notNull(),
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  speedKmh: integer('speed_kmh').default(0).notNull(),
  isSimulated: boolean('is_simulated').default(false).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('bus_positions_bus_idx').on(table.busId),
  index('bus_positions_recorded_idx').on(table.recordedAt),
]).enableRLS();

export const iotDevices = pgTable('iot_devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  deviceCode: text('device_code').notNull().unique(),
  locationName: text('location_name').notNull(),
  sensorType: text('sensor_type', {
    enum: ['air_quality', 'water_level', 'power', 'temperature'],
  }).notNull(),
  status: text('status', { enum: ['active', 'offline'] }).default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const sensorReadings = pgTable('sensor_readings', {
  id: uuid('id').defaultRandom().primaryKey(),
  deviceId: uuid('device_id').references(() => iotDevices.id, { onDelete: 'cascade' }).notNull(),
  metricName: text('metric_name').notNull(),
  metricValue: text('metric_value').notNull(),
  unit: text('unit').notNull(),
  isSimulated: boolean('is_simulated').default(false).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('sensor_readings_device_idx').on(table.deviceId),
  index('sensor_readings_recorded_idx').on(table.recordedAt),
]).enableRLS();

export const universitySyncRuns = pgTable('university_sync_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  integrationName: text('integration_name', {
    enum: ['erp_attendance', 'exam_portal', 'hr_directory'],
  }).notNull(),
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'failed'] }).default('pending').notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  recordsProcessed: integer('records_processed').default(0).notNull(),
  errorLog: text('error_log'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}).enableRLS();

