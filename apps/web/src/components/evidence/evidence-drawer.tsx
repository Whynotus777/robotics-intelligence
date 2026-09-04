"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AssessmentView, ClaimEvidenceResponse, EvidenceView } from "@ri/api-contracts";
import type { Maturity } from "@ri/domain";
import { TypeGlyph } from "@/components/glyph";
import { AnalystMarker, EvidenceChip, chipText } from "@/components/evidence/evidence-chip";
import { useEvidence } from "@/components/evidence/evidence-store";
import { MaturitySteps } from "@/components/maturity";
import {
  CONFIDENCE_LABEL,
  EVIDENCE_CLASS_LABEL,
  MATURITY_LABEL,
  SOURCE_KIND_LABEL,
  formatDate,
  formatValue,
  hrefFor,
  nextMaturity,
} from "@/lib/vocabulary";

type State =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; payload: ClaimEvidenceResponse };

/** The Evidence Drawer: 420px, right side, parent view still visible. */
export function EvidenceDrawer() {
  const { claimId, close } = useEvidence();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!claimId) return;
    let live = true;
    setState({ status: "loading" });
    fetch(`/api/claims/${claimId}/evidence`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((payload: ClaimEvidenceResponse) => live && setState({ status: "ready", payload }))
      .catch(() => live && setState({ status: "missing" }));
    return () => {
      live = false;
    };
  }, [claimId]);

  useEffect(() => {
    if (!claimId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [claimId, close]);

  if (!claimId) return null;

  const assessment =
    state.status === "ready"
      ? (state.payload.evidence.find((row) => row.assessment)?.assessment ?? null)
      : null;

  return (
    <>
      <div
        role="presentation"
        onClick={close}
        className="fixed inset-0 z-40 bg-black/45 motion-safe:animate-[fade_.15s_ease-out]"
      />
      <aside
        aria-label="Evidence"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col overflow-y-auto border-l border-line-strong bg-panel shadow-[0_0_60px_rgba(0,0,0,.6)]"
      >
        <header className="flex items-center justify-between border-b border-line-soft px-5 py-3">
          <span className="eyebrow">Evidence · {assessment ? "Assessment" : "Fact"}</span>
          <button
            type="button"
            onClick={close}
            className="num cursor-pointer rounded-[3px] border border-line-strong px-1.5 py-[3px] text-[10px] text-ink-4 hover:text-ink"
          >
            Esc
          </button>
        </header>

        {state.status === "loading" ? <DrawerLoading /> : null}
        {state.status === "missing" ? <DrawerMissing /> : null}
        {state.status === "ready" ? (
          assessment ? (
            <AssessmentBody payload={state.payload} assessment={assessment} />
          ) : (
            <FactBody payload={state.payload} />
          )
        ) : null}
      </aside>
    </>
  );
}

function DrawerLoading() {
  return (
    <div className="flex flex-col gap-3 p-5" aria-busy>
      {[70, 100, 100, 45].map((width, index) => (
        <span
          key={index}
          className="h-3 rounded-[3px] bg-line-soft motion-safe:animate-pulse"
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  );
}

function DrawerMissing() {
  return (
    <div className="flex flex-col gap-2 p-5">
      <span className="num inline-flex w-fit items-center gap-1.5 rounded-[3px] border border-line-strong px-1.5 py-[3px] text-[10px] leading-none tracking-[0.04em] text-ink-4">
        <i className="box-border inline-block size-[5px] border border-ink-4" />
        NOT AVAILABLE
      </span>
      <p className="text-[13px]/[1.65] text-ink-3">
        No evidence is recorded for this claim yet. It is shown here rather than on the page, because the page states
        only what is known.
      </p>
    </div>
  );
}

function Subject({ payload }: { payload: ClaimEvidenceResponse }) {
  const { subject } = payload.claim;
  return (
    <Link href={hrefFor(subject)} className="flex items-center gap-2 text-[13px] font-semibold hover:text-accent">
      <TypeGlyph chip={subject} />
      {subject.name}
      <span className="num text-[10px] font-normal text-ink-4">{subject.entity_type}</span>
    </Link>
  );
}

function FactBody({ payload }: { payload: ClaimEvidenceResponse }) {
  const { claim, evidence, history, corroboration, dependencies } = payload;
  const strongest = evidence[0];
  const conflicting = corroboration === "CONFLICTING";

  return (
    <div className="flex flex-col gap-5 p-5">
      <Subject payload={payload} />
      <p className="text-[15px]/[1.5] text-ink">{claim.sentence}</p>

      <div className="flex flex-wrap items-center gap-2">
        {strongest ? (
          <EvidenceChip
            summary={{ class: strongest.class, confidence: strongest.confidence, source_count: evidence.length }}
          />
        ) : (
          <EvidenceChip summary={{ class: "NOT_AVAILABLE", confidence: null, source_count: 0 }} />
        )}
        {conflicting ? <span className="text-[11px] text-conflict">sources disagree</span> : null}
      </div>

      {evidence.length === 0 ? (
        <p className="text-[13px]/[1.65] text-ink-3">No evidence is recorded for this claim yet.</p>
      ) : null}

      {evidence.map((row) => (
        <EvidenceRow key={row.id} row={row} showClass={evidence.length > 1} />
      ))}

      {dependencies.length > 0 ? (
        <section className="flex flex-col gap-2 border-t border-line-soft pt-4">
          <span className="eyebrow">Derived from</span>
          {dependencies.map((dependency) => (
            <span key={dependency.claim_id} className="text-[12px] text-ink-2">
              {dependency.sentence}
            </span>
          ))}
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="flex flex-col gap-2 border-t border-line-soft pt-4">
          <span className="eyebrow">Change history</span>
          {history.map((row) => (
            <div key={row.claim_id} className="flex items-baseline justify-between gap-3 text-[12px] text-ink-2">
              <span className="num text-ink">{formatValue(row.value)}</span>
              <span className="num text-[11px] text-ink-4">
                {formatDate(row.valid_from)}
                {row.valid_to ? ` → ${formatDate(row.valid_to)}` : ""}
              </span>
            </div>
          ))}
        </section>
      ) : null}

      <footer className="num border-t border-line-soft pt-4 text-[11px] text-ink-4">
        Last checked {formatDate(claim.last_verified_at)}
      </footer>
    </div>
  );
}

function EvidenceRow({ row, showClass }: { row: EvidenceView; showClass: boolean }) {
  return (
    <section className="flex flex-col gap-2 rounded-panel border border-line-soft bg-panel-deep p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="num text-[10px] tracking-[0.04em] text-ink-3">
          {showClass ? `${EVIDENCE_CLASS_LABEL[row.class] ?? row.class} · ${CONFIDENCE_LABEL[row.confidence]}` : null}
        </span>
        <span
          className={`num text-[10px] tracking-[0.06em] ${row.stance === "CONFLICTS" ? "text-conflict" : "text-ink-4"}`}
        >
          {row.stance}
        </span>
      </div>
      {row.source ? (
        <a
          href={row.source.canonical_url ?? row.source.url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-[12px] text-accent hover:underline"
        >
          {row.source.publisher ? `${row.source.publisher} — ` : ""}
          {row.source.title ?? row.source.url}
          <span className="text-ink-4"> · {SOURCE_KIND_LABEL[row.source.source_kind] ?? "source"} ↗</span>
        </a>
      ) : null}
      {row.excerpt ? <p className="text-[12px]/[1.6] text-ink-2">“{row.excerpt}”</p> : null}
      <div className="num flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ink-4">
        {row.published_at ? <span>published {formatDate(row.published_at)}</span> : null}
        <span>observed {formatDate(row.observed_at)}</span>
      </div>
    </section>
  );
}

/** For an assessment the drawer is an argument, not a status readout. */
function AssessmentBody({
  payload,
  assessment,
}: {
  payload: ClaimEvidenceResponse;
  assessment: AssessmentView;
}) {
  const { claim } = payload;
  const maturity = claim.value.kind === "enum" ? (claim.value.value as Maturity) : null;
  const advance = maturity ? nextMaturity(maturity) : null;

  return (
    <div className="flex flex-col gap-5 p-5">
      <Subject payload={payload} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[20px]/[1.2] font-semibold tracking-[-0.01em]">{claim.label}</span>
        {maturity ? (
          <span className="flex items-center gap-2">
            <MaturitySteps maturity={maturity} />
            <span className="text-[13px] font-medium">{MATURITY_LABEL[maturity]}</span>
          </span>
        ) : null}
        <AnalystMarker />
      </div>

      <section className="flex flex-col gap-1.5 border-l-2 border-analyst/50 pl-3.5">
        <span className="eyebrow text-analyst">Why we rate it this way</span>
        <p className="text-[13px]/[1.65] text-ink-2">{assessment.rationale}</p>
      </section>

      {assessment.advance_criteria.length > 0 ? (
        <section className="flex flex-col gap-2">
          <span className="eyebrow">
            {advance ? `What would move it to ${MATURITY_LABEL[advance]}` : "What would move it"}
          </span>
          <ul className="flex flex-col gap-1.5">
            {assessment.advance_criteria.map((criterion) => (
              <li key={criterion} className="flex gap-2 text-[12px]/[1.6] text-ink-2">
                <span className="text-ink-4">•</span>
                {criterion}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {assessment.regress_criteria.length > 0 ? (
        <section className="flex flex-col gap-2">
          <span className="eyebrow">What would move it back</span>
          <ul className="flex flex-col gap-1.5">
            {assessment.regress_criteria.map((criterion) => (
              <li key={criterion} className="flex gap-2 text-[12px]/[1.6] text-ink-2">
                <span className="text-ink-4">•</span>
                {criterion}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {assessment.evidence_considered.length > 0 ? (
        <section className="flex flex-col gap-2 border-t border-line-soft pt-4">
          <span className="eyebrow">Evidence considered · {assessment.evidence_considered.length}</span>
          {assessment.evidence_considered.map((reference) => (
            <ConsideredRow key={reference.claim_id} claimId={reference.claim_id} sentence={reference.sentence} />
          ))}
        </section>
      ) : null}

      {assessment.notes ? <p className="text-[12px]/[1.6] text-ink-3">{assessment.notes}</p> : null}

      <footer className="num border-t border-line-soft pt-4 text-[11px] text-ink-4">
        {assessment.author} · last reviewed {formatDate(assessment.reviewed_at)}
      </footer>
    </div>
  );
}

function ConsideredRow({ claimId, sentence }: { claimId: string; sentence: string }) {
  const { open } = useEvidence();
  return (
    <button
      type="button"
      onClick={() => open(claimId)}
      className="cursor-pointer text-left text-[12px]/[1.6] text-ink-2 hover:text-accent"
    >
      {sentence}
    </button>
  );
}

export { chipText };
