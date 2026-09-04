CREATE TYPE "public"."claim_origin" AS ENUM('MANUAL', 'EXTRACTED', 'DERIVED');--> statement-breakpoint
CREATE TYPE "public"."license_policy" AS ENUM('VERBATIM_OK', 'SUMMARY_ONLY', 'LINK_ONLY');--> statement-breakpoint
CREATE TYPE "public"."extraction_status" AS ENUM('PENDING', 'EXTRACTED', 'UNCHANGED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."refresh_cadence" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL', 'NEVER');--> statement-breakpoint
CREATE TYPE "public"."review_action" AS ENUM('APPROVE', 'EDIT', 'REJECT');--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "origin" "claim_origin" DEFAULT 'MANUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "license_policy" "license_policy" DEFAULT 'LINK_ONLY' NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "content_hash" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "extraction_status" "extraction_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "refresh_cadence" "refresh_cadence" DEFAULT 'MANUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "next_check_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "latest_snapshot_id" uuid;--> statement-breakpoint
CREATE TABLE "source_snapshots" (
  "id" uuid PRIMARY KEY NOT NULL,
  "source_id" uuid NOT NULL,
  "fetched_at" timestamp with time zone NOT NULL,
  "content_hash" text NOT NULL,
  "snapshot_pointer" text NOT NULL
);--> statement-breakpoint
CREATE TABLE "review_actions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "claim_id" uuid NOT NULL,
  "reviewer" text NOT NULL,
  "action" "review_action" NOT NULL,
  "acted_at" timestamp with time zone NOT NULL,
  "resulting_claim_id" uuid,
  "reason" text
);--> statement-breakpoint
CREATE TABLE "external_ids" (
  "entity_id" uuid NOT NULL,
  "system" text NOT NULL,
  "external_id" text NOT NULL
);--> statement-breakpoint
ALTER TABLE "source_snapshots" ADD CONSTRAINT "source_snapshots_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_latest_snapshot_id_source_snapshots_id_fk" FOREIGN KEY ("latest_snapshot_id") REFERENCES "public"."source_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_actions" ADD CONSTRAINT "review_actions_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_actions" ADD CONSTRAINT "review_actions_resulting_claim_id_claims_id_fk" FOREIGN KEY ("resulting_claim_id") REFERENCES "public"."claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_ids" ADD CONSTRAINT "external_ids_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_snapshots_source_idx" ON "source_snapshots" USING btree ("source_id","fetched_at");--> statement-breakpoint
CREATE INDEX "review_actions_claim_idx" ON "review_actions" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "review_actions_result_idx" ON "review_actions" USING btree ("resulting_claim_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_ids_system_id_idx" ON "external_ids" USING btree ("system","external_id");--> statement-breakpoint
CREATE INDEX "external_ids_entity_idx" ON "external_ids" USING btree ("entity_id");
