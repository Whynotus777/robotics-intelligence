"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EntityChip, ExploreLens, ExploreResponse, StackMatrixResponse } from "@ri/api-contracts";
import { ExploreStackMatrix, ExploreTerritories, type ExploreEntityMeta } from "@ri/viz";
import { hrefFor } from "@/lib/vocabulary";

const VIEWS = [
  { id: "territories", label: "Nested territories" },
  { id: "matrix", label: "Stack matrix" },
] as const;

type View = (typeof VIEWS)[number]["id"];

/**
 * The Universe. Both concepts are pure components from @ri/viz; this wrapper owns
 * the toggle between them and turns an entity mark into navigation, which is the
 * one thing the visualization package deliberately does not know how to do.
 *
 * Desktop only: below 1024px the same filters drive the grouped list beneath,
 * because neither a treemap nor an eleven-row matrix survives a 390px viewport.
 */
export function ExploreCanvas({
  responses,
  matrices,
  entityMeta,
}: {
  responses: Partial<Record<ExploreLens, ExploreResponse>>;
  matrices: Partial<Record<ExploreLens, StackMatrixResponse>>;
  entityMeta: Record<string, ExploreEntityMeta>;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("territories");

  const base = responses.embodiment ?? Object.values(responses)[0];
  const matrix = matrices.embodiment ?? Object.values(matrices)[0];
  if (!base) return null;

  const open = (chip: EntityChip) => router.push(hrefFor(chip));
  const byMeasure = Object.fromEntries(
    Object.entries(responses).map(([lens, response]) => [lens, { none: response }]),
  );

  return (
    <div className="hidden flex-col gap-3 lg:flex">
      <div className="flex items-center gap-2">
        <span className="eyebrow">Universe</span>
        <div className="flex gap-0.5 rounded-panel border border-line-soft bg-panel-deep p-0.5">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={view === option.id}
              onClick={() => setView(option.id)}
              className={`cursor-pointer rounded-[4px] px-2.5 py-1.5 text-[12px] transition-colors ${
                view === option.id ? "bg-[#1e222b] text-ink" : "text-ink-3 hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {view === "territories" ? (
        <ExploreTerritories data={base} responses={byMeasure} entityMeta={entityMeta} onOpenEntity={open} />
      ) : matrix ? (
        <ExploreStackMatrix data={matrix} responses={matrices} onOpenEntity={open} />
      ) : null}
    </div>
  );
}
