CREATE TABLE "survey_participations" (
	"survey_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "survey_participation_unique" UNIQUE("survey_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "survey_participations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "survey_participations" ADD CONSTRAINT "survey_participations_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_participations" ADD CONSTRAINT "survey_participations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;