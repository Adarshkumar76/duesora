CREATE TABLE "resource_monitor_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"latency_ms" integer,
	"tls_days_remaining" integer,
	"message" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_monitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"hostname" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'unknown' NOT NULL,
	"tls_issuer" varchar(255),
	"tls_subject" varchar(255),
	"tls_valid_from" timestamp with time zone,
	"tls_valid_to" timestamp with time zone,
	"tls_days_remaining" integer,
	"tls_protocol" varchar(50),
	"dns_nameservers" text,
	"dns_ipv4" text,
	"latency_ms" integer,
	"last_checked_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resource_monitors_resource_unique" UNIQUE("resource_id")
);
--> statement-breakpoint
ALTER TABLE "resource_monitor_logs" ADD CONSTRAINT "resource_monitor_logs_monitor_id_resource_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."resource_monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_monitor_logs" ADD CONSTRAINT "resource_monitor_logs_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_monitor_logs" ADD CONSTRAINT "resource_monitor_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_monitors" ADD CONSTRAINT "resource_monitors_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_monitors" ADD CONSTRAINT "resource_monitors_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resource_monitor_logs_monitor_idx" ON "resource_monitor_logs" USING btree ("monitor_id");--> statement-breakpoint
CREATE INDEX "resource_monitor_logs_resource_idx" ON "resource_monitor_logs" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "resource_monitors_workspace_idx" ON "resource_monitors" USING btree ("workspace_id");