CREATE TABLE "workspace_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"monthly_budget_minor" integer,
	"annual_budget_minor" integer,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"alert_threshold_pct" integer DEFAULT 80 NOT NULL,
	"alert_emails_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_budgets_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
ALTER TABLE "workspace_budgets" ADD CONSTRAINT "workspace_budgets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_budgets_workspace_id_idx" ON "workspace_budgets" USING btree ("workspace_id");