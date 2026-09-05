CREATE TYPE "public"."change_event_origin" AS ENUM('SEED', 'REVIEW');--> statement-breakpoint
ALTER TABLE "change_events" ADD COLUMN "origin" "change_event_origin" DEFAULT 'REVIEW' NOT NULL;--> statement-breakpoint
CREATE INDEX "change_events_origin_idx" ON "change_events" USING btree ("origin");
