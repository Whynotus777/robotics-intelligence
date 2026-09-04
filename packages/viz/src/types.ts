import type { EntityChip, EvidenceSummary } from "@ri/api-contracts";

/** Additional, already-resolved display data a composition layer may optionally provide. */
export type ExploreEntityMeta = {
  description?: string | null;
  stage_or_maturity?: string | null;
  evidence_summary?: EvidenceSummary | null;
};

export type OpenEntity = (entity: EntityChip) => void;

export function evidenceLabel(summary: EvidenceSummary) {
  if (summary.class === "NOT_AVAILABLE") return "No evidence";
  return `${summary.class.replace("_", " ")} · ${summary.confidence ?? ""}`.trim();
}
