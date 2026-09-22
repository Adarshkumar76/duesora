ALTER TABLE "resource_monitors" ADD COLUMN "last_alert_status" varchar(50);--> statement-breakpoint
ALTER TABLE "resource_monitors" ADD COLUMN "last_alerted_at" timestamp with time zone;