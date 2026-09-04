import { z } from "zod";
import {
  ClaimStatus,
  Confidence,
  Embodiment,
  EntityType,
  EvidenceClass,
  EvidenceClassOrNotAvailable,
  EvidenceStance,
  IsoDate,
  SourceKind,
  StackLayer,
  Unit,
} from "@ri/domain";

/** The clickable identity of an entity, used everywhere an entity is referenced. */
export const EntityChip = z.object({
  id: z.uuid(),
  slug: z.string(),
  entity_type: EntityType,
  name: z.string(),
  primary_embodiment: Embodiment.nullable(),
});
export type EntityChip = z.infer<typeof EntityChip>;

/**
 * Strongest evidence on a claim. class NOT_AVAILABLE (confidence null, source_count 0)
 * is what the API reports when a claim has no evidence; it is never stored.
 */
export const EvidenceSummary = z.object({
  class: EvidenceClassOrNotAvailable,
  confidence: Confidence.nullable(),
  source_count: z.number().int().nonnegative(),
});
export type EvidenceSummary = z.infer<typeof EvidenceSummary>;

export const ClaimValue = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({
    kind: z.literal("number"),
    number: z.number(),
    unit: Unit,
    is_approximate: z.boolean(),
    min: z.number().nullable(),
    max: z.number().nullable(),
  }),
  z.object({ kind: z.literal("enum"), value: z.string() }),
  z.object({
    kind: z.literal("entity"),
    entity: EntityChip,
    measure: z.object({ number: z.number(), unit: Unit }).nullable(),
  }),
  z.object({ kind: z.literal("date"), date: IsoDate }),
]);
export type ClaimValue = z.infer<typeof ClaimValue>;

export const ClaimView = z.object({
  claim_id: z.uuid(),
  predicate: z.string(),
  value: ClaimValue,
  stack_layer: StackLayer.nullable(),
  valid_from: IsoDate,
  valid_to: IsoDate.nullable(),
  observed_at: z.iso.datetime(),
  last_verified_at: z.iso.datetime(),
  has_evidence: z.boolean(),
  evidence_summary: EvidenceSummary,
});
export type ClaimView = z.infer<typeof ClaimView>;

/** A text claim rendered as a list item (blockers, customer types, requirements ...). */
export const TextItem = z.object({
  claim_id: z.uuid(),
  text: z.string(),
  evidence_summary: EvidenceSummary,
  assessment: z.lazy(() => AssessmentView).nullable(),
});
export type TextItem = z.infer<typeof TextItem>;

export const ClaimRef = z.object({ claim_id: z.uuid(), sentence: z.string() });

/** The analyst argument behind an ANALYST evidence row. */
export const AssessmentView = z.object({
  author: z.string(),
  rationale: z.string(),
  advance_criteria: z.array(z.string()),
  regress_criteria: z.array(z.string()),
  evidence_considered: z.array(ClaimRef),
  reviewed_at: z.iso.datetime(),
  notes: z.string().nullable(),
});
export type AssessmentView = z.infer<typeof AssessmentView>;

export const SourceView = z.object({
  id: z.uuid(),
  url: z.string(),
  canonical_url: z.string().nullable(),
  publisher: z.string().nullable(),
  title: z.string().nullable(),
  source_kind: SourceKind,
  published_at: z.iso.datetime().nullable(),
  language: z.string().nullable(),
});
export type SourceView = z.infer<typeof SourceView>;

export const EvidenceView = z.object({
  id: z.uuid(),
  class: EvidenceClass,
  confidence: Confidence,
  stance: EvidenceStance,
  excerpt: z.string().nullable(),
  published_at: z.iso.datetime().nullable(),
  observed_at: z.iso.datetime(),
  source: SourceView.nullable(),
  assessment: AssessmentView.nullable(),
});
export type EvidenceView = z.infer<typeof EvidenceView>;

export const AsOfQuery = z.object({ as_of: IsoDate.optional() });
export type AsOfQuery = z.infer<typeof AsOfQuery>;

export { ClaimStatus, IsoDate };
