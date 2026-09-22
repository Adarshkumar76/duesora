CREATE TABLE "workspace_notification_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"provider" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"webhook_url" varchar(2048) NOT NULL,
	"events" text DEFAULT '["*"]' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_notification_channels" ADD CONSTRAINT "workspace_notification_channels_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_notification_channels_workspace_idx" ON "workspace_notification_channels" USING btree ("workspace_id");