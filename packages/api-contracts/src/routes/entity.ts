import { z } from "zod";
import { CommercialStage, Embodiment, EntityType, EvidenceClass, Maturity, StackLayer } from "@ri/domain";
import { AsOfQuery, ClaimView, EntityChip, EvidenceSummary, IsoDate } from "../common.js";

// GET /entities/:slug

export const EntityParams = z.object({ slug: z.string() });
export const EntityQuery = AsOfQuery;

export const RelationshipItem = z.object({
  claim_id: z.uuid(),
  target: EntityChip,
  stack_layer: StackLayer.nullable(),
  valid_from: IsoDate,
  has_evidence: z.boolean(),
  evidence_summary: EvidenceSummary,
});

export const InboundRelationshipItem = z.object({
  claim_id: z.uuid(),
  source: EntityChip,
  stack_layer: StackLayer.nullable(),
  valid_from: IsoDate,
  has_evidence: z.boolean(),
  evidence_summary: EvidenceSummary,
});

/** Lateral exits ("Explore from here"). Keys are omitted when empty. */
export const LateralLinks = z.object({
  categories: z.array(EntityChip).optional(),
  company: z.array(EntityChip).optional(),
  technologies: z.array(EntityChip).optional(),
  markets: z.array(EntityChip).optional(),
  places: z.array(EntityChip).optional(),
  peers: z.array(EntityChip).optional(),
});

export const IntelligenceRail = z.object({
  evidence_summary: z.object({
    by_class: z.record(EvidenceClass, z.number().int().nonnegative()),
    claim_count: z.number().int().nonnegative(),
    claims_without_evidence: z.number().int().nonnegative(),
  }),
  last_verified_at: z.iso.datetime().nullable(),
  recent_change_count: z.number().int().nonnegative(),
  deployment_count: z.number().int().nonnegative(),
  related_count: z.number().int().nonnegative(),
});

export const EntityResponse = z.object({
  entity: z.object({
    id: z.uuid(),
    slug: z.string(),
    entity_type: EntityType,
    name: z.string(),
    short_description: z.string().nullable(),
    primary_embodiment: Embodiment.nullable(),
    country_code: z.string().nullable(),
    aliases: z.array(z.string()),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
  }),
  cached: z.object({
    commercial_stage: CommercialStage.nullable(),
    height_m: z.number().nullable(),
    mass_kg: z.number().nullable(),
    payload_kg: z.number().nullable(),
    list_price_usd: z.number().nullable(),
    maturity: Maturity.nullable(),
  }),
  place: z
    .object({
      admin_region: z.string().nullable(),
      city: z.string().nullable(),
      lat: z.number().nullable(),
      lng: z.number().nullable(),
      cluster_label: z.string().nullable(),
    })
    .nullable(),
  /** Scalar claims grouped by predicate. Empty groups are omitted. */
  claims: z.array(z.object({ predicate: z.string(), label: z.string(), claims: z.array(ClaimView) })),
  /** Outbound relationships grouped by predicate. Empty groups are omitted. */
  relationships: z.array(z.object({ predicate: z.string(), label: z.string(), items: z.array(RelationshipItem) })),
  /** Inbound relationships (e.g. ORGANIZATION BUILDS this robot). */
  inbound_relationships: z.array(
    z.object({ predicate: z.string(), label: z.string(), items: z.array(InboundRelationshipItem) }),
  ),
  lateral_links: LateralLinks,
  intelligence: IntelligenceRail,
  as_of: IsoDate.nullable(),
});
export type EntityResponse = z.infer<typeof EntityResponse>;
