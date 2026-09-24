CREATE TABLE "resource_cost_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"previous_amount_minor" integer,
	"new_amount_minor" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"previous_billing_cycle" varchar(20),
	"new_billing_cycle" varchar(20),
	"change_percentage_bps" integer DEFAULT 0 NOT NULL,
	"changed_by_user_id" uuid,
	"change_reason" varchar(255),
	"effective_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resource_cost_history" ADD CONSTRAINT "resource_cost_history_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_cost_history" ADD CONSTRAINT "resource_cost_history_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_cost_history" ADD CONSTRAINT "resource_cost_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resource_cost_history_resource_idx" ON "resource_cost_history" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "resource_cost_history_workspace_idx" ON "resource_cost_history" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "resource_cost_history_created_at_idx" ON "resource_cost_history" USING btree ("created_at");