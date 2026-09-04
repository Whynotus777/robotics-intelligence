import Link from "next/link";
import type { EntityResponse } from "@ri/api-contracts";
import { EVIDENCE_CLASSES } from "@ri/domain";
import { EvidenceChip } from "@/components/evidence/evidence-chip";
import { formatDate } from "@/lib/vocabulary";

/**
 * The intelligence panel — one of the few places evidence is visible without
 * hovering. Rows with nothing to report are omitted; nothing here prints "0".
 */
export function IntelligenceRail({ entity }: { entity: EntityResponse }) {
  const { intelligence } = entity;
  const byClass = EVIDENCE_CLASSES.map((evidenceClass) => ({
    evidenceClass,
    count: intelligence.evidence_summary.by_class[evidenceClass] ?? 0,
  })).filter((row) => row.count > 0);
  const total = byClass.reduce((sum, row) => sum + row.count, 0);

  const facts: { label: string; value: string; href?: string }[] = [];
  if (intelligence.last_verified_at)
    facts.push({ label: "Last checked", value: formatDate(intelligence.last_verified_at) });
  if (intelligence.recent_change_count > 0)
    facts.push({ label: "Recent changes", value: `${intelligence.recent_change_count} · timeline →`, href: "/updates" });
  if (intelligence.deployment_count > 0)
    facts.push({ label: "Known deployments", value: String(intelligence.deployment_count) });
  if (intelligence.related_count > 0)
    facts.push({ label: "Related entities", value: String(intelligence.related_count) });

  if (byClass.length === 0 && facts.length === 0) return null;

  return (
    <aside className="flex flex-col gap-3.5 self-start rounded-panel border border-line-soft bg-panel-deep p-4 max-lg:order-last">
      <div className="eyebrow">How we know</div>

      {byClass.length > 0 ? (
        <div className="flex flex-col gap-2">
          {byClass.map((row) => (
            <div key={row.evidenceClass} className="flex items-center justify-between gap-2 text-[12px] text-ink-2">
              <EvidenceChip summary={{ class: row.evidenceClass, confidence: null, source_count: row.count }} />
              <span className="num text-[12px] font-medium">
                {row.count} claim{row.count === 1 ? "" : "s"}
              </span>
            </div>
          ))}
          <div className="flex h-1 gap-0.5 overflow-hidden rounded-[2px]">
            {byClass.map((row) => (
              <i
                key={row.evidenceClass}
                style={{ flex: row.count }}
                className={row.evidenceClass === "ANALYST" ? "bg-analyst" : "bg-ink-3"}
              />
            ))}
          </div>
          {intelligence.evidence_summary.claims_without_evidence > 0 ? (
            <span className="num text-[10px] text-ink-4">
              {intelligence.evidence_summary.claims_without_evidence} of {total + intelligence.evidence_summary.claims_without_evidence} claims
              carry no source yet
            </span>
          ) : null}
        </div>
      ) : null}

      {facts.length > 0 ? (
        <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-t border-line-soft pt-3 text-[12px] text-ink-3">
          {facts.map((fact) => (
            <div key={fact.label} className="contents">
              <dt>{fact.label}</dt>
              <dd className="num text-ink">
                {fact.href ? (
                  <Link href={fact.href} className="text-accent hover:underline">
                    {fact.value}
                  </Link>
                ) : (
                  fact.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </aside>
  );
}
