"use client";

import { useState } from "react";
import Link from "next/link";
import type { StackResponse } from "@ri/api-contracts";
import { EntityChipLink } from "@/components/entity-chip";
import { SourceGlyph } from "@/components/evidence/evidence-chip";
import { STACK_LAYER_LABEL, embodimentColor } from "@/lib/vocabulary";

/**
 * The Robot MRI. Clicking a layer is a focus state, not navigation: the stack
 * compresses to the left and the layer detail opens beside it, parent still
 * visible. Applicable-but-empty layers still draw — the stack is the explanatory
 * object — and they never say "unknown".
 */
export function StackExplorer({ stack }: { stack: StackResponse }) {
  const [focused, setFocused] = useState<string | null>(null);
  const layer = stack.layers.find((row) => row.canonical === focused) ?? null;
  const accent = embodimentColor(stack.embodiment);

  return (
    <div className={`grid gap-6 ${layer ? "lg:grid-cols-[300px_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_260px]"}`}>
      <div className="flex flex-col gap-1">
        {stack.layers.map((row) => {
          const filled = row.items.length > 0 || !!row.architecture_note;
          const active = row.canonical === focused;
          return (
            <div
              key={row.canonical}
              className={`flex flex-col gap-2 rounded-[4px] border px-3 py-2.5 transition-colors ${
                active
                  ? "border-accent/60 bg-panel"
                  : filled
                    ? "border-line-strong bg-panel-deep hover:border-ink-5"
                    : "border-line-soft hover:border-line-strong"
              }`}
              style={active ? { boxShadow: `inset 2px 0 0 ${accent}` } : undefined}
            >
              <button
                type="button"
                onClick={() => setFocused(active ? null : row.canonical)}
                aria-expanded={active}
                className="flex cursor-pointer items-center justify-between gap-3 text-left"
              >
                <span className={`text-[12px] font-medium ${filled ? "text-ink" : "text-ink-4"}`}>{row.label}</span>
                <span className="num shrink-0 text-[10px] text-ink-4">
                  {STACK_LAYER_LABEL[row.canonical] ?? row.canonical}
                </span>
              </button>
              {!layer && row.items.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {row.items.map((item) => (
                    <span key={item.claim_id} className="inline-flex items-center gap-1">
                      <EntityChipLink chip={item.entity} />
                      <SourceGlyph summary={item.evidence_summary} claimId={item.claim_id} />
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {layer ? (
        <section className="flex flex-col gap-5 rounded-panel border border-line-soft bg-panel-deep p-5">
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="eyebrow">{STACK_LAYER_LABEL[layer.canonical] ?? layer.canonical}</span>
              <h2 className="text-[20px]/[1.2] font-semibold tracking-[-0.01em]">{layer.label}</h2>
            </div>
            <button
              type="button"
              onClick={() => setFocused(null)}
              className="num cursor-pointer rounded-[3px] border border-line-strong px-1.5 py-[3px] text-[10px] text-ink-4 hover:text-ink"
            >
              Esc · close
            </button>
          </header>

          {layer.architecture_note ? (
            <div className="flex flex-col gap-1.5">
              <span className="eyebrow">Known architecture</span>
              <p className="max-w-[640px] text-[13px]/[1.65] text-ink-2">
                {layer.architecture_note.text}{" "}
                <SourceGlyph
                  summary={layer.architecture_note.evidence_summary}
                  claimId={layer.architecture_note.claim_id}
                />
              </p>
            </div>
          ) : null}

          {layer.items.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Components and technologies</span>
              <div className="flex flex-wrap gap-2">
                {layer.items.map((item) => (
                  <span key={item.claim_id} className="inline-flex items-center gap-1">
                    <EntityChipLink chip={item.entity} showType />
                    <SourceGlyph summary={item.evidence_summary} claimId={item.claim_id} />
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[13px]/[1.65] text-ink-4">
              This layer applies to a {stack.embodiment.replaceAll("_", " ").toLowerCase()} but nothing is sourced for it
              yet.
            </p>
          )}

          <Link href={`/r/${stack.robot.slug}`} className="text-[12px] text-accent hover:underline">
            Back to {stack.robot.name} →
          </Link>
        </section>
      ) : (
        <aside className="flex h-fit flex-col gap-3 rounded-panel border border-line-soft bg-panel-deep p-4">
          <span className="eyebrow">Safety · cross-cutting</span>
          {stack.safety.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stack.safety.map((item) => (
                <span key={item.claim_id} className="inline-flex items-center gap-1">
                  <EntityChipLink chip={item.entity} />
                  <SourceGlyph summary={item.evidence_summary} claimId={item.claim_id} />
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[12px]/[1.6] text-ink-4">
              Safety is drawn alongside the stack, not as a layer. Nothing is sourced for this robot yet.
            </p>
          )}
          <p className="border-t border-line-soft pt-3 text-[12px]/[1.6] text-ink-4">
            Click a layer to focus it. The stack compresses and the layer detail opens beside it.
          </p>
        </aside>
      )}
    </div>
  );
}
