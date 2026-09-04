"use client";

import type { EvidenceSummary } from "@ri/api-contracts";
import { useEvidence } from "@/components/evidence/evidence-store";
import { CONFIDENCE_LABEL, EVIDENCE_CLASS_LABEL } from "@/lib/vocabulary";

/**
 * Evidence visibility rule: the chip is visible by default only in the
 * intelligence rail, the drawer, Updates, and next to an analyst assessment.
 * Everywhere else a value carries the quiet 5px source glyph and reveals the
 * chip on hover. The ANALYST marker is the deliberate exception — always inline.
 */

function classMark(evidenceClass: string) {
  if (evidenceClass === "ANALYST")
    return <i className="inline-block size-1.5 rotate-45 bg-analyst" />;
  if (evidenceClass === "DERIVED")
    return <i className="box-border inline-block size-[5px] border border-ink-3" />;
  if (evidenceClass === "NOT_AVAILABLE")
    return <i className="box-border inline-block size-[5px] border border-ink-4" />;
  return <i className="inline-block size-[5px] bg-ink-3" />;
}

export function chipText(summary: EvidenceSummary): string {
  const label = EVIDENCE_CLASS_LABEL[summary.class] ?? summary.class;
  return summary.confidence ? `${label} · ${CONFIDENCE_LABEL[summary.confidence]}` : label;
}

export function AnalystMarker({ label }: { label?: string }) {
  return (
    <span className="num inline-flex items-center gap-1.5 rounded-[3px] border border-analyst/35 bg-analyst/10 px-1.5 py-[3px] text-[10px] leading-none font-semibold tracking-[0.06em] text-analyst">
      <i className="inline-block size-1.5 rotate-45 bg-analyst" />
      {label ?? "ANALYST"}
    </span>
  );
}

/** The visible chip. Clicking it opens the drawer on that claim. */
export function EvidenceChip({
  summary,
  claimId,
  suffix,
}: {
  summary: EvidenceSummary;
  claimId?: string;
  suffix?: string;
}) {
  const { open } = useEvidence();
  const analyst = summary.class === "ANALYST";
  const body = (
    <>
      {classMark(summary.class)}
      {chipText(summary)}
      {suffix ? <span className="text-ink-4">· {suffix}</span> : null}
    </>
  );
  const className = analyst
    ? "num inline-flex items-center gap-1.5 rounded-[3px] border border-analyst/35 bg-analyst/10 px-1.5 py-[3px] text-[10px] leading-none font-semibold tracking-[0.06em] text-analyst"
    : "num inline-flex items-center gap-1.5 rounded-[3px] border border-line-strong px-1.5 py-[3px] text-[10px] leading-none font-medium tracking-[0.04em] text-ink-3";

  if (!claimId) return <span className={className}>{body}</span>;
  return (
    <button type="button" onClick={() => open(claimId)} className={`${className} cursor-pointer hover:text-ink`}>
      {body}
    </button>
  );
}

/**
 * The quiet form: a source glyph beside a value. Hover reveals the chip, click
 * opens the drawer. Absence of evidence renders nothing at all — never "unknown".
 */
export function SourceGlyph({
  summary,
  claimId,
  align = "left",
}: {
  summary: EvidenceSummary | null | undefined;
  claimId?: string;
  align?: "left" | "right";
}) {
  const { open } = useEvidence();
  if (!summary || summary.class === "NOT_AVAILABLE") return null;
  const analyst = summary.class === "ANALYST";
  if (analyst) return <AnalystMarker />;

  return (
    <span className="group relative inline-flex items-center align-middle">
      <button
        type="button"
        aria-label={`How we know: ${chipText(summary)}`}
        onClick={claimId ? () => open(claimId) : undefined}
        className="inline-flex size-3 cursor-pointer items-center justify-center"
      >
        <i className="inline-block size-[5px] bg-ink-4 transition-colors group-hover:bg-accent" />
      </button>
      <span
        className={`num pointer-events-none absolute bottom-full z-20 mb-1 hidden whitespace-nowrap rounded-[3px] border border-line-strong bg-panel px-[7px] py-1 text-[10px] leading-none font-medium tracking-[0.04em] text-ink-3 shadow-[0_6px_16px_rgba(0,0,0,.4)] group-hover:block ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        {chipText(summary)}
        {summary.source_count > 0 ? (
          <span className="text-ink-4"> · {summary.source_count} source{summary.source_count === 1 ? "" : "s"}</span>
        ) : null}
      </span>
    </span>
  );
}

/** A plain text affordance that opens the drawer — used where a chip would shout. */
export function OpenEvidence({ claimId, children }: { claimId: string; children: React.ReactNode }) {
  const { open } = useEvidence();
  return (
    <button
      type="button"
      onClick={() => open(claimId)}
      className="w-fit cursor-pointer text-left text-[12px] text-accent hover:underline"
    >
      {children}
    </button>
  );
}
