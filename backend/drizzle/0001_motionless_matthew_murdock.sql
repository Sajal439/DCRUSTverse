CREATE TABLE "academic_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "academic_terms_code_unique" UNIQUE("code"),
	CONSTRAINT "academic_terms_code_check" CHECK ("academic_terms"."code" = upper(btrim("academic_terms"."code")) AND length("academic_terms"."code") BETWEEN 1 AND 30),
	CONSTRAINT "academic_terms_name_check" CHECK (length(btrim("academic_terms"."name")) BETWEEN 1 AND 200),
	CONSTRAINT "academic_terms_status_check" CHECK ("academic_terms"."status" IN ('upcoming', 'active', 'completed')),
	CONSTRAINT "academic_terms_dates_check" CHECK ("academic_terms"."end_date" > "academic_terms"."start_date")
);
--> statement-breakpoint
ALTER TABLE "academic_terms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"credits" integer NOT NULL,
	"type" text DEFAULT 'core' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_code_unique" UNIQUE("code"),
	CONSTRAINT "courses_code_check" CHECK ("courses"."code" = upper(btrim("courses"."code")) AND length("courses"."code") BETWEEN 1 AND 30),
	CONSTRAINT "courses_name_check" CHECK (length(btrim("courses"."name")) BETWEEN 1 AND 200),
	CONSTRAINT "courses_credits_check" CHECK ("courses"."credits" BETWEEN 1 AND 20),
	CONSTRAINT "courses_type_check" CHECK ("courses"."type" IN ('core', 'elective', 'lab'))
);
--> statement-breakpoint
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"status" text DEFAULT 'enrolled' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_student_section_unique" UNIQUE("student_id","section_id"),
	CONSTRAINT "enrollments_status_check" CHECK ("enrollments"."status" IN ('enrolled', 'dropped', 'completed'))
);
--> statement-breakpoint
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"roll_number" text,
	"employee_id" text,
	"designation" text,
	"phone" text,
	"avatar_url" text,
	"bio" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "profiles_roll_number_unique" UNIQUE("roll_number"),
	CONSTRAINT "profiles_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "profiles_phone_check" CHECK ("profiles"."phone" IS NULL OR length(btrim("profiles"."phone")) BETWEEN 7 AND 20),
	CONSTRAINT "profiles_bio_check" CHECK ("profiles"."bio" IS NULL OR length("profiles"."bio") <= 1000)
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"total_semesters" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programs_code_unique" UNIQUE("code"),
	CONSTRAINT "programs_code_check" CHECK ("programs"."code" = upper(btrim("programs"."code")) AND length("programs"."code") BETWEEN 1 AND 30),
	CONSTRAINT "programs_name_check" CHECK (length(btrim("programs"."name")) BETWEEN 1 AND 200),
	CONSTRAINT "programs_type_check" CHECK ("programs"."type" IN ('undergraduate', 'postgraduate', 'doctorate', 'diploma')),
	CONSTRAINT "programs_semesters_check" CHECK ("programs"."total_semesters" BETWEEN 1 AND 12)
);
--> statement-breakpoint
ALTER TABLE "programs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"scope_type" text DEFAULT 'global' NOT NULL,
	"scope_id" uuid,
	"assigned_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_assignments_role_check" CHECK ("role_assignments"."role" IN ('student', 'faculty', 'department_head', 'librarian', 'hostel_warden', 'placement_officer', 'club_coordinator', 'service_staff', 'administrator')),
	CONSTRAINT "role_assignments_scope_type_check" CHECK ("role_assignments"."scope_type" IN ('global', 'department', 'course', 'hostel', 'club')),
	CONSTRAINT "role_assignments_scope_integrity_check" CHECK (("role_assignments"."scope_type" = 'global' AND "role_assignments"."scope_id" IS NULL) OR ("role_assignments"."scope_type" != 'global' AND "role_assignments"."scope_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "role_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"academic_term_id" uuid NOT NULL,
	"name" text NOT NULL,
	"capacity" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sections_course_term_name_unique" UNIQUE("course_id","academic_term_id","name"),
	CONSTRAINT "sections_name_check" CHECK (length(btrim("sections"."name")) BETWEEN 1 AND 20),
	CONSTRAINT "sections_capacity_check" CHECK ("sections"."capacity" BETWEEN 1 AND 500)
);
--> statement-breakpoint
ALTER TABLE "sections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "teaching_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"role" text DEFAULT 'primary' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teaching_assignments_faculty_section_unique" UNIQUE("faculty_id","section_id"),
	CONSTRAINT "teaching_assignments_role_check" CHECK ("teaching_assignments"."role" IN ('primary', 'assistant'))
);
--> statement-breakpoint
ALTER TABLE "teaching_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_academic_term_id_academic_terms_id_fk" FOREIGN KEY ("academic_term_id") REFERENCES "public"."academic_terms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_faculty_id_users_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_events_target_idx" ON "audit_events" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "courses_department_idx" ON "courses" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "enrollments_student_idx" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "enrollments_section_idx" ON "enrollments" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "programs_department_idx" ON "programs" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "role_assignments_user_idx" ON "role_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "role_assignments_lookup_idx" ON "role_assignments" USING btree ("role","scope_type","scope_id");--> statement-breakpoint
CREATE INDEX "sections_course_idx" ON "sections" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "sections_term_idx" ON "sections" USING btree ("academic_term_id");--> statement-breakpoint
CREATE INDEX "teaching_assignments_faculty_idx" ON "teaching_assignments" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "teaching_assignments_section_idx" ON "teaching_assignments" USING btree ("section_id");--> statement-breakpoint
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
