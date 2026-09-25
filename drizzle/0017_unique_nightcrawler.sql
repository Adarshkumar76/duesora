CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"permissions" varchar(20) DEFAULT 'read' NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"depends_on_resource_id" uuid NOT NULL,
	"notes" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resource_dependencies_unique" UNIQUE("resource_id","depends_on_resource_id")
);
--> statement-breakpoint
DROP INDEX "workspace_budgets_workspace_id_idx";--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "seat_tracking_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "total_seats" integer;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "assigned_seats" integer;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "cost_per_seat_minor" integer;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "reminder_days" text DEFAULT '[30,14,7,3,1,0]' NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_dependencies" ADD CONSTRAINT "resource_dependencies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_dependencies" ADD CONSTRAINT "resource_dependencies_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_dependencies" ADD CONSTRAINT "resource_dependencies_depends_on_resource_id_resources_id_fk" FOREIGN KEY ("depends_on_resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_workspace_idx" ON "api_keys" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "api_keys_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "resource_dependencies_workspace_idx" ON "resource_dependencies" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "resource_dependencies_resource_idx" ON "resource_dependencies" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "resource_dependencies_depends_on_idx" ON "resource_dependencies" USING btree ("depends_on_resource_id");--> statement-breakpoint
CREATE INDEX "workspace_budgets_workspace_idx" ON "workspace_budgets" USING btree ("workspace_id");