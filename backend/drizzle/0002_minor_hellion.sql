CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_dates_check" CHECK ("appointments"."end_date" > "appointments"."start_date")
);
--> statement-breakpoint
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp with time zone NOT NULL,
	"max_marks" integer DEFAULT 100 NOT NULL,
	"allow_late" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_title_check" CHECK (length(btrim("assignments"."title")) BETWEEN 1 AND 200),
	CONSTRAINT "assignments_marks_check" CHECK ("assignments"."max_marks" > 0)
);
--> statement-breakpoint
ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "attendance_corrections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendance_record_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"requested_status" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_corrections_reason_check" CHECK (length(btrim("attendance_corrections"."reason")) BETWEEN 5 AND 500)
);
--> statement-breakpoint
ALTER TABLE "attendance_corrections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" text NOT NULL,
	"recorded_by" uuid,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_session_student_unique" UNIQUE("session_id","student_id"),
	CONSTRAINT "attendance_status_check" CHECK ("attendance_records"."status" IN ('present', 'absent', 'late', 'excused'))
);
--> statement-breakpoint
ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "book_copies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_id" uuid NOT NULL,
	"barcode" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	CONSTRAINT "book_copies_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
ALTER TABLE "book_copies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "class_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"faculty_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"date" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_sessions_day_check" CHECK ("class_sessions"."day_of_week" BETWEEN 1 AND 7),
	CONSTRAINT "class_sessions_time_check" CHECK ("class_sessions"."start_time" < "class_sessions"."end_time")
);
--> statement-breakpoint
ALTER TABLE "class_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"purpose" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"issued_file_url" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"capacity" integer NOT NULL,
	CONSTRAINT "facilities_code_unique" UNIQUE("code"),
	CONSTRAINT "facilities_capacity_check" CHECK ("facilities"."capacity" > 0)
);
--> statement-breakpoint
ALTER TABLE "facilities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "facility_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"purpose" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facility_bookings_dates_check" CHECK ("facility_bookings"."end_time" > "facility_bookings"."start_time")
);
--> statement-breakpoint
ALTER TABLE "facility_bookings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "faculty_availabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faculty_availabilities_time_check" CHECK ("faculty_availabilities"."start_time" < "faculty_availabilities"."end_time")
);
--> statement-breakpoint
ALTER TABLE "faculty_availabilities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"marks_obtained" integer NOT NULL,
	"feedback" text,
	"graded_by" uuid NOT NULL,
	"graded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grades_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "grades_marks_check" CHECK ("grades"."marks_obtained" >= 0)
);
--> statement-breakpoint
ALTER TABLE "grades" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hostel_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"allocated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hostel_allocations_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
ALTER TABLE "hostel_allocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hostel_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"hostel_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hostel_applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hostel_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hostel_id" uuid NOT NULL,
	"room_number" text NOT NULL,
	"capacity" integer DEFAULT 2 NOT NULL,
	"current_occupancy" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "hostel_rooms_unique" UNIQUE("hostel_id","room_number"),
	CONSTRAINT "hostel_rooms_occupancy_check" CHECK ("hostel_rooms"."current_occupancy" <= "hostel_rooms"."capacity")
);
--> statement-breakpoint
ALTER TABLE "hostel_rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hostel_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"from_room_id" uuid NOT NULL,
	"to_room_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hostel_transfers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hostels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"gender" text NOT NULL,
	"warden_id" uuid,
	"capacity" integer NOT NULL,
	CONSTRAINT "hostels_name_unique" UNIQUE("name"),
	CONSTRAINT "hostels_capacity_check" CHECK ("hostels"."capacity" > 0)
);
--> statement-breakpoint
ALTER TABLE "hostels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "library_titles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"isbn" text NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"category" text NOT NULL,
	"total_copies" integer DEFAULT 1 NOT NULL,
	"available_copies" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "library_titles_isbn_unique" UNIQUE("isbn"),
	CONSTRAINT "library_titles_copies_check" CHECK ("library_titles"."available_copies" <= "library_titles"."total_copies")
);
--> statement-breakpoint
ALTER TABLE "library_titles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"copy_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"returned_at" timestamp with time zone,
	"fine_amount" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"queue_position" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reserved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reservations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "result_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_by" uuid,
	"published_at" timestamp with time zone,
	CONSTRAINT "result_publications_section_id_unique" UNIQUE("section_id")
);
--> statement-breakpoint
ALTER TABLE "result_publications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"building" text NOT NULL,
	"capacity" integer NOT NULL,
	"type" text DEFAULT 'classroom' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_code_unique" UNIQUE("code"),
	CONSTRAINT "rooms_code_check" CHECK ("rooms"."code" = upper(btrim("rooms"."code")) AND length("rooms"."code") BETWEEN 1 AND 30),
	CONSTRAINT "rooms_capacity_check" CHECK ("rooms"."capacity" BETWEEN 1 AND 1000)
);
--> statement-breakpoint
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"content" text,
	"file_url" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_late" boolean DEFAULT false NOT NULL,
	CONSTRAINT "submissions_assignment_student_unique" UNIQUE("assignment_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ticket_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_comments_msg_check" CHECK (length(btrim("ticket_comments"."message")) BETWEEN 1 AND 2000)
);
--> statement-breakpoint
ALTER TABLE "ticket_comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_id" text NOT NULL,
	"creator_id" uuid NOT NULL,
	"category" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"is_sensitive" boolean DEFAULT false NOT NULL,
	"assigned_staff_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_tracking_id_unique" UNIQUE("tracking_id"),
	CONSTRAINT "tickets_title_check" CHECK (length(btrim("tickets"."title")) BETWEEN 3 AND 200)
);
--> statement-breakpoint
ALTER TABLE "tickets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_faculty_id_users_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_attendance_record_id_attendance_records_id_fk" FOREIGN KEY ("attendance_record_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_title_id_library_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."library_titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_faculty_id_users_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_availabilities" ADD CONSTRAINT "faculty_availabilities_faculty_id_users_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_room_id_hostel_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."hostel_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_applications" ADD CONSTRAINT "hostel_applications_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_applications" ADD CONSTRAINT "hostel_applications_hostel_id_hostels_id_fk" FOREIGN KEY ("hostel_id") REFERENCES "public"."hostels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_hostel_id_hostels_id_fk" FOREIGN KEY ("hostel_id") REFERENCES "public"."hostels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_transfers" ADD CONSTRAINT "hostel_transfers_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_transfers" ADD CONSTRAINT "hostel_transfers_from_room_id_hostel_rooms_id_fk" FOREIGN KEY ("from_room_id") REFERENCES "public"."hostel_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_transfers" ADD CONSTRAINT "hostel_transfers_to_room_id_hostel_rooms_id_fk" FOREIGN KEY ("to_room_id") REFERENCES "public"."hostel_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_transfers" ADD CONSTRAINT "hostel_transfers_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostels" ADD CONSTRAINT "hostels_warden_id_users_id_fk" FOREIGN KEY ("warden_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_copy_id_book_copies_id_fk" FOREIGN KEY ("copy_id") REFERENCES "public"."book_copies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_title_id_library_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."library_titles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_publications" ADD CONSTRAINT "result_publications_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_publications" ADD CONSTRAINT "result_publications_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_staff_id_users_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_faculty_idx" ON "appointments" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "appointments_student_idx" ON "appointments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "assignments_section_idx" ON "assignments" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "attendance_corrections_student_idx" ON "attendance_corrections" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "attendance_student_idx" ON "attendance_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "book_copies_title_idx" ON "book_copies" USING btree ("title_id");--> statement-breakpoint
CREATE INDEX "class_sessions_section_idx" ON "class_sessions" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "class_sessions_room_idx" ON "class_sessions" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "class_sessions_faculty_idx" ON "class_sessions" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "document_requests_user_idx" ON "document_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "facility_bookings_facility_idx" ON "facility_bookings" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "facility_bookings_user_idx" ON "facility_bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "faculty_availabilities_faculty_idx" ON "faculty_availabilities" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "hostel_allocations_room_idx" ON "hostel_allocations" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "hostel_applications_student_idx" ON "hostel_applications" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "hostel_transfers_student_idx" ON "hostel_transfers" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "loans_copy_idx" ON "loans" USING btree ("copy_id");--> statement-breakpoint
CREATE INDEX "loans_user_idx" ON "loans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reservations_title_idx" ON "reservations" USING btree ("title_id");--> statement-breakpoint
CREATE INDEX "reservations_user_idx" ON "reservations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "submissions_student_idx" ON "submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "ticket_comments_ticket_idx" ON "ticket_comments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "tickets_creator_idx" ON "tickets" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "tickets_assigned_idx" ON "tickets" USING btree ("assigned_staff_id");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
