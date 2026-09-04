import type { ClaimView, EntityResponse } from "@ri/api-contracts";
import { CANONICAL_LAYERS } from "@ri/domain";
import { SourceGlyph } from "@/components/evidence/evidence-chip";
import { EntityChipLink } from "@/components/entity-chip";
import { STACK_LAYER_LABEL, SPEC_LAYER, formatValue, sentenceCase } from "@/lib/vocabulary";

type Spec = { claim: ClaimView; label: string; layer: string | null };

export function collectSpecs(entity: EntityResponse, exclude: ReadonlySet<string>): Spec[] {
  return entity.claims
    .filter((group) => !exclude.has(group.predicate))
    .flatMap((group) =>
      group.claims
        .filter((claim) => claim.value.kind !== "text" && claim.value.kind !== "date")
        .map((claim) => ({
          claim,
          label: sentenceCase(group.label),
          layer: claim.stack_layer ?? SPEC_LAYER[group.predicate] ?? null,
        })),
    );
}

function layerRank(layer: string | null): number {
  if (!layer) return -1;
  const index = (CANONICAL_LAYERS as readonly string[]).indexOf(layer);
  return index === -1 ? CANONICAL_LAYERS.length : index;
}

/**
 * A scannable grid of label/value pairs grouped by the stack layer the spec
 * belongs to, never a long two-column table. Each value carries the quiet source
 * glyph; the evidence chip appears on hover.
 */
export function SpecGrid({ specs }: { specs: Spec[] }) {
  if (specs.length === 0) return null;
  // One flowing grid, ordered by layer, so density reads as organized.
  const ordered = [...specs].sort((a, b) => layerRank(a.layer) - layerRank(b.layer) || a.label.localeCompare(b.label));

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      {ordered.map((spec) => (
        <div key={spec.claim.claim_id} className="flex flex-col gap-1">
          <span className="text-[11px] text-ink-4">
            {spec.layer ? `${STACK_LAYER_LABEL[spec.layer] ?? spec.layer} · ` : ""}
            {spec.label}
          </span>
          <span className="flex items-center gap-1.5 text-[15px] font-medium">
            {spec.claim.value.kind === "entity" ? (
              <EntityChipLink chip={spec.claim.value.entity} />
            ) : (
              <span className={spec.claim.value.kind === "number" ? "num" : ""}>{formatValue(spec.claim.value)}</span>
            )}
            <SourceGlyph summary={spec.claim.evidence_summary} claimId={spec.claim.claim_id} />
          </span>
        </div>
      ))}
    </div>
  );
}
