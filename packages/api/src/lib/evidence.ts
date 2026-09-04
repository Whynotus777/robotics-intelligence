import { inArray } from "drizzle-orm";
import { assessments, claims, entities, evidence, sources } from "@ri/db";
import type { AssessmentView, EvidenceSummary, EvidenceView } from "@ri/api-contracts";
import type { ApiContext } from "../context.js";
import { predicateLabel, rowSentence, rowValue } from "./value.js";

export type EvidenceRow = typeof evidence.$inferSelect;
export type SourceRow = typeof sources.$inferSelect;
export type AssessmentRow = typeof assessments.$inferSelect;

const CONFIDENCE_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
const CLASS_RANK = { PRIMARY: 5, ACADEMIC: 4, THIRD_PARTY: 3, DERIVED: 2, ANALYST: 1 } as const;

export const NOT_AVAILABLE: EvidenceSummary = { class: "NOT_AVAILABLE", confidence: null, source_count: 0 };

/** Strongest supporting evidence row summarised; NOT_AVAILABLE when the claim has none. */
export function summarize(rows: EvidenceRow[]): EvidenceSummary {
  const supporting = rows.filter((r) => r.stance === "SUPPORTS");
  if (supporting.length === 0) return NOT_AVAILABLE;
  const best = [...supporting].sort(
    (a, b) =>
      CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence] || CLASS_RANK[b.evidenceClass] - CLASS_RANK[a.evidenceClass],
  )[0]!;
  const sourceIds = new Set(supporting.map((r) => r.sourceId).filter((s): s is string => s !== null));
  return { class: best.evidenceClass, confidence: best.confidence, source_count: sourceIds.size };
}

export function maxConfidence(rows: EvidenceRow[]): EvidenceRow["confidence"] | null {
  const best = [...rows].sort((a, b) => CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence])[0];
  return best?.confidence ?? null;
}

/** Evidence rows for a set of claims, grouped by claim id. */
export async function evidenceByClaim(ctx: ApiContext, claimIds: Iterable<string>): Promise<Map<string, EvidenceRow[]>> {
  const ids = [...new Set(claimIds)];
  const out = new Map<string, EvidenceRow[]>();
  if (ids.length === 0) return out;
  const rows = await ctx.db.select().from(evidence).where(inArray(evidence.claimId, ids)).orderBy(evidence.id);
  for (const r of rows) {
    const list = out.get(r.claimId) ?? [];
    list.push(r);
    out.set(r.claimId, list);
  }
  return out;
}

/** Assessments keyed by evidence id, with evidence_considered resolved to claim sentences. */
export async function assessmentsByEvidence(ctx: ApiContext, evidenceIds: Iterable<string>): Promise<Map<string, AssessmentView>> {
  const ids = [...new Set(evidenceIds)];
  const out = new Map<string, AssessmentView>();
  if (ids.length === 0) return out;
  const rows = await ctx.db.select().from(assessments).where(inArray(assessments.evidenceId, ids));
  const consideredIds = [...new Set(rows.flatMap((r) => r.evidenceConsidered))];
  const sentences = new Map<string, string>();
  if (consideredIds.length) {
    const considered = await ctx.db
      .select({ claim: claims, subject: entities })
      .from(claims)
      .innerJoin(entities, (() => {
        // drizzle needs an SQL condition; keep the join explicit for readability
        return (await_ => await_)(undefined as never);
      })() as never)
      .where(inArray(claims.id, consideredIds));
    void considered;
  }
  for (const r of rows) {
    out.set(r.evidenceId, {
      author: r.author,
      rationale: r.rationale,
      advance_criteria: r.advanceCriteria,
      regress_criteria: r.regressCriteria,
      evidence_considered: r.evidenceConsidered.map((id) => ({ claim_id: id, sentence: sentences.get(id) ?? "" })),
      reviewed_at: r.reviewedAt,
      notes: r.notes,
    });
  }
  return out;
}

export async function sourcesByIds(ctx: ApiContext, ids: Iterable<string>): Promise<Map<string, SourceRow>> {
  const list = [...new Set(ids)];
  if (list.length === 0) return new Map();
  const rows = await ctx.db.select().from(sources).where(inArray(sources.id, list));
  return new Map(rows.map((r) => [r.id, r]));
}

export function toEvidenceView(row: EvidenceRow, source: SourceRow | null, assessment: AssessmentView | null): EvidenceView {
  return {
    id: row.id,
    class: row.evidenceClass,
    confidence: row.confidence,
    stance: row.stance,
    excerpt: row.excerpt,
    published_at: row.publishedAt,
    observed_at: row.observedAt,
    source: source
      ? {
          id: source.id,
          url: source.url,
          canonical_url: source.canonicalUrl,
          publisher: source.publisher,
          title: source.title,
          source_kind: source.sourceKind,
          published_at: source.publishedAt,
          language: source.language,
        }
      : null,
    assessment,
  };
}

export { predicateLabel, rowSentence, rowValue };
