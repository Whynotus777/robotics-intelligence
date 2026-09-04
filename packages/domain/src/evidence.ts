import { z } from "zod";
import { Confidence, EvidenceClass, EvidenceStance, ExtractionStatus, LicensePolicy, RefreshCadence, ReviewAction, SourceKind } from "./enums.js";

/** Canonical source identity. 0b extends this same table with operational fields. */
export const SourceRow = z.object({
  id: z.uuid(),
  url: z.url(),
  canonical_url: z.url().nullable(),
  publisher: z.string().nullable(),
  title: z.string().nullable(),
  source_kind: SourceKind,
  published_at: z.iso.datetime().nullable(),
  language: z.string().max(8).nullable(),
  license_policy: LicensePolicy,
  fetched_at: z.iso.datetime().nullable(),
  content_hash: z.string().nullable(),
  extraction_status: ExtractionStatus,
  refresh_cadence: RefreshCadence,
  next_check_at: z.iso.datetime().nullable(),
  priority: z.number().int(),
  latest_snapshot_id: z.uuid().nullable(),
});
export type SourceRow = z.infer<typeof SourceRow>;

/**
 * Evidence links a claim to a source. ANALYST and DERIVED rows have no source.
 * NOT_AVAILABLE is never stored; it is what the API reports when a claim has none.
 */
export const EvidenceRow = z
  .object({
    id: z.uuid(),
    claim_id: z.uuid(),
    source_id: z.uuid().nullable(),
    evidence_class: EvidenceClass,
    confidence: Confidence,
    stance: EvidenceStance,
    excerpt: z.string().nullable(),
    published_at: z.iso.datetime().nullable(),
    observed_at: z.iso.datetime(),
  })
  .refine(
    (e) => (e.evidence_class === "ANALYST" || e.evidence_class === "DERIVED" ? true : e.source_id !== null),
    "PRIMARY, THIRD_PARTY and ACADEMIC evidence must reference a source",
  );
export type EvidenceRow = z.infer<typeof EvidenceRow>;

/** Extension table keyed by evidence id, present for every ANALYST evidence row. */
export const AssessmentRow = z.object({
  evidence_id: z.uuid(),
  author: z.string().min(1),
  rationale: z.string().min(20),
  advance_criteria: z.array(z.string().min(1)),
  regress_criteria: z.array(z.string().min(1)),
  evidence_considered: z.array(z.uuid()),
  reviewed_at: z.iso.datetime(),
  notes: z.string().nullable(),
});
export type AssessmentRow = z.infer<typeof AssessmentRow>;

export const SourceSnapshotRow = z.object({
  id: z.uuid(),
  source_id: z.uuid(),
  fetched_at: z.iso.datetime(),
  content_hash: z.string(),
  snapshot_pointer: z.string().min(1),
});
export type SourceSnapshotRow = z.infer<typeof SourceSnapshotRow>;

export const ReviewActionRow = z.object({
  id: z.uuid(),
  claim_id: z.uuid(),
  reviewer: z.string().min(1),
  action: ReviewAction,
  acted_at: z.iso.datetime(),
  resulting_claim_id: z.uuid().nullable(),
  reason: z.string().nullable(),
});
export type ReviewActionRow = z.infer<typeof ReviewActionRow>;
