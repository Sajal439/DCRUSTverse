CREATE TABLE "bus_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bus_id" uuid NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"speed_kmh" integer DEFAULT 0 NOT NULL,
	"is_simulated" boolean DEFAULT false NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bus_positions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "buses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bus_number" text NOT NULL,
	"route_name" text NOT NULL,
	"driver_name" text NOT NULL,
	"driver_phone" text NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buses_bus_number_unique" UNIQUE("bus_number")
);
--> statement-breakpoint
ALTER TABLE "buses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "campus_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"building" text NOT NULL,
	"description" text,
	"coordinates" jsonb DEFAULT '{"lat": 0, "lng": 0}'::jsonb NOT NULL,
	"opening_hours" text,
	"contact_phone" text,
	"contact_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campus_locations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "campus_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "club_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "club_memberships_unique" UNIQUE("club_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "club_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"coordinator_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clubs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "clubs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "digital_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_number" text NOT NULL,
	"barcode" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"verification_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "digital_credentials_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "digital_credentials_credential_number_unique" UNIQUE("credential_number"),
	CONSTRAINT "digital_credentials_verification_token_unique" UNIQUE("verification_token")
);
--> statement-breakpoint
ALTER TABLE "digital_credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"attended" boolean DEFAULT false NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_registrations_unique" UNIQUE("event_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "event_registrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"capacity" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_capacity_check" CHECK ("events"."capacity" > 0),
	CONSTRAINT "events_dates_check" CHECK ("events"."end_time" > "events"."start_time")
);
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "iot_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_code" text NOT NULL,
	"location_name" text NOT NULL,
	"sensor_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "iot_devices_device_code_unique" UNIQUE("device_code")
);
--> statement-breakpoint
ALTER TABLE "iot_devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "location_entrances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_accessible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "location_entrances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lost_found_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"claimant_id" uuid NOT NULL,
	"proof_description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lost_found_claims" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lost_found_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"location_found" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"reported_by" uuid NOT NULL,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lost_found_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"target_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_department_id" uuid,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"published_by" uuid,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "path_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_location_id" uuid NOT NULL,
	"to_location_id" uuid NOT NULL,
	"distance_meters" integer NOT NULL,
	"is_accessible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "path_segments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "placement_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"cgpa" integer NOT NULL,
	"branch" text NOT NULL,
	"status" text DEFAULT 'applied' NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_applications_unique" UNIQUE("opportunity_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "placement_applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "placement_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"min_cgpa" integer DEFAULT 0 NOT NULL,
	"eligible_branches" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"package_details" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "placement_opportunities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "qr_location_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"qr_token" text NOT NULL,
	"scan_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qr_location_links_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
ALTER TABLE "qr_location_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sensor_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" text NOT NULL,
	"unit" text NOT NULL,
	"is_simulated" boolean DEFAULT false NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sensor_readings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "survey_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"question_type" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "survey_questions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"respondent_id" uuid,
	"response_text" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "survey_responses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"max_responses" integer DEFAULT 1000 NOT NULL,
	"target_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "surveys_dates_check" CHECK ("surveys"."ends_at" > "surveys"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "surveys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "university_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"idempotency_key" text NOT NULL,
	"records_processed" integer DEFAULT 0 NOT NULL,
	"error_log" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "university_sync_runs_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "university_sync_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bus_positions" ADD CONSTRAINT "bus_positions_bus_id_buses_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_coordinator_id_users_id_fk" FOREIGN KEY ("coordinator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_credentials" ADD CONSTRAINT "digital_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_entrances" ADD CONSTRAINT "location_entrances_location_id_campus_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."campus_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lost_found_claims" ADD CONSTRAINT "lost_found_claims_item_id_lost_found_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."lost_found_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lost_found_claims" ADD CONSTRAINT "lost_found_claims_claimant_id_users_id_fk" FOREIGN KEY ("claimant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lost_found_claims" ADD CONSTRAINT "lost_found_claims_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lost_found_items" ADD CONSTRAINT "lost_found_items_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_target_department_id_departments_id_fk" FOREIGN KEY ("target_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "path_segments" ADD CONSTRAINT "path_segments_from_location_id_campus_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."campus_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "path_segments" ADD CONSTRAINT "path_segments_to_location_id_campus_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."campus_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_opportunity_id_placement_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."placement_opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_opportunities" ADD CONSTRAINT "placement_opportunities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_location_links" ADD CONSTRAINT "qr_location_links_location_id_campus_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."campus_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_device_id_iot_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."iot_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_question_id_survey_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."survey_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_respondent_id_users_id_fk" FOREIGN KEY ("respondent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bus_positions_bus_idx" ON "bus_positions" USING btree ("bus_id");--> statement-breakpoint
CREATE INDEX "bus_positions_recorded_idx" ON "bus_positions" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "club_memberships_student_idx" ON "club_memberships" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "event_registrations_student_idx" ON "event_registrations" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "location_entrances_loc_idx" ON "location_entrances" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "lost_found_claims_item_idx" ON "lost_found_claims" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "lost_found_claims_claimant_idx" ON "lost_found_claims" USING btree ("claimant_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "placement_applications_student_idx" ON "placement_applications" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "qr_links_location_idx" ON "qr_location_links" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "sensor_readings_device_idx" ON "sensor_readings" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "sensor_readings_recorded_idx" ON "sensor_readings" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "survey_questions_survey_idx" ON "survey_questions" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_responses_survey_idx" ON "survey_responses" USING btree ("survey_id");