"use client";

import { useMemo, useState } from "react";
import { CANONICAL_LAYERS, STACK_LAYER_LABEL, type CanonicalLayer } from "@ri/domain";
import type { EntityChip, ExploreLens, StackMatrixResponse } from "@ri/api-contracts";
import { VizStyles } from "./styles.js";
import type { OpenEntity } from "./types.js";

const LENSES: readonly ExploreLens[] = ["embodiment", "market", "technology", "geography", "maturity"];

type Cell = StackMatrixResponse["rows"][number]["cells"][number];

export type ExploreStackMatrixProps = {
  /** GET /explore/stack-matrix for the lens currently shown. */
  data: StackMatrixResponse;
  /** The same route for the other lenses, so the component can own its switcher. */
  responses?: Partial<Record<ExploreLens, StackMatrixResponse>>;
  onOpenEntity?: OpenEntity;
  /** Called when the lens changes and the parent holds a response this one lacks. */
  onLensChange?: (lens: ExploreLens) => void;
};

function title(lens: ExploreLens) {
  return lens === "market" ? "Market" : lens[0]!.toUpperCase() + lens.slice(1);
}

function tone(chip: EntityChip) {
  const tones: Record<string, string> = {
    HUMANOID: "#9d8fd6", COBOT: "#d19a66", INDUSTRIAL_ARM: "#d19a66", AMR: "#6cb28a",
    DRONE: "#6aa6d6", QUADRUPED: "#d07a7a", AUTONOMOUS_VEHICLE: "#7f8fd6",
  };
  return tones[chip.primary_embodiment ?? ""] ?? "#c2b26a";
}

/**
 * The stack-first challenger: the current lens supplies the columns, the eleven
 * canonical layers are the rows, and each cell holds the products and technology
 * classes robots in that column use at that layer.
 *
 * Every cell names its column, so placement is read from the response rather than
 * recomputed here — this component does no fetching and no joining.
 */
export function ExploreStackMatrix({ data, responses, onOpenEntity, onLensChange }: ExploreStackMatrixProps) {
  const [lens, setLens] = useState<ExploreLens>(data.lens);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const selected = responses?.[lens] ?? (lens === data.lens ? data : undefined) ?? data;

  const byColumn = useMemo(() => {
    const index = new Map<string, Cell[]>();
    for (const row of selected.rows) {
      for (const cell of row.cells) {
        const key = `${row.layer}:${cell.column_id}`;
        const bucket = index.get(key);
        if (bucket) bucket.push(cell);
        else index.set(key, [cell]);
      }
    }
    return index;
  }, [selected]);

  const chooseLens = (next: ExploreLens) => {
    setLens(next);
    setExpanded(null);
    if (!responses?.[next]) onLensChange?.(next);
  };

  const columns = selected.columns;

  return <section className="ri-viz" aria-label="Explore stack-first matrix">
    <VizStyles />
    <div className="ri-viz__toolbar">
      <div className="ri-viz__switcher" aria-label="Matrix lens">
        {LENSES.map((option) => <button key={option} type="button" aria-pressed={lens === option} onClick={() => chooseLens(option)}>{title(option)}</button>)}
      </div>
      <span className="ri-viz__hint">columns = {title(selected.lens)} · rows = canonical stack layers · double-click a column to expand</span>
    </div>
    {columns.length === 0
      ? <p className="ri-matrix__legend">Nothing is recorded under this lens yet.</p>
      : <div className="ri-matrix">
          <div className="ri-matrix__grid" style={{ "--ri-columns": columns.length } as React.CSSProperties}>
            <div className="ri-matrix__corner" />
            {columns.map((column) => <button key={column.id} className="ri-matrix__head" type="button" onDoubleClick={() => setExpanded((current) => current === column.id ? null : column.id)} title="Double-click to expand this column">
              {column.label}
            </button>)}
            {CANONICAL_LAYERS.map((layer) => <MatrixRow key={layer} layer={layer} columns={columns} expanded={expanded} byColumn={byColumn} hovered={hovered} setHovered={setHovered} onOpenEntity={onOpenEntity} />)}
          </div>
          <div className="ri-matrix__legend">Marks represent products and technology classes attached to a robot’s canonical stack layer. Empty cells are intentionally quiet.</div>
        </div>}
  </section>;
}

function MatrixRow({ layer, columns, expanded, byColumn, hovered, setHovered, onOpenEntity }: {
  layer: CanonicalLayer;
  columns: StackMatrixResponse["columns"];
  expanded: string | null;
  byColumn: Map<string, Cell[]>;
  hovered: string | null;
  setHovered: (value: string | null) => void;
  onOpenEntity?: OpenEntity;
}) {
  return <>
    <div className="ri-matrix__row-label">{STACK_LAYER_LABEL[layer]}</div>
    {columns.map((column) => {
      const values = byColumn.get(`${layer}:${column.id}`) ?? [];
      const isExpanded = expanded === column.id;
      const visible = isExpanded ? values : values.slice(0, 4);
      return <div key={`${layer}:${column.id}`} className="ri-matrix__cell" data-expanded={isExpanded}>
        {visible.map((cell) => {
          const key = `${column.id}:${layer}:${cell.chip.id}`;
          const isHovered = key === hovered;
          const used = `${cell.robot_count} robot${cell.robot_count === 1 ? "" : "s"}`;
          return isExpanded
            ? <button key={key} className="ri-matrix__chip" type="button" onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)} onClick={() => onOpenEntity?.(cell.chip)} title={`${cell.chip.name} · ${used}`}>{cell.chip.name}{isHovered ? ` · ${used}` : ""}</button>
            : <button key={key} className="ri-matrix__dot" type="button" style={{ "--size": `${Math.min(22, 10 + cell.robot_count * 4)}px`, "--tone": tone(cell.chip) } as React.CSSProperties} onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)} onClick={() => onOpenEntity?.(cell.chip)} aria-label={`${cell.chip.name}, used by ${used} in ${column.label}`} title={`${cell.chip.name} · ${used}`}>{isHovered ? "•" : ""}</button>;
        })}
      </div>;
    })}
  </>;
}
