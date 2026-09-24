ALTER TABLE "resources" ADD COLUMN "renewal_decision" varchar(30) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "decision_notes" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "cancellation_notice_days" integer;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "cancellation_deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "decided_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "decided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;