CREATE TYPE "public"."resource_status" AS ENUM('active', 'inactive', 'expired', 'archived');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('domain', 'ssl_certificate', 'subscription', 'hosting', 'cloud_service', 'software_license', 'contract', 'warranty', 'document', 'custom');--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" "resource_type" NOT NULL,
	"status" "resource_status" DEFAULT 'active' NOT NULL,
	"description" text,
	"provider" varchar(120),
	"website_url" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;