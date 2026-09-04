import { z } from "zod";
import {
  CANONICAL_LAYERS,
  ClaimStatus,
  Confidence,
  CountryCode,
  DepthTier,
  Embodiment,
  EntityType,
  EvidenceClass,
  EvidenceStance,
  IsoDate,
  PREDICATE_NAMES,
  Slug,
  SourceKind,
  StackLayer,
  Unit,
} from "@ri/domain";

// The human-editable YAML shape. One file per entity; claims inline with their evidence.

export const ClaimRef = z.string().regex(/^[a-z0-9-]+:[A-Z_]+(#\d+)?$/, "claim ref is slug:PREDICATE or slug:PREDICATE#n");

export const SeedAssessment = z.object({
  author: z.string().default("editorial"),
  rationale: z.string().min(20),
  advance_criteria: z.array(z.string()).default([]),
  regress_criteria: z.array(z.string()).default([]),
  evidence_considered: z.array(ClaimRef).default([]),
  reviewed_at: IsoDate.optional(),
  notes: z.string().optional(),
});

export const SeedEvidence = z.object({
  class: EvidenceClass,
  confidence: Confidence,
  source: z.string().optional(),
  stance: EvidenceStance.default("SUPPORTS"),
  excerpt: z.string().optional(),
  published_at: IsoDate.optional(),
  observed_at: IsoDate.optional(),
  assessment: SeedAssessment.optional(),
});

export const SeedClaim = z.object({
  key: z.string().regex(/^[A-Z_]+(#\d+)?$/).optional(),
  predicate: z.enum(PREDICATE_NAMES as [string, ...string[]]),
  text: z.string().optional(),
  number: z.number().optional(),
  unit: Unit.optional(),
  approximate: z.boolean().default(false),
  min: z.number().optional(),
  max: z.number().optional(),
  enum: z.string().optional(),
  object: Slug.optional(),
  date: IsoDate.optional(),
  stack_layer: StackLayer.optional(),
  status: ClaimStatus.default("APPROVED"),
  valid_from: IsoDate.optional(),
  valid_to: IsoDate.optional(),
  observed_at: IsoDate.optional(),
  last_verified_at: IsoDate.optional(),
  depends_on: z.array(ClaimRef).default([]),
  evidence: z.array(SeedEvidence).default([]),
});
export type SeedClaim = z.infer<typeof SeedClaim>;

export const SeedPlace = z.object({
  admin_region: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  cluster_label: z.string().optional(),
});

export const SeedEntity = z.object({
  slug: Slug,
  entity_type: EntityType,
  name: z.string().min(1),
  short_description: z.string().optional(),
  primary_embodiment: Embodiment.optional(),
  country_code: CountryCode.optional(),
  depth_tier: DepthTier.default("STANDARD"),
  aliases: z.array(z.string()).default([]),
  place: SeedPlace.optional(),
  claims: z.array(SeedClaim).default([]),
});
export type SeedEntity = z.infer<typeof SeedEntity>;

export const SeedSource = z.object({
  key: z.string().min(1),
  url: z.url(),
  canonical_url: z.url().optional(),
  publisher: z.string().optional(),
  title: z.string().optional(),
  source_kind: SourceKind,
  published_at: IsoDate.optional(),
  language: z.string().default("en"),
});
export type SeedSource = z.infer<typeof SeedSource>;

export const SeedChangeEvent = z.object({
  key: z.string().min(1),
  event_type: z.string(),
  entity: Slug,
  before: ClaimRef.optional(),
  after: ClaimRef.optional(),
  observed_at: IsoDate,
  summary: z.string().min(1),
});
export type SeedChangeEvent = z.infer<typeof SeedChangeEvent>;

/** embodiment → canonical layer → label (null = layer does not apply). */
export const SeedLayerLabels = z.record(Embodiment, z.record(z.enum(CANONICAL_LAYERS), z.string().nullable()));
