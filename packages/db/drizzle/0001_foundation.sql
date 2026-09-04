CREATE TYPE "public"."change_event_type" AS ENUM('ENTITY_CREATED', 'PRODUCT_LAUNCHED', 'DEPLOYMENT_ADDED', 'CLAIM_CHANGED', 'COMMERCIAL_STAGE_CHANGED', 'MATURITY_CHANGED', 'PARTNERSHIP_ADDED', 'BENCHMARK_RESULT_ADDED', 'FUNDING_EVENT', 'SOURCE_ADDED');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('PROPOSED', 'APPROVED', 'REJECTED', 'SUPERSEDED');--> statement-breakpoint
CREATE TYPE "public"."commercial_stage" AS ENUM('CONCEPT', 'PROTOTYPE', 'PILOT_DEPLOYMENTS', 'COMMERCIAL', 'VOLUME_PRODUCTION');--> statement-breakpoint
CREATE TYPE "public"."confidence" AS ENUM('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."depth_tier" AS ENUM('ANCHOR', 'STANDARD', 'DISCOVERY');--> statement-breakpoint
CREATE TYPE "public"."embodiment" AS ENUM('HUMANOID', 'INDUSTRIAL_ARM', 'COBOT', 'AMR', 'DRONE', 'QUADRUPED', 'AUTONOMOUS_VEHICLE', 'OTHER_MOBILE');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('ORGANIZATION', 'ROBOT', 'ROBOT_FAMILY', 'COMPONENT_PRODUCT', 'SOFTWARE_PRODUCT', 'MODEL', 'TECHNOLOGY', 'MARKET', 'TASK', 'APPROACH', 'DEPLOYMENT', 'PLACE', 'BENCHMARK', 'PAPER', 'DATASET');--> statement-breakpoint
CREATE TYPE "public"."evidence_class" AS ENUM('PRIMARY', 'THIRD_PARTY', 'ACADEMIC', 'DERIVED', 'ANALYST');--> statement-breakpoint
CREATE TYPE "public"."evidence_stance" AS ENUM('SUPPORTS', 'CONFLICTS');--> statement-breakpoint
CREATE TYPE "public"."maturity" AS ENUM('RESEARCH', 'PILOT', 'EARLY_COMMERCIAL', 'SCALING', 'MATURE');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('PRODUCT_PAGE', 'DATASHEET', 'PRESS_RELEASE', 'FILING', 'PAPER', 'NEWS', 'CASE_STUDY', 'TALK', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."stack_layer" AS ENUM('INTELLIGENCE', 'PLANNING', 'PERCEPTION', 'STATE_ESTIMATION', 'CONTROL', 'COMPUTE', 'SENSORS', 'ACTUATION', 'END_EFFECTOR_PAYLOAD', 'POWER', 'MECHANICAL', 'SAFETY');--> statement-breakpoint
CREATE TABLE "embodiment_layer_labels" (
	"embodiment" "embodiment" NOT NULL,
	"layer" text NOT NULL,
	"label" text NOT NULL,
	"applies" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"short_description" text,
	"primary_embodiment" "embodiment",
	"country_code" char(2),
	"depth_tier" "depth_tier" DEFAULT 'STANDARD' NOT NULL,
	"commercial_stage" "commercial_stage",
	"height_m" double precision,
	"mass_kg" double precision,
	"payload_kg" double precision,
	"list_price_usd" double precision,
	"maturity" "maturity",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("name", '')), 'A') || setweight(to_tsvector('english', coalesce("short_description", '')), 'C')) STORED
);
--> statement-breakpoint
CREATE TABLE "entity_aliases" (
	"entity_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"normalized" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"entity_id" uuid PRIMARY KEY NOT NULL,
	"admin_region" text,
	"city" text,
	"lat" double precision,
	"lng" double precision,
	"cluster_label" text
);
--> statement-breakpoint
CREATE TABLE "claim_dependencies" (
	"derived_claim_id" uuid NOT NULL,
	"input_claim_id" uuid NOT NULL,
	CONSTRAINT "claim_dependencies_derived_claim_id_input_claim_id_pk" PRIMARY KEY("derived_claim_id","input_claim_id")
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY NOT NULL,
	"subject_entity_id" uuid NOT NULL,
	"predicate" text NOT NULL,
	"value_text" text,
	"value_number" double precision,
	"unit" text,
	"is_approximate" boolean DEFAULT false NOT NULL,
	"value_min" double precision,
	"value_max" double precision,
	"value_enum" text,
	"object_entity_id" uuid,
	"value_date" date,
	"stack_layer" "stack_layer",
	"status" "claim_status" DEFAULT 'PROPOSED' NOT NULL,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"observed_at" timestamp with time zone NOT NULL,
	"last_verified_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "claims_one_primary_value" CHECK ((("claims"."value_text" IS NOT NULL)::int + ("claims"."value_enum" IS NOT NULL)::int + ("claims"."object_entity_id" IS NOT NULL)::int + ("claims"."value_date" IS NOT NULL)::int + (("claims"."value_number" IS NOT NULL AND "claims"."object_entity_id" IS NULL)::int)) = 1),
	CONSTRAINT "claims_valid_range" CHECK ("claims"."valid_to" IS NULL OR "claims"."valid_to" >= "claims"."valid_from"),
	CONSTRAINT "claims_min_max" CHECK ("claims"."value_min" IS NULL OR "claims"."value_max" IS NULL OR "claims"."value_min" <= "claims"."value_max")
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"evidence_id" uuid PRIMARY KEY NOT NULL,
	"author" text NOT NULL,
	"rationale" text NOT NULL,
	"advance_criteria" text[] DEFAULT '{}' NOT NULL,
	"regress_criteria" text[] DEFAULT '{}' NOT NULL,
	"evidence_considered" uuid[] DEFAULT '{}' NOT NULL,
	"reviewed_at" timestamp with time zone NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY NOT NULL,
	"claim_id" uuid NOT NULL,
	"source_id" uuid,
	"evidence_class" "evidence_class" NOT NULL,
	"confidence" "confidence" NOT NULL,
	"stance" "evidence_stance" DEFAULT 'SUPPORTS' NOT NULL,
	"excerpt" text,
	"published_at" timestamp with time zone,
	"observed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "evidence_source_required" CHECK ("evidence"."evidence_class" IN ('ANALYST', 'DERIVED') OR "evidence"."source_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"canonical_url" text,
	"publisher" text,
	"title" text,
	"source_kind" "source_kind" NOT NULL,
	"published_at" timestamp with time zone,
	"language" text
);
--> statement-breakpoint
CREATE TABLE "change_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_type" "change_event_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"before_claim_id" uuid,
	"after_claim_id" uuid,
	"observed_at" timestamp with time zone NOT NULL,
	"summary" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entity_aliases" ADD CONSTRAINT "entity_aliases_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_dependencies" ADD CONSTRAINT "claim_dependencies_derived_claim_id_claims_id_fk" FOREIGN KEY ("derived_claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_dependencies" ADD CONSTRAINT "claim_dependencies_input_claim_id_claims_id_fk" FOREIGN KEY ("input_claim_id") REFERENCES "public"."claims"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_subject_entity_id_entities_id_fk" FOREIGN KEY ("subject_entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_object_entity_id_entities_id_fk" FOREIGN KEY ("object_entity_id") REFERENCES "public"."entities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_events" ADD CONSTRAINT "change_events_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_events" ADD CONSTRAINT "change_events_before_claim_id_claims_id_fk" FOREIGN KEY ("before_claim_id") REFERENCES "public"."claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_events" ADD CONSTRAINT "change_events_after_claim_id_claims_id_fk" FOREIGN KEY ("after_claim_id") REFERENCES "public"."claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "embodiment_layer_labels_pk" ON "embodiment_layer_labels" USING btree ("embodiment","layer");--> statement-breakpoint
CREATE UNIQUE INDEX "entities_slug_idx" ON "entities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "entities_type_idx" ON "entities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "entities_normalized_name_idx" ON "entities" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "entities_search_vector_idx" ON "entities" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "entities_name_trgm_idx" ON "entities" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "entity_aliases_pk" ON "entity_aliases" USING btree ("entity_id","normalized");--> statement-breakpoint
CREATE INDEX "entity_aliases_normalized_idx" ON "entity_aliases" USING btree ("normalized");--> statement-breakpoint
CREATE INDEX "entity_aliases_alias_trgm_idx" ON "entity_aliases" USING gin ("alias" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "claims_subject_predicate_idx" ON "claims" USING btree ("subject_entity_id","predicate");--> statement-breakpoint
CREATE INDEX "claims_object_idx" ON "claims" USING btree ("object_entity_id");--> statement-breakpoint
CREATE INDEX "claims_predicate_status_idx" ON "claims" USING btree ("predicate","status");--> statement-breakpoint
CREATE INDEX "evidence_claim_idx" ON "evidence" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "evidence_source_idx" ON "evidence" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "change_events_observed_idx" ON "change_events" USING btree ("observed_at");--> statement-breakpoint
CREATE INDEX "change_events_entity_idx" ON "change_events" USING btree ("entity_id");