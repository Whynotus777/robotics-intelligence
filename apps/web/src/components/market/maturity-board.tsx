import Link from "next/link";
import type { MarketResponse } from "@ri/api-contracts";
import { MaturitySteps } from "@/components/maturity";
import { EvidenceChip } from "@/components/evidence/evidence-chip";
import { MATURITIES, type Maturity } from "@ri/domain";
import { MATURITY_LABEL } from "@/lib/vocabulary";

/**
 * The task maturity board — the signature visual. Every maturity value is an
 * analyst assessment, carries the marker, and opens the drawer to its rationale.
 * A task with an assessment but no vendors still renders: that is a finding.
 */
export function MaturityBoard({
  board,
  activeSlug,
}: {
  board: MarketResponse["board"];
  activeSlug?: string;
}) {
  if (board.length === 0) return null;

  // Most mature first: the board should read top-down as "how real is this".
  const rank = (maturity: Maturity | null) => (maturity ? MATURITIES.indexOf(maturity) : -1);
  const rows = [...board].sort(
    (a, b) => rank(b.maturity) - rank(a.maturity) || a.task.name.localeCompare(b.task.name),
  );

  return (
    <div className="overflow-x-auto rounded-panel border border-line-soft">
      <table className="w-full min-w-[720px] border-collapse text-[12px]">
        <thead>
          <tr className="bg-panel-deep text-left">
            <Th>Task</Th>
            <Th>Maturity</Th>
            <Th>Dominant approach</Th>
            <Th align="right">Vendors</Th>
            <Th align="right">Deployed</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const active = row.task.slug === activeSlug;
            return (
              <tr
                key={row.task.id}
                className={`border-t border-line-soft ${active ? "bg-[#13151b]" : ""}`}
                style={active ? { boxShadow: "inset 2px 0 0 var(--color-accent)" } : undefined}
              >
                <td className="px-3.5 py-2.5">
                  <Link
                    href={`/t/${row.task.slug}`}
                    className={`hover:text-accent ${active ? "font-semibold text-ink" : "text-ink-2"}`}
                  >
                    {row.task.name}
                  </Link>
                </td>
                <td className="px-3.5 py-2.5">
                  {row.maturity ? (
                    <span className="flex items-center gap-2">
                      <MaturitySteps maturity={row.maturity} />
                      <span className="font-medium text-ink">{MATURITY_LABEL[row.maturity]}</span>
                      <EvidenceChip
                        summary={{ class: "ANALYST", confidence: null, source_count: 0 }}
                        claimId={row.maturity_claim_id ?? undefined}
                      />
                    </span>
                  ) : null}
                </td>
                <td className="px-3.5 py-2.5">
                  {row.dominant_approach ? (
                    <Link
                      href={`/e/${row.dominant_approach.slug}`}
                      className="inline-block rounded-[3px] border border-line bg-raised px-[7px] py-[3px] text-[11px] text-ink-2 hover:border-line-strong hover:text-ink"
                    >
                      {row.dominant_approach.name}
                    </Link>
                  ) : null}
                </td>
                <td className="num px-3.5 py-2.5 text-right text-ink-2">
                  {row.vendor_count > 0 ? row.vendor_count : null}
                </td>
                <td className="num px-3.5 py-2.5 text-right text-ink-2">
                  {row.deployment_count > 0 ? row.deployment_count : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`eyebrow px-3.5 py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}
      scope="col"
    >
      {children}
    </th>
  );
}
